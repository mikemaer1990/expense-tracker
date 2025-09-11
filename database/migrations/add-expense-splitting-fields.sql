-- Migration: Add expense splitting fields to expenses table
-- Run this in your Supabase SQL editor

-- Add expense splitting columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS original_amount NUMERIC,
ADD COLUMN IF NOT EXISTS split_with TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN expenses.is_split IS 'Whether this expense was split with others';
COMMENT ON COLUMN expenses.original_amount IS 'Original full amount before splitting (null if not split)';
COMMENT ON COLUMN expenses.split_with IS 'Description of who the expense was split with (e.g., "GF", "Roommate")';

-- Add constraint to ensure original_amount is provided when is_split is true
ALTER TABLE expenses 
ADD CONSTRAINT check_split_original_amount 
CHECK (
  (is_split = false) OR 
  (is_split = true AND original_amount IS NOT NULL AND original_amount > 0)
);

-- Add index for filtering split expenses
CREATE INDEX IF NOT EXISTS idx_expenses_is_split ON expenses(is_split);

-- Update existing expenses to have default values
UPDATE expenses 
SET is_split = false 
WHERE is_split IS NULL;