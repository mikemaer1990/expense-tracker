-- =====================================================
-- 011: REMOVE SPLITWISE API INTEGRATION (cleanup)
-- =====================================================
-- Created: 2026-11-10
-- Step 2 of removing the Splitwise API integration.
-- Run ONLY AFTER the new frontend (which reads import_source) is deployed and verified.
-- Expenses are NOT deleted; only the connection (stored API key) and sync bookkeeping.
--
-- Back up first (Download CSV from the SQL editor):
--   SELECT * FROM expenses WHERE splitwise_expense_id IS NOT NULL;
--   SELECT * FROM splitwise_synced_expenses;
--   SELECT * FROM splitwise_connections;
-- =====================================================

BEGIN;

-- Safety check: abort if any Splitwise ID was not copied by 010
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM expenses
        WHERE splitwise_expense_id IS NOT NULL
          AND external_id IS DISTINCT FROM splitwise_expense_id
    ) THEN
        RAISE EXCEPTION 'Some splitwise_expense_id values are missing from external_id. Run 010 first.';
    END IF;
END $$;

-- Tables (CASCADE removes their policies, indexes and the updated_at trigger)
DROP TABLE IF EXISTS splitwise_synced_expenses CASCADE;
DROP TABLE IF EXISTS splitwise_connections CASCADE;

DROP FUNCTION IF EXISTS update_splitwise_connections_updated_at();

-- Old column (data now lives in import_source/external_id)
DROP INDEX IF EXISTS idx_expenses_splitwise_expense_id;
ALTER TABLE expenses DROP COLUMN IF EXISTS splitwise_expense_id;

COMMIT;
