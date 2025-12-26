-- =====================================================
-- EXPENSE TRACKER - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This file represents the complete database structure
-- for the Expense Tracker application as of 2025-12-26
--
-- Run this on a fresh Supabase project to recreate the
-- entire database structure with all features including
-- recurring expenses, user preferences, and icon support.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Categories table (Fixed/Variable/Optional expenses)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6B7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    CONSTRAINT categories_user_name_unique UNIQUE(user_id, name)
);

-- Expense Types table (Rent, Groceries, Gas, etc.)
CREATE TABLE IF NOT EXISTS expense_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    icon_name TEXT DEFAULT 'CurrencyDollarIcon',
    is_user_created BOOLEAN DEFAULT false,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    CONSTRAINT expense_types_category_name_unique UNIQUE(category_id, name)
);

-- Expenses table (Individual expense transactions)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expense_type_id UUID NOT NULL REFERENCES expense_types(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurring_expense_id UUID, -- For linking related recurring expenses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_split BOOLEAN NOT NULL DEFAULT false,
    original_amount NUMERIC,
    split_with TEXT
);

-- Income table (Income tracking with recurring support)
CREATE TABLE IF NOT EXISTS income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    source TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    description TEXT
);

-- User Preferences table (Cross-device settings sync)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency VARCHAR(3) DEFAULT 'CAD' NOT NULL,
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY' NOT NULL,
    theme VARCHAR(10) DEFAULT 'light' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    enable_expense_splitting BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT user_preferences_user_id_unique UNIQUE(user_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_type_id ON expenses(expense_type_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_is_recurring ON expenses(is_recurring);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Income indexes  
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_is_recurring ON income(is_recurring);

-- Categories and expense types indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_types_category_id ON expense_types(category_id);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Users can view their own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- Expense types policies
CREATE POLICY "Users can view expense types for their categories" ON expense_types
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = expense_types.category_id 
            AND categories.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert expense types for their categories" ON expense_types
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = expense_types.category_id 
            AND categories.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update expense types for their categories" ON expense_types
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = expense_types.category_id 
            AND categories.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete expense types for their categories" ON expense_types
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM categories 
            WHERE categories.id = expense_types.category_id 
            AND categories.user_id = auth.uid()
        )
    );

-- Expenses policies
CREATE POLICY "Users can view their own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Income policies
CREATE POLICY "Users can view their own income" ON income
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own income" ON income
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income" ON income
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income" ON income
    FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR AUTO-CREATING DEFAULT DATA
-- =====================================================

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_user_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default categories
    INSERT INTO public.categories (user_id, name, color) VALUES
        (NEW.id, 'Fixed Expenses', '#EF4444'),
        (NEW.id, 'Variable Expenses', '#F59E0B'), 
        (NEW.id, 'Optional Expenses', '#8B5CF6');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default categories when user signs up
CREATE OR REPLACE TRIGGER create_user_default_categories_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_default_categories();

-- Function to create default expense types when categories are created
CREATE OR REPLACE FUNCTION create_default_expense_types()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default expense types based on category name
    IF NEW.name = 'Fixed Expenses' THEN
        INSERT INTO public.expense_types (category_id, name, icon_name, is_user_created, created_by_user_id) VALUES
            (NEW.id, 'Rent/Mortgage', 'HomeIcon', false, NULL),
            (NEW.id, 'Insurance', 'ShieldCheckIcon', false, NULL),
            (NEW.id, 'Phone', 'DevicePhoneMobileIcon', false, NULL),
            (NEW.id, 'Internet', 'WifiIcon', false, NULL);
    ELSIF NEW.name = 'Variable Expenses' THEN
        INSERT INTO public.expense_types (category_id, name, icon_name, is_user_created, created_by_user_id) VALUES
            (NEW.id, 'Groceries', 'ShoppingCartIcon', false, NULL),
            (NEW.id, 'Gas', 'TruckIcon', false, NULL),
            (NEW.id, 'Utilities', 'BoltIcon', false, NULL),
            (NEW.id, 'Transportation', 'MapPinIcon', false, NULL),
            (NEW.id, 'Maintenance', 'WrenchScrewdriverIcon', false, NULL);
    ELSIF NEW.name = 'Optional Expenses' THEN
        INSERT INTO public.expense_types (category_id, name, icon_name, is_user_created, created_by_user_id) VALUES
            (NEW.id, 'Dining Out', 'CakeIcon', false, NULL),
            (NEW.id, 'Entertainment', 'FilmIcon', false, NULL),
            (NEW.id, 'Shopping', 'GiftIcon', false, NULL),
            (NEW.id, 'Hobbies', 'PuzzlePieceIcon', false, NULL),
            (NEW.id, 'Travel', 'PaperAirplaneIcon', false, NULL);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default expense types when categories are created
CREATE OR REPLACE TRIGGER create_default_expense_types_trigger
    AFTER INSERT ON categories
    FOR EACH ROW
    EXECUTE FUNCTION create_default_expense_types();

-- Function to automatically update updated_at timestamp for user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on user_preferences changes
CREATE OR REPLACE TRIGGER update_user_preferences_updated_at_trigger
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_user_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id, currency, date_format, theme, enable_expense_splitting)
    VALUES (NEW.id, 'CAD', 'MM/DD/YYYY', 'light', false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when user signs up
CREATE OR REPLACE TRIGGER create_user_default_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_default_preferences();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get user's total expenses for a date range
CREATE OR REPLACE FUNCTION get_user_expenses_total(
    p_user_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
    total_expenses NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(amount), 0)
    INTO total_expenses
    FROM expenses
    WHERE user_id = p_user_id
        AND (p_start_date IS NULL OR date >= p_start_date)
        AND (p_end_date IS NULL OR date <= p_end_date);
    
    RETURN total_expenses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's total income for a date range
CREATE OR REPLACE FUNCTION get_user_income_total(
    p_user_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
    total_income NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(amount), 0)
    INTO total_income
    FROM income
    WHERE user_id = p_user_id
        AND (p_start_date IS NULL OR date >= p_start_date)
        AND (p_end_date IS NULL OR date <= p_end_date);
    
    RETURN total_income;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Table comments
COMMENT ON TABLE categories IS 'User-defined expense categories (Fixed/Variable/Optional)';
COMMENT ON TABLE expense_types IS 'Specific expense types within categories (Rent, Groceries, etc.) with icon support';
COMMENT ON TABLE expenses IS 'Individual expense transactions with recurring and splitting support';
COMMENT ON TABLE income IS 'Income tracking records with recurring support';
COMMENT ON TABLE user_preferences IS 'User settings and preferences with cross-device sync support';

-- Important column comments
COMMENT ON COLUMN expenses.is_recurring IS 'Whether this expense is recurring (rent, utilities, etc.)';
COMMENT ON COLUMN expenses.recurring_expense_id IS 'Links related recurring expense entries together';
COMMENT ON COLUMN expenses.is_split IS 'Whether this expense has been split (50/50)';
COMMENT ON COLUMN expenses.original_amount IS 'Original amount before splitting (if is_split = true)';
COMMENT ON COLUMN expenses.split_with IS 'Name of person this expense is split with';
COMMENT ON COLUMN income.is_recurring IS 'Whether this income is recurring (salary, etc.)';
COMMENT ON COLUMN expense_types.icon_name IS 'Heroicon name for visual representation';
COMMENT ON COLUMN expense_types.is_user_created IS 'Whether this expense type was created by user (vs system default)';
COMMENT ON COLUMN user_preferences.currency IS 'User preferred currency (USD, EUR, GBP, CAD, AUD)';
COMMENT ON COLUMN user_preferences.enable_expense_splitting IS 'Whether expense splitting feature is enabled';

-- =====================================================
-- SCHEMA VERSION & NOTES
-- =====================================================

-- Schema version tracking (optional)
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('2025.12.26.001', 'Complete schema with recurring expenses, user preferences, and icon support')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

/*
FEATURES INCLUDED IN THIS SCHEMA:

✅ Complete table structure matching your current database
✅ Recurring expenses and income functionality
✅ User preferences with cross-device sync
✅ Expense type icons with Heroicons support
✅ Custom user-created expense types
✅ Expense splitting support
✅ Row Level Security (RLS) policies for data isolation
✅ Performance indexes on key columns
✅ Auto-creation of default categories, expense types, and preferences
✅ Foreign key relationships with CASCADE delete
✅ Utility functions for calculating totals
✅ Proper UUID primary keys
✅ Timestamp tracking (created_at, updated_at)
✅ Data validation constraints

KEY FEATURES:

RECURRING EXPENSES & INCOME:
- Uses is_recurring boolean flag
- Stores frequency information in description field
- Supports frequencies: weekly, biweekly, monthly, quarterly, yearly
- recurring_expense_id field for linking related recurring entries

USER PREFERENCES:
- Currency selection (USD, EUR, GBP, CAD, AUD)
- Date format preferences
- Theme selection (light/dark)
- Expense splitting toggle
- Cross-device synchronization via Supabase
- Automatic preference creation on user signup

EXPENSE TYPE ICONS:
- Heroicons integration for visual representation
- 60+ categorized icons available
- icon_name field stores Heroicon component name
- is_user_created flag distinguishes user-created vs system types
- Default icons assigned to all system expense types

DEPLOYMENT:
- Run this entire file on a fresh Supabase project
- All policies, indexes, and triggers will be created automatically
- Default categories, expense types, and preferences created for new users
- All functions use SECURITY DEFINER to bypass RLS during auto-creation
*/