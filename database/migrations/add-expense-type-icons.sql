-- =====================================================
-- ADD EXPENSE TYPE ICONS AND USER CREATION TRACKING
-- =====================================================
-- Migration to add icon support and user creation tracking
-- to expense_types table for custom expense types feature
-- 
-- Run Date: 2025-09-09
-- =====================================================

-- Add new columns to expense_types table
ALTER TABLE expense_types 
ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'CurrencyDollarIcon',
ADD COLUMN IF NOT EXISTS is_user_created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add unique constraint to prevent users from reusing icons
-- Users can't have duplicate icons, but different users can use the same icon
ALTER TABLE expense_types 
ADD CONSTRAINT IF NOT EXISTS unique_user_icon 
UNIQUE(created_by_user_id, icon_name);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_expense_types_user_created ON expense_types(is_user_created);
CREATE INDEX IF NOT EXISTS idx_expense_types_created_by_user ON expense_types(created_by_user_id);

-- Update existing expense types with appropriate default icons
-- Fixed Expenses icons
UPDATE expense_types 
SET icon_name = CASE 
    WHEN name ILIKE '%rent%' OR name ILIKE '%mortgage%' THEN 'HomeIcon'
    WHEN name ILIKE '%insurance%' THEN 'ShieldCheckIcon'
    WHEN name ILIKE '%phone%' THEN 'DevicePhoneMobileIcon'
    WHEN name ILIKE '%internet%' THEN 'WifiIcon'
    WHEN name ILIKE '%subscription%' THEN 'RectangleStackIcon'
    ELSE 'BuildingOfficeIcon'
END
WHERE id IN (
    SELECT et.id FROM expense_types et
    JOIN categories c ON et.category_id = c.id
    WHERE c.name = 'Fixed Expenses'
);

-- Variable Expenses icons  
UPDATE expense_types 
SET icon_name = CASE 
    WHEN name ILIKE '%groceries%' OR name ILIKE '%food%' THEN 'ShoppingCartIcon'
    WHEN name ILIKE '%gas%' OR name ILIKE '%fuel%' THEN 'TruckIcon'
    WHEN name ILIKE '%utilities%' OR name ILIKE '%electric%' OR name ILIKE '%water%' THEN 'BoltIcon'
    WHEN name ILIKE '%transport%' OR name ILIKE '%uber%' OR name ILIKE '%taxi%' THEN 'MapPinIcon'
    WHEN name ILIKE '%maintenance%' OR name ILIKE '%repair%' THEN 'WrenchScrewdriverIcon'
    ELSE 'ShoppingBagIcon'
END
WHERE id IN (
    SELECT et.id FROM expense_types et
    JOIN categories c ON et.category_id = c.id
    WHERE c.name = 'Variable Expenses'
);

-- Optional Expenses icons
UPDATE expense_types 
SET icon_name = CASE 
    WHEN name ILIKE '%dining%' OR name ILIKE '%restaurant%' OR name ILIKE '%food%' THEN 'CakeIcon'
    WHEN name ILIKE '%entertainment%' OR name ILIKE '%movie%' OR name ILIKE '%show%' THEN 'FilmIcon'
    WHEN name ILIKE '%shopping%' OR name ILIKE '%clothes%' THEN 'GiftIcon'
    WHEN name ILIKE '%hobbies%' OR name ILIKE '%hobby%' THEN 'PuzzlePieceIcon'
    WHEN name ILIKE '%travel%' OR name ILIKE '%vacation%' THEN 'PaperAirplaneIcon'
    ELSE 'SparklesIcon'
END
WHERE id IN (
    SELECT et.id FROM expense_types et
    JOIN categories c ON et.category_id = c.id
    WHERE c.name = 'Optional Expenses'
);

-- Add comments for documentation
COMMENT ON COLUMN expense_types.icon_name IS 'Heroicon component name for visual representation';
COMMENT ON COLUMN expense_types.is_user_created IS 'Whether this expense type was created by a user (vs system default)';
COMMENT ON COLUMN expense_types.created_by_user_id IS 'ID of user who created this expense type (null for system defaults)';

-- Update RLS policies to handle user-created expense types
-- Drop existing policies if they exist and recreate with user creation support
DROP POLICY IF EXISTS "Users can view expense types for their categories" ON expense_types;
DROP POLICY IF EXISTS "Users can insert expense types for their categories" ON expense_types;
DROP POLICY IF EXISTS "Users can update expense types for their categories" ON expense_types;
DROP POLICY IF EXISTS "Users can delete expense types for their categories" ON expense_types;

-- Recreate policies with user-created expense types support
CREATE POLICY "Users can view expense types for their categories or created by them" ON expense_types
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = expense_types.category_id 
            AND categories.user_id = auth.uid()
        )
        OR created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can insert expense types for their categories" ON expense_types
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = expense_types.category_id 
            AND categories.user_id = auth.uid()
        )
        AND (created_by_user_id = auth.uid() OR created_by_user_id IS NULL)
    );

CREATE POLICY "Users can update their own expense types or shared ones in their categories" ON expense_types
    FOR UPDATE USING (
        (created_by_user_id = auth.uid()) -- Own expense types
        OR (
            created_by_user_id IS NULL -- System defaults
            AND EXISTS (
                SELECT 1 FROM categories 
                WHERE categories.id = expense_types.category_id 
                AND categories.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete only their own user-created expense types" ON expense_types
    FOR DELETE USING (
        created_by_user_id = auth.uid()
        AND is_user_created = true
    );

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'expense_types' 
  AND table_schema = 'public'
  AND column_name IN ('icon_name', 'is_user_created', 'created_by_user_id')
ORDER BY ordinal_position;

-- Show sample of updated expense types
SELECT 
    et.name,
    et.icon_name,
    et.is_user_created,
    c.name as category_name
FROM expense_types et
JOIN categories c ON et.category_id = c.id
LIMIT 10;