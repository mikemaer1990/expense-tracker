-- =====================================================
-- SPLITWISE INTEGRATION - ROLLBACK MIGRATION
-- =====================================================
-- Created: 2025-12-31
-- Description: Safely removes all Splitwise integration changes
-- Use this file if you need to undo the Splitwise integration
-- =====================================================

-- WARNING: This will delete all Splitwise sync data!
-- Make sure to backup your data before running this rollback.

-- =====================================================
-- DROP TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_splitwise_connections_updated_at_trigger
    ON splitwise_connections;

DROP FUNCTION IF EXISTS update_splitwise_connections_updated_at();

-- =====================================================
-- DROP RLS POLICIES
-- =====================================================

-- Splitwise connections policies
DROP POLICY IF EXISTS "Users can view their own Splitwise connection"
    ON splitwise_connections;

DROP POLICY IF EXISTS "Users can insert their own Splitwise connection"
    ON splitwise_connections;

DROP POLICY IF EXISTS "Users can update their own Splitwise connection"
    ON splitwise_connections;

DROP POLICY IF EXISTS "Users can delete their own Splitwise connection"
    ON splitwise_connections;

-- Splitwise synced expenses policies
DROP POLICY IF EXISTS "Users can view their own synced expenses"
    ON splitwise_synced_expenses;

DROP POLICY IF EXISTS "Users can insert their own synced expenses"
    ON splitwise_synced_expenses;

DROP POLICY IF EXISTS "Users can delete their own synced expenses"
    ON splitwise_synced_expenses;

-- =====================================================
-- DROP INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_splitwise_connections_user_id;
DROP INDEX IF EXISTS idx_splitwise_synced_expenses_user_id;
DROP INDEX IF EXISTS idx_splitwise_synced_expenses_splitwise_id;
DROP INDEX IF EXISTS idx_expenses_splitwise_expense_id;

-- =====================================================
-- DROP TABLES (CASCADE will remove foreign key references)
-- =====================================================

DROP TABLE IF EXISTS splitwise_synced_expenses CASCADE;
DROP TABLE IF EXISTS splitwise_connections CASCADE;

-- =====================================================
-- ALTER EXISTING TABLES
-- =====================================================

-- Remove the splitwise_expense_id column from expenses
ALTER TABLE expenses
DROP COLUMN IF EXISTS splitwise_expense_id;

-- =====================================================
-- REMOVE SCHEMA VERSION ENTRY
-- =====================================================

DELETE FROM schema_version
WHERE version = '2025.12.31.001';

-- =====================================================
-- END OF ROLLBACK
-- =====================================================

/*
ROLLBACK COMPLETE

The following has been removed:
✅ splitwise_connections table
✅ splitwise_synced_expenses table
✅ splitwise_expense_id column from expenses table
✅ All RLS policies for Splitwise tables
✅ All indexes for Splitwise tables
✅ All triggers and functions for Splitwise tables
✅ Schema version entry

Your database is now back to the state before Splitwise integration.
All existing expenses, income, categories, and other data remain intact.

IMPORTANT:
- This rollback does NOT delete expenses that were imported from Splitwise
- Only the tracking/connection data is removed
- Imported expenses will remain as regular Loggy expenses
- You may want to manually delete Splitwise-imported expenses if needed
*/
