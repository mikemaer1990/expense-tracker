// =====================================================
// SPLITWISE API SERVICE
// =====================================================
// Handles all interactions with the Splitwise API
// Documentation: https://dev.splitwise.com/
// =====================================================

import type {
  SplitwiseExpensesResponse,
  SplitwiseCurrentUserResponse,
  SplitwiseExpense,
  SplitwiseCurrentUser,
  SplitwiseError,
} from './splitwise-types';

// Use Supabase Edge Function to proxy requests (avoids CORS)
const SUPABASE_EDGE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-function`
  : null;

/**
 * Check if response is an error
 */
function isSplitwiseError(response: unknown): response is SplitwiseError {
  return (
    typeof response === 'object' &&
    response !== null &&
    ('error' in response || 'errors' in response)
  );
}

/**
 * Make authenticated request to Splitwise API via Edge Function proxy
 */
async function splitwiseRequest<T>(
  endpoint: string,
  apiKey: string,
  queryParams: Record<string, string> = {}
): Promise<T> {
  if (!SUPABASE_EDGE_FUNCTION_URL) {
    throw new Error('Supabase URL not configured. Please set VITE_SUPABASE_URL in your .env file.');
  }

  // Build query string with endpoint and any additional params
  const params = new URLSearchParams({
    endpoint,
    ...queryParams,
  });

  const url = `${SUPABASE_EDGE_FUNCTION_URL}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Splitwise API error: ${response.status} ${response.statusText}. ${
        errorData.error || errorData.errors?.base?.[0] || ''
      }`
    );
  }

  const data = await response.json();

  if (isSplitwiseError(data)) {
    throw new Error(
      data.error || data.errors?.base?.[0] || 'Unknown Splitwise API error'
    );
  }

  return data as T;
}

/**
 * Test API key validity by fetching current user
 */
export async function testSplitwiseConnection(apiKey: string): Promise<SplitwiseCurrentUser> {
  const response = await splitwiseRequest<SplitwiseCurrentUserResponse>(
    '/get_current_user',
    apiKey
  );
  return response.user;
}

/**
 * Get expenses for the current user
 * @param apiKey - Splitwise API key
 * @param options - Query parameters for filtering expenses
 */
export async function getSplitwiseExpenses(
  apiKey: string,
  options: {
    dated_after?: string; // ISO date string (e.g., "2025-01-01T00:00:00Z")
    dated_before?: string;
    updated_after?: string;
    updated_before?: string;
    limit?: number; // Default 0 (all)
    offset?: number;
  } = {}
): Promise<SplitwiseExpense[]> {
  const queryParams: Record<string, string> = {};

  if (options.dated_after) queryParams.dated_after = options.dated_after;
  if (options.dated_before) queryParams.dated_before = options.dated_before;
  if (options.updated_after) queryParams.updated_after = options.updated_after;
  if (options.updated_before) queryParams.updated_before = options.updated_before;
  if (options.limit !== undefined) queryParams.limit = options.limit.toString();
  if (options.offset !== undefined) queryParams.offset = options.offset.toString();

  const response = await splitwiseRequest<SplitwiseExpensesResponse>(
    '/get_expenses',
    apiKey,
    queryParams
  );
  return response.expenses;
}

/**
 * Get a specific expense by ID
 */
export async function getSplitwiseExpense(
  apiKey: string,
  expenseId: number
): Promise<SplitwiseExpense> {
  const response = await splitwiseRequest<{ expense: SplitwiseExpense }>(
    `/get_expense/${expenseId}`,
    apiKey,
    {}
  );
  return response.expense;
}

/**
 * Calculate the current user's share (what they owe) for an expense
 * @param expense - Splitwise expense object
 * @param currentUserId - Current user's Splitwise ID
 * @returns The amount the user owes (their share)
 */
export function calculateUserShare(
  expense: SplitwiseExpense,
  currentUserId: number
): number {
  // Find the current user in the users array
  const userShare = expense.users.find(u => u.user_id === currentUserId);

  if (!userShare) {
    // User not involved in this expense
    return 0;
  }

  // owed_share is what the user owes (their share of the expense)
  return parseFloat(userShare.owed_share);
}

/**
 * Filter expenses to only include those where the user owes money
 * (excludes payments and expenses where user has already paid)
 */
export function filterUserExpenses(
  expenses: SplitwiseExpense[],
  currentUserId: number
): SplitwiseExpense[] {
  return expenses.filter(expense => {
    // Skip payment transactions (transfers between users)
    if (expense.payment) {
      return false;
    }

    // Skip deleted expenses
    if (expense.deleted_at) {
      return false;
    }

    // Only include if user owes something
    const userShare = calculateUserShare(expense, currentUserId);
    return userShare > 0;
  });
}

/**
 * Map Splitwise category name to Loggy expense type name
 * Uses smart matching based on common category names
 */
export function mapSplitwiseCategoryToLoggyType(categoryName: string): string {
  const categoryLower = categoryName.toLowerCase();

  // Direct mappings
  const mappings: Record<string, string> = {
    // Food & Dining
    'groceries': 'Groceries',
    'dining out': 'Dining Out',
    'restaurants': 'Dining Out',
    'liquor': 'Dining Out',

    // Housing
    'rent': 'Rent/Mortgage',
    'mortgage': 'Rent/Mortgage',
    'household supplies': 'Groceries',
    'furniture': 'Shopping',
    'maintenance': 'Maintenance',

    // Transportation
    'gas/fuel': 'Gas',
    'parking': 'Transportation',
    'car': 'Transportation',
    'taxi': 'Transportation',
    'bicycle': 'Transportation',

    // Utilities
    'utilities': 'Utilities',
    'electricity': 'Utilities',
    'heat/gas': 'Utilities',
    'water': 'Utilities',
    'tv/phone/internet': 'Internet',
    'internet': 'Internet',
    'phone': 'Phone',
    'cell phone': 'Phone',

    // Entertainment
    'entertainment': 'Entertainment',
    'movies': 'Entertainment',
    'music': 'Entertainment',
    'games': 'Entertainment',
    'sports': 'Hobbies',

    // Personal
    'clothing': 'Shopping',
    'electronics': 'Shopping',
    'gifts': 'Shopping',
    'insurance': 'Insurance',

    // Travel
    'plane': 'Travel',
    'hotel': 'Travel',
    'vacation': 'Travel',
  };

  // Check for exact match
  if (mappings[categoryLower]) {
    return mappings[categoryLower];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(mappings)) {
    if (categoryLower.includes(key) || key.includes(categoryLower)) {
      return value;
    }
  }

  // Default fallback - return the original category name
  // This will need to be matched against user's expense types
  return categoryName;
}
