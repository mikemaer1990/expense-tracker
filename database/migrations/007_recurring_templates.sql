-- Migration 007: Recurring Templates Auto-Generation System
-- This migration transforms recurring transactions from manual tags to automated generation

-- ============================================================================
-- STEP 1: Create recurring_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS recurring_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Template type
    template_type VARCHAR(10) NOT NULL CHECK (template_type IN ('expense', 'income')),

    -- Common fields
    amount NUMERIC NOT NULL CHECK (amount > 0),
    description TEXT,

    -- Expense-specific fields (nullable for income templates)
    expense_type_id UUID REFERENCES expense_types(id) ON DELETE CASCADE,
    is_split BOOLEAN DEFAULT false,
    original_amount NUMERIC, -- For split expenses
    split_with TEXT,

    -- Income-specific fields (nullable for expense templates)
    source TEXT, -- Income source

    -- Recurring configuration
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE, -- NULL = ongoing

    -- Generation tracking
    last_generated_date DATE, -- Last date we generated an instance for
    next_generation_date DATE, -- Next date to generate (computed)

    -- Metadata
    is_active BOOLEAN DEFAULT true, -- Can be paused without deletion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Constraints
    CONSTRAINT valid_expense_template CHECK (
        template_type != 'expense' OR expense_type_id IS NOT NULL
    ),
    CONSTRAINT valid_income_template CHECK (
        template_type != 'income' OR source IS NOT NULL
    )
);

-- ============================================================================
-- STEP 2: Create indexes for recurring_templates
-- ============================================================================

CREATE INDEX idx_recurring_templates_user_id ON recurring_templates(user_id);
CREATE INDEX idx_recurring_templates_next_generation ON recurring_templates(next_generation_date) WHERE is_active = true;
CREATE INDEX idx_recurring_templates_type ON recurring_templates(template_type);
CREATE INDEX idx_recurring_templates_active ON recurring_templates(is_active);

-- ============================================================================
-- STEP 3: Enable RLS and create policies for recurring_templates
-- ============================================================================

ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view their own recurring templates" ON recurring_templates
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own templates
CREATE POLICY "Users can insert their own recurring templates" ON recurring_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update their own recurring templates" ON recurring_templates
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own recurring templates" ON recurring_templates
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: Add new columns to expenses table
-- ============================================================================

ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS recurring_template_id UUID REFERENCES recurring_templates(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_generated BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_recurring_template ON expenses(recurring_template_id);
CREATE INDEX IF NOT EXISTS idx_expenses_is_generated ON expenses(is_generated);

-- Add comments
COMMENT ON COLUMN expenses.recurring_template_id IS 'Links to the recurring template that generated this expense';
COMMENT ON COLUMN expenses.is_generated IS 'True if auto-generated from recurring template, false if user-created';

-- ============================================================================
-- STEP 5: Add new columns to income table
-- ============================================================================

ALTER TABLE income
ADD COLUMN IF NOT EXISTS recurring_template_id UUID REFERENCES recurring_templates(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_generated BOOLEAN DEFAULT false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_income_recurring_template ON income(recurring_template_id);
CREATE INDEX IF NOT EXISTS idx_income_is_generated ON income(is_generated);

-- Add comments
COMMENT ON COLUMN income.recurring_template_id IS 'Links to the recurring template that generated this income';
COMMENT ON COLUMN income.is_generated IS 'True if auto-generated from recurring template, false if user-created';

-- ============================================================================
-- STEP 6: Create helper function to calculate next recurring date
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_next_recurring_date(
    input_date DATE,
    frequency VARCHAR(20)
)
RETURNS DATE AS $$
BEGIN
    RETURN CASE frequency
        WHEN 'weekly' THEN input_date + INTERVAL '7 days'
        WHEN 'biweekly' THEN input_date + INTERVAL '14 days'
        WHEN 'monthly' THEN input_date + INTERVAL '1 month'
        WHEN 'quarterly' THEN input_date + INTERVAL '3 months'
        WHEN 'yearly' THEN input_date + INTERVAL '1 year'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 7: Create trigger function to update template generation dates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_template_generation_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- This trigger runs AFTER INSERT on expenses/income with recurring_template_id
    IF NEW.recurring_template_id IS NOT NULL AND NEW.is_generated = true THEN
        UPDATE recurring_templates
        SET
            last_generated_date = NEW.date,
            next_generation_date = calculate_next_recurring_date(NEW.date, frequency)
        WHERE id = NEW.recurring_template_id
            AND (last_generated_date IS NULL OR NEW.date > last_generated_date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Create triggers for both expenses and income tables
-- ============================================================================

DROP TRIGGER IF EXISTS update_template_after_expense_generation ON expenses;
CREATE TRIGGER update_template_after_expense_generation
    AFTER INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_template_generation_dates();

DROP TRIGGER IF EXISTS update_template_after_income_generation ON income;
CREATE TRIGGER update_template_after_income_generation
    AFTER INSERT ON income
    FOR EACH ROW
    EXECUTE FUNCTION update_template_generation_dates();

-- ============================================================================
-- STEP 9: Migrate existing recurring expenses to templates
-- ============================================================================

-- Create templates from existing recurring expenses
INSERT INTO recurring_templates (
    user_id,
    template_type,
    amount,
    description,
    expense_type_id,
    is_split,
    original_amount,
    split_with,
    frequency,
    start_date,
    last_generated_date,
    next_generation_date,
    is_active
)
SELECT
    e.user_id,
    'expense'::VARCHAR(10),
    e.amount,
    -- Clean up description - remove "Recurring: every X -" prefix
    CASE
        WHEN e.description LIKE 'Recurring:%' THEN
            TRIM(SUBSTRING(e.description FROM POSITION(' - ' IN e.description) + 3))
        ELSE e.description
    END,
    e.expense_type_id,
    COALESCE(e.is_split, false),
    e.original_amount,
    e.split_with,
    -- Parse frequency from description
    CASE
        WHEN e.description LIKE '%every 2 weeks%' THEN 'biweekly'::VARCHAR(20)
        WHEN e.description LIKE '%every week%' THEN 'weekly'::VARCHAR(20)
        WHEN e.description LIKE '%every month%' THEN 'monthly'::VARCHAR(20)
        WHEN e.description LIKE '%every quarter%' OR e.description LIKE '%every 3 months%' THEN 'quarterly'::VARCHAR(20)
        WHEN e.description LIKE '%every year%' THEN 'yearly'::VARCHAR(20)
        ELSE 'monthly'::VARCHAR(20) -- Default fallback
    END,
    e.date, -- Use existing date as start_date
    e.date, -- Mark as already generated
    calculate_next_recurring_date(
        e.date,
        CASE
            WHEN e.description LIKE '%every 2 weeks%' THEN 'biweekly'
            WHEN e.description LIKE '%every week%' THEN 'weekly'
            WHEN e.description LIKE '%every month%' THEN 'monthly'
            WHEN e.description LIKE '%every quarter%' OR e.description LIKE '%every 3 months%' THEN 'quarterly'
            WHEN e.description LIKE '%every year%' THEN 'yearly'
            ELSE 'monthly'
        END
    ), -- Calculate next generation date
    true -- is_active
FROM expenses e
WHERE e.is_recurring = true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 10: Link existing recurring expenses to their new templates
-- ============================================================================

-- Update expenses with template references
UPDATE expenses e
SET
    recurring_template_id = rt.id,
    is_generated = false, -- Original user-created entry
    description = CASE
        WHEN e.description LIKE 'Recurring:%' THEN
            TRIM(SUBSTRING(e.description FROM POSITION(' - ' IN e.description) + 3))
        ELSE e.description
    END -- Clean up description
FROM recurring_templates rt
WHERE e.user_id = rt.user_id
    AND e.expense_type_id = rt.expense_type_id
    AND e.amount = rt.amount
    AND e.date = rt.start_date
    AND e.is_recurring = true
    AND rt.template_type = 'expense'
    AND e.recurring_template_id IS NULL;

-- ============================================================================
-- STEP 11: Migrate existing recurring income to templates
-- ============================================================================

-- Create templates from existing recurring income
INSERT INTO recurring_templates (
    user_id,
    template_type,
    amount,
    description,
    source,
    frequency,
    start_date,
    last_generated_date,
    next_generation_date,
    is_active
)
SELECT
    i.user_id,
    'income'::VARCHAR(10),
    i.amount,
    -- Clean up description
    CASE
        WHEN i.description LIKE 'Recurring:%' THEN
            TRIM(SUBSTRING(i.description FROM POSITION(' - ' IN i.description) + 3))
        ELSE i.description
    END,
    i.source,
    -- Parse frequency from description
    CASE
        WHEN i.description LIKE '%every 2 weeks%' THEN 'biweekly'::VARCHAR(20)
        WHEN i.description LIKE '%every week%' THEN 'weekly'::VARCHAR(20)
        WHEN i.description LIKE '%every month%' THEN 'monthly'::VARCHAR(20)
        WHEN i.description LIKE '%every quarter%' OR i.description LIKE '%every 3 months%' THEN 'quarterly'::VARCHAR(20)
        WHEN i.description LIKE '%every year%' THEN 'yearly'::VARCHAR(20)
        ELSE 'monthly'::VARCHAR(20)
    END,
    i.date,
    i.date,
    calculate_next_recurring_date(
        i.date,
        CASE
            WHEN i.description LIKE '%every 2 weeks%' THEN 'biweekly'
            WHEN i.description LIKE '%every week%' THEN 'weekly'
            WHEN i.description LIKE '%every month%' THEN 'monthly'
            WHEN i.description LIKE '%every quarter%' OR i.description LIKE '%every 3 months%' THEN 'quarterly'
            WHEN i.description LIKE '%every year%' THEN 'yearly'
            ELSE 'monthly'
        END
    ),
    true
FROM income i
WHERE i.is_recurring = true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 12: Link existing recurring income to their new templates
-- ============================================================================

UPDATE income i
SET
    recurring_template_id = rt.id,
    is_generated = false,
    description = CASE
        WHEN i.description LIKE 'Recurring:%' THEN
            TRIM(SUBSTRING(i.description FROM POSITION(' - ' IN i.description) + 3))
        ELSE i.description
    END
FROM recurring_templates rt
WHERE i.user_id = rt.user_id
    AND i.source = rt.source
    AND i.amount = rt.amount
    AND i.date = rt.start_date
    AND i.is_recurring = true
    AND rt.template_type = 'income'
    AND i.recurring_template_id IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add table comment
COMMENT ON TABLE recurring_templates IS 'Stores configuration for recurring transactions that auto-generate future instances';

-- Summary
DO $$
DECLARE
    template_count INTEGER;
    expense_count INTEGER;
    income_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM recurring_templates;
    SELECT COUNT(*) INTO expense_count FROM expenses WHERE recurring_template_id IS NOT NULL;
    SELECT COUNT(*) INTO income_count FROM income WHERE recurring_template_id IS NOT NULL;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 007 Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created % recurring templates', template_count;
    RAISE NOTICE 'Linked % existing expenses', expense_count;
    RAISE NOTICE 'Linked % existing income records', income_count;
    RAISE NOTICE '========================================';
END $$;
