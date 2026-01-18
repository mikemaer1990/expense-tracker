-- Migration 008: Fix stale next_generation_date values
-- Recalculates next_generation_date for all recurring templates based on last_generated_date

-- Update all templates to have correct next_generation_date
UPDATE recurring_templates
SET next_generation_date = calculate_next_recurring_date(
    COALESCE(last_generated_date, start_date),
    frequency
)
WHERE is_active = true;

-- Verify the update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count FROM recurring_templates WHERE is_active = true;
    RAISE NOTICE 'Updated next_generation_date for % active templates', updated_count;
END $$;
