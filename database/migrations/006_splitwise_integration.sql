-- =====================================================
-- SPLITWISE INTEGRATION - FORWARD MIGRATION
-- =====================================================
-- Created: 2025-12-31
-- Description: Adds tables and columns for Splitwise API integration
-- Features: API key storage, sync tracking, duplicate prevention
-- =====================================================

-- =====================================================
-- NEW TABLES
-- =====================================================

-- Splitwise connection configuration per user
CREATE TABLE IF NOT EXISTS splitwise_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key TEXT NOT NULL, -- Encrypted in production
    is_connected BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    CONSTRAINT splitwise_connections_user_id_unique UNIQUE(user_id)
);

-- Tracks which Splitwise expenses have been synced to prevent duplicates
CREATE TABLE IF NOT EXISTS splitwise_synced_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    splitwise_expense_id TEXT NOT NULL, -- Splitwise's expense ID (string)
    loggy_expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

    CONSTRAINT splitwise_synced_expenses_unique UNIQUE(user_id, splitwise_expense_id)
);

-- =====================================================
-- ALTER EXISTING TABLES
-- =====================================================

-- Add optional reference to Splitwise expense ID
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS splitwise_expense_id TEXT;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_splitwise_connections_user_id
    ON splitwise_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_splitwise_synced_expenses_user_id
    ON splitwise_synced_expenses(user_id);

CREATE INDEX IF NOT EXISTS idx_splitwise_synced_expenses_splitwise_id
    ON splitwise_synced_expenses(splitwise_expense_id);

CREATE INDEX IF NOT EXISTS idx_expenses_splitwise_expense_id
    ON expenses(splitwise_expense_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE splitwise_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE splitwise_synced_expenses ENABLE ROW LEVEL SECURITY;

-- Splitwise connections policies
CREATE POLICY "Users can view their own Splitwise connection"
    ON splitwise_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Splitwise connection"
    ON splitwise_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Splitwise connection"
    ON splitwise_connections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Splitwise connection"
    ON splitwise_connections
    FOR DELETE USING (auth.uid() = user_id);

-- Splitwise synced expenses policies
CREATE POLICY "Users can view their own synced expenses"
    ON splitwise_synced_expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own synced expenses"
    ON splitwise_synced_expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own synced expenses"
    ON splitwise_synced_expenses
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp for splitwise_connections
CREATE OR REPLACE FUNCTION update_splitwise_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_splitwise_connections_updated_at_trigger
    BEFORE UPDATE ON splitwise_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_splitwise_connections_updated_at();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE splitwise_connections IS 'User Splitwise API connection configuration';
COMMENT ON TABLE splitwise_synced_expenses IS 'Tracks synced Splitwise expenses to prevent duplicates';

COMMENT ON COLUMN splitwise_connections.api_key IS 'Splitwise API key (should be encrypted in production)';
COMMENT ON COLUMN splitwise_connections.last_sync_at IS 'Timestamp of last successful sync operation';
COMMENT ON COLUMN splitwise_synced_expenses.splitwise_expense_id IS 'Original Splitwise expense ID (their system ID)';
COMMENT ON COLUMN splitwise_synced_expenses.loggy_expense_id IS 'Corresponding Loggy expense ID in our system';
COMMENT ON COLUMN expenses.splitwise_expense_id IS 'Optional reference to original Splitwise expense';

-- =====================================================
-- UPDATE SCHEMA VERSION
-- =====================================================

-- Create schema_version table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('2025.12.31.001', 'Splitwise integration: connection storage and sync tracking')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

/*
MIGRATION SUMMARY:

NEW TABLES:
✅ splitwise_connections - Stores user API keys and connection status
✅ splitwise_synced_expenses - Tracks synced expenses to prevent duplicates

MODIFIED TABLES:
✅ expenses - Added splitwise_expense_id column (nullable)

SECURITY:
✅ RLS policies for all new tables
✅ User isolation - users can only access their own data
✅ Cascade delete - cleanup when user is deleted

FEATURES ENABLED:
✅ Store Splitwise API key per user
✅ Track sync history with last_sync_at timestamp
✅ Prevent duplicate imports via splitwise_synced_expenses
✅ Link Loggy expenses back to Splitwise via splitwise_expense_id
✅ Support for multiple users with separate Splitwise accounts

IMPORTANT NOTES:
- API keys should be encrypted before storage in production
- Consider using Supabase Vault for secure key storage
- The splitwise_expense_id in expenses table is optional/nullable
- No existing data is modified - purely additive changes
*/
