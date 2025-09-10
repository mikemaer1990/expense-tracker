-- =====================================================
-- UPDATE DEFAULT EXPENSE TYPE ICONS
-- =====================================================
-- Migration to update icons for existing default expense types
-- Run this whenever you want to update the default icon set
-- =====================================================

-- Backup current icons (optional - creates a backup table)
CREATE TABLE IF NOT EXISTS expense_types_icon_backup AS 
SELECT id, name, icon_name, created_at 
FROM expense_types 
WHERE is_user_created = false;

-- Update Fixed Expenses with new/better icons
UPDATE expense_types 
SET icon_name = CASE 
    WHEN name ILIKE '%rent%' OR name ILIKE '%mortgage%' THEN 'HomeIcon'
    WHEN name ILIKE '%insurance%' THEN 'ShieldCheckIcon'
    WHEN name ILIKE '%phone%' THEN 'DevicePhoneMobileIcon'
    WHEN name ILIKE '%internet%' THEN 'WifiIcon'
    WHEN name ILIKE '%subscription%' THEN 'RectangleStackIcon'
    WHEN name ILIKE '%utilities%' THEN 'BoltIcon'  -- Updated: Better icon for utilities
    WHEN name ILIKE '%car%' OR name ILIKE '%vehicle%' THEN 'TruckIcon'  -- New: Better car icon
    WHEN name ILIKE '%loan%' THEN 'CreditCardIcon'  -- New mapping
    ELSE 'BuildingOfficeIcon'
END
WHERE id IN (
    SELECT et.id FROM expense_types et
    JOIN categories c ON et.category_id = c.id
    WHERE c.name = 'Fixed Expenses' AND et.is_user_created = false
);

-- Update Variable Expenses with new/better icons
UPDATE expense_types 
SET icon_name = CASE 
    WHEN name ILIKE '%groceries%' OR name ILIKE '%food%' THEN 'ShoppingCartIcon'
    WHEN name ILIKE '%gas%' OR name ILIKE '%fuel%' THEN 'TruckIcon'
    WHEN name ILIKE '%utilities%' OR name ILIKE '%electric%' OR name ILIKE '%water%' THEN 'BoltIcon'
    WHEN name ILIKE '%transport%' OR name ILIKE '%uber%' OR name ILIKE '%taxi%' THEN 'MapPinIcon'
    WHEN name ILIKE '%maintenance%' OR name ILIKE '%repair%' THEN 'WrenchScrewdriverIcon'
    WHEN name ILIKE '%medical%' OR name ILIKE '%health%' THEN 'HeartIcon'  -- New mapping
    WHEN name ILIKE '%clothing%' OR name ILIKE '%clothes%' THEN 'ShoppingBagIcon'  -- Updated
    ELSE 'ShoppingBagIcon'
END
WHERE id IN (
    SELECT et.id FROM expense_types et
    JOIN categories c ON et.category_id = c.id
    WHERE c.name = 'Variable Expenses' AND et.is_user_created = false
);

-- Update Optional Expenses with new/better icons
UPDATE expense_types 
SET icon_name = CASE 
    WHEN name ILIKE '%dining%' OR name ILIKE '%restaurant%' OR name ILIKE '%food%' THEN 'CakeIcon'
    WHEN name ILIKE '%entertainment%' OR name ILIKE '%movie%' OR name ILIKE '%show%' THEN 'FilmIcon'
    WHEN name ILIKE '%shopping%' OR name ILIKE '%clothes%' THEN 'GiftIcon'
    WHEN name ILIKE '%hobbies%' OR name ILIKE '%hobby%' THEN 'PuzzlePieceIcon'
    WHEN name ILIKE '%travel%' OR name ILIKE '%vacation%' THEN 'PaperAirplaneIcon'
    WHEN name ILIKE '%coffee%' OR name ILIKE '%cafe%' THEN 'CoffeeIcon'  -- New mapping
    WHEN name ILIKE '%gym%' OR name ILIKE '%fitness%' THEN 'HeartIcon'  -- New mapping
    ELSE 'SparklesIcon'
END
WHERE id IN (
    SELECT et.id FROM expense_types et
    JOIN categories c ON et.category_id = c.id
    WHERE c.name = 'Optional Expenses' AND et.is_user_created = false
);

-- Show updated results
SELECT 
    et.name,
    et.icon_name,
    c.name as category_name,
    'Updated' as status
FROM expense_types et
JOIN categories c ON et.category_id = c.id
WHERE et.is_user_created = false
ORDER BY c.name, et.name;

-- Clean up backup table (optional - remove this line to keep backup)
-- DROP TABLE expense_types_icon_backup;