-- =====================================================
-- 010: GENERIC IMPORT COLUMNS ON EXPENSES (additive only)
-- =====================================================
-- Created: 2026-11-10
-- Step 1 of removing the Splitwise API integration.
-- Adds import_source/external_id and copies existing Splitwise IDs into them.
-- Does NOT touch splitwise_expense_id or the splitwise_* tables, so the
-- currently deployed frontend keeps working. Run BEFORE deploying the new frontend.
--
-- Before running, record:
--   SELECT count(*) FROM expenses WHERE splitwise_expense_id IS NOT NULL;
-- =====================================================

BEGIN;

ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS import_source TEXT,
    ADD COLUMN IF NOT EXISTS external_id TEXT;

UPDATE expenses
SET import_source = 'splitwise_api',
    external_id = splitwise_expense_id
WHERE splitwise_expense_id IS NOT NULL
  AND import_source IS NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_external_id ON expenses(external_id);

COMMENT ON COLUMN expenses.import_source IS 'Where the expense was imported from (e.g. splitwise_api, splitwise_csv); NULL for manual entries';
COMMENT ON COLUMN expenses.external_id IS 'ID of the record in the import source, for duplicate detection';

COMMIT;

-- Verify (must equal the count recorded above):
--   SELECT count(*) FROM expenses WHERE import_source = 'splitwise_api';
