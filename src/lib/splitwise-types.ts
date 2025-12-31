// =====================================================
// SPLITWISE API - TYPESCRIPT TYPE DEFINITIONS
// =====================================================
// Based on Splitwise API documentation
// https://dev.splitwise.com/
// =====================================================

export interface SplitwiseUser {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  picture?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}

export interface SplitwiseUserShare {
  user: SplitwiseUser;
  user_id: number;
  paid_share: string; // Decimal as string
  owed_share: string; // Decimal as string
  net_balance: string; // Decimal as string
}

export interface SplitwiseCategory {
  id: number;
  name: string;
}

export interface SplitwiseExpense {
  id: number;
  group_id: number | null;
  friendship_id: number | null;
  expense_bundle_id: number | null;
  description: string;
  details: string | null;
  cost: string; // Decimal as string
  currency_code: string; // ISO currency code (USD, EUR, etc.)
  date: string; // ISO 8601 datetime
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
  deleted_at: string | null; // ISO 8601 datetime
  category: SplitwiseCategory;
  category_id: number;
  payment: boolean; // True if this is a payment between users
  creation_method: string | null;
  transaction_method: string;
  transaction_confirmed: boolean;
  repeats: string; // "never", "weekly", "fortnightly", "monthly", "yearly"
  repeat_interval: string | null;
  email_reminder: boolean;
  email_reminder_in_advance: number;
  next_repeat: string | null;
  comments_count: number;

  // User shares - who paid what and who owes what
  users: SplitwiseUserShare[];

  // Created/updated by
  created_by: SplitwiseUser;
  updated_by: SplitwiseUser | null;
  deleted_by: SplitwiseUser | null;

  // Receipt images
  receipt?: {
    large?: string;
    original?: string;
  };

  // Repayments between users
  repayments?: Array<{
    from: number; // user_id
    to: number; // user_id
    amount: string; // Decimal as string
  }>;
}

export interface SplitwiseExpensesResponse {
  expenses: SplitwiseExpense[];
}

export interface SplitwiseCurrentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  registration_status: string;
  picture?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  notifications_read: string;
  notifications_count: number;
  notifications: {
    added_as_friend: boolean;
  };
  default_currency: string;
  locale: string;
}

export interface SplitwiseCurrentUserResponse {
  user: SplitwiseCurrentUser;
}

export interface SplitwiseError {
  error?: string;
  errors?: {
    base?: string[];
  };
}

// Helper type for API responses
export type SplitwiseApiResponse<T> = T | SplitwiseError;

// Configuration for Splitwise connection
export interface SplitwiseConnection {
  id: string;
  user_id: string;
  api_key: string;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_start_date: string | null; // Date to start syncing from (YYYY-MM-DD)
  created_at: string;
  updated_at: string;
}

// Sync tracking record
export interface SplitwiseSyncedExpense {
  id: string;
  user_id: string;
  splitwise_expense_id: string;
  loggy_expense_id: string;
  synced_at: string;
}
