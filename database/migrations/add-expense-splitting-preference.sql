-- Migration: Add expense splitting preference to user_preferences table
-- Run this in your Supabase SQL editor

-- Add enable_expense_splitting column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS enable_expense_splitting BOOLEAN DEFAULT false NOT NULL;

-- Update the comment for the table to reflect new functionality
COMMENT ON COLUMN user_preferences.enable_expense_splitting IS 'Whether user has enabled expense splitting functionality';

-- Update existing users to have the default value (false)
UPDATE user_preferences 
SET enable_expense_splitting = false 
WHERE enable_expense_splitting IS NULL;

-- Update the trigger function to include the new column for new users
CREATE OR REPLACE FUNCTION create_user_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id, currency, date_format, theme, enable_expense_splitting)
  VALUES (NEW.id, 'CAD', 'MM/DD/YYYY', 'light', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;