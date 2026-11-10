-- Rollback for 010. Only safe while splitwise_expense_id still exists (i.e. before 011).
BEGIN;

DROP INDEX IF EXISTS idx_expenses_external_id;

ALTER TABLE expenses
    DROP COLUMN IF EXISTS external_id,
    DROP COLUMN IF EXISTS import_source;

COMMIT;
