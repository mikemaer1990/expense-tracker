-- Rollback for 011: recreates the Splitwise tables (empty) and restores the old column.
-- Stored API key and sync records are not recoverable from here; restore them from
-- the CSV backups taken before 011 if needed.
--
-- 1. Run database/migrations/006_splitwise_integration.sql
-- 2. Then run:
BEGIN;

UPDATE expenses
SET splitwise_expense_id = external_id
WHERE import_source = 'splitwise_api';

COMMIT;
