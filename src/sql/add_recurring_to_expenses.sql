-- Add recurring functionality to expenses table
-- Run this in Supabase SQL Editor

-- Add is_recurring column to expenses table
ALTER TABLE expenses 
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN expenses.is_recurring IS 'Whether this expense is a recurring expense';

-- Update any existing expenses to be non-recurring (default)
UPDATE expenses 
SET is_recurring = FALSE 
WHERE is_recurring IS NULL;

-- Optional: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_is_recurring ON expenses(is_recurring);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
  AND table_schema = 'public'
ORDER BY ordinal_position;