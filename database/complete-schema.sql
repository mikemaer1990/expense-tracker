-- =====================================================
-- EXPENSE TRACKER - COMPLETE DATABASE SCHEMA
-- =====================================================
-- This file represents the complete database structure
-- for the Expense Tracker application as of 2025-09-09
-- 
-- Run this on a fresh Supabase project to recreate the
-- entire database structure with all features including
-- recurring expenses functionality.
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

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
        INSERT INTO public.expense_types (category_id, name) VALUES
            (NEW.id, 'Rent/Mortgage'),
            (NEW.id, 'Insurance'),
            (NEW.id, 'Phone'),
            (NEW.id, 'Internet'),
            (NEW.id, 'Subscriptions');
    ELSIF NEW.name = 'Variable Expenses' THEN
        INSERT INTO public.expense_types (category_id, name) VALUES
            (NEW.id, 'Groceries'),
            (NEW.id, 'Gas'),
            (NEW.id, 'Utilities'),
            (NEW.id, 'Transportation'),
            (NEW.id, 'Maintenance');
    ELSIF NEW.name = 'Optional Expenses' THEN
        INSERT INTO public.expense_types (category_id, name) VALUES
            (NEW.id, 'Dining Out'),
            (NEW.id, 'Entertainment'),
            (NEW.id, 'Shopping'),
            (NEW.id, 'Hobbies'),
            (NEW.id, 'Travel');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default expense types when categories are created
CREATE OR REPLACE TRIGGER create_default_expense_types_trigger
    AFTER INSERT ON categories
    FOR EACH ROW
    EXECUTE FUNCTION create_default_expense_types();

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
COMMENT ON TABLE expense_types IS 'Specific expense types within categories (Rent, Groceries, etc.)';
COMMENT ON TABLE expenses IS 'Individual expense transactions with recurring support';
COMMENT ON TABLE income IS 'Income tracking records with recurring support';

-- Important column comments
COMMENT ON COLUMN expenses.is_recurring IS 'Whether this expense is recurring (rent, utilities, etc.)';
COMMENT ON COLUMN expenses.recurring_expense_id IS 'Links related recurring expense entries together';
COMMENT ON COLUMN income.is_recurring IS 'Whether this income is recurring (salary, etc.)';

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
VALUES ('2025.09.09.001', 'Complete schema with recurring expenses functionality')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

/*
FEATURES INCLUDED IN THIS SCHEMA:

✅ Complete table structure matching your current database
✅ Recurring expenses functionality (is_recurring column)
✅ Recurring income functionality  
✅ Row Level Security (RLS) policies for data isolation
✅ Performance indexes on key columns
✅ Auto-creation of default categories and expense types
✅ Foreign key relationships with CASCADE delete
✅ Utility functions for calculating totals
✅ Proper UUID primary keys
✅ Timestamp tracking (created_at, updated_at)
✅ Data validation constraints

RECURRING EXPENSES IMPLEMENTATION:
- Uses is_recurring boolean flag
- Stores frequency information in description field
- Supports same frequencies as income: weekly, biweekly, monthly, quarterly, yearly
- recurring_expense_id field for linking related recurring entries
- Full UI support in AddExpense and EditExpense components
- Visual indicators in Dashboard and History views

DEPLOYMENT:
- Run this entire file on a fresh Supabase project
- All policies, indexes, and triggers will be created automatically
- Default categories and expense types will be created for new users
*/