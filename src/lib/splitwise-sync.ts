// =====================================================
// SPLITWISE SYNC SERVICE
// =====================================================
// Handles syncing expenses from Splitwise to Loggy
// with smart category mapping and duplicate detection
// =====================================================

import { supabase } from './supabase';
import {
  getSplitwiseExpenses,
  calculateUserShare,
  filterUserExpenses,
  mapSplitwiseCategoryToLoggyType,
  testSplitwiseConnection,
} from './splitwise';
import type { SplitwiseExpense } from './splitwise-types';

export interface SyncResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  expenses?: Array<{
    splitwise_id: number;
    loggy_id: string;
    description: string;
    amount: number;
  }>;
}

/**
 * Find the best matching Loggy expense type for a Splitwise expense
 */
async function findMatchingExpenseType(
  userId: string,
  splitwiseExpense: SplitwiseExpense
): Promise<string | null> {
  try {
    // Get the suggested type name from Splitwise category
    const suggestedTypeName = mapSplitwiseCategoryToLoggyType(
      splitwiseExpense.category.name
    );

    // First, try to find exact match by name
    const { data: categories } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId);

    if (!categories || categories.length === 0) {
      throw new Error('No categories found for user');
    }

    const categoryIds = categories.map(c => c.id);

    // Try exact match first
    const { data: exactMatch } = await supabase
      .from('expense_types')
      .select('id')
      .in('category_id', categoryIds)
      .ilike('name', suggestedTypeName)
      .limit(1)
      .single();

    if (exactMatch) {
      return exactMatch.id;
    }

    // Try partial match (case-insensitive)
    const { data: partialMatches } = await supabase
      .from('expense_types')
      .select('id, name')
      .in('category_id', categoryIds);

    if (partialMatches && partialMatches.length > 0) {
      const suggestedLower = suggestedTypeName.toLowerCase();

      // Find best match
      for (const type of partialMatches) {
        const typeLower = type.name.toLowerCase();
        if (typeLower.includes(suggestedLower) || suggestedLower.includes(typeLower)) {
          return type.id;
        }
      }

      // If no match found, default to first expense type in Variable Expenses
      const { data: variableCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', 'Variable Expenses')
        .single();

      if (variableCategory) {
        const { data: defaultType } = await supabase
          .from('expense_types')
          .select('id')
          .eq('category_id', variableCategory.id)
          .limit(1)
          .single();

        if (defaultType) {
          return defaultType.id;
        }
      }

      // Last resort: just use first available expense type
      return partialMatches[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error finding matching expense type:', error);
    return null;
  }
}

/**
 * Check if a Splitwise expense has already been synced
 */
async function isAlreadySynced(
  userId: string,
  splitwiseExpenseId: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('splitwise_synced_expenses')
      .select('id')
      .eq('user_id', userId)
      .eq('splitwise_expense_id', splitwiseExpenseId.toString())
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking sync status:', error);
    return false; // Assume not synced if error
  }
}

/**
 * Sync expenses from Splitwise to Loggy
 */
export async function syncSplitwiseExpenses(
  userId: string,
  apiKey: string,
  options: {
    dated_after?: string; // Only sync expenses after this date
    limit?: number; // Limit number of expenses to sync
  } = {}
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [],
    expenses: [],
  };

  try {
    // Test connection first
    const currentUser = await testSplitwiseConnection(apiKey);

    // Fetch expenses from Splitwise
    const allExpenses = await getSplitwiseExpenses(apiKey, {
      dated_after: options.dated_after,
      limit: options.limit || 0, // 0 = all
    });

    // Filter to only expenses where user owes money
    const userExpenses = filterUserExpenses(allExpenses, currentUser.id);

    if (userExpenses.length === 0) {
      result.success = true;
      result.skipped = allExpenses.length;
      return result;
    }

    // Process each expense
    for (const expense of userExpenses) {
      try {
        // Check if already synced
        const alreadySynced = await isAlreadySynced(userId, expense.id);
        if (alreadySynced) {
          result.skipped++;
          continue;
        }

        // Find matching expense type
        const expenseTypeId = await findMatchingExpenseType(userId, expense);
        if (!expenseTypeId) {
          result.errors.push(
            `Could not find matching expense type for "${expense.description}"`
          );
          result.skipped++;
          continue;
        }

        // Calculate user's share
        const userShare = calculateUserShare(expense, currentUser.id);
        if (userShare <= 0) {
          result.skipped++;
          continue;
        }

        // Create expense in Loggy
        const { data: newExpense, error: expenseError } = await supabase
          .from('expenses')
          .insert({
            user_id: userId,
            expense_type_id: expenseTypeId,
            amount: userShare,
            description: expense.description + (expense.details ? ` - ${expense.details}` : ''),
            date: expense.date.split('T')[0], // Extract date part
            is_split: true,
            original_amount: parseFloat(expense.cost),
            split_with: 'Splitwise',
            splitwise_expense_id: expense.id.toString(),
          })
          .select()
          .single();

        if (expenseError) throw expenseError;

        // Record the sync
        const { error: syncError } = await supabase
          .from('splitwise_synced_expenses')
          .insert({
            user_id: userId,
            splitwise_expense_id: expense.id.toString(),
            loggy_expense_id: newExpense.id,
          });

        if (syncError) throw syncError;

        result.imported++;
        result.expenses?.push({
          splitwise_id: expense.id,
          loggy_id: newExpense.id,
          description: expense.description,
          amount: userShare,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Error syncing "${expense.description}": ${errorMsg}`);
        console.error('Error syncing expense:', expense.id, error);
      }
    }

    // Update last sync time
    await supabase
      .from('splitwise_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId);

    result.success = result.errors.length === 0 || result.imported > 0;
    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Sync failed: ${errorMsg}`);
    console.error('Sync error:', error);
    return result;
  }
}

/**
 * Get sync statistics for a user
 */
export async function getSyncStats(userId: string): Promise<{
  totalSynced: number;
  lastSyncAt: string | null;
}> {
  try {
    // Get count of synced expenses
    const { count } = await supabase
      .from('splitwise_synced_expenses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get last sync time
    const { data: connection } = await supabase
      .from('splitwise_connections')
      .select('last_sync_at')
      .eq('user_id', userId)
      .single();

    return {
      totalSynced: count || 0,
      lastSyncAt: connection?.last_sync_at || null,
    };
  } catch (error) {
    console.error('Error getting sync stats:', error);
    return {
      totalSynced: 0,
      lastSyncAt: null,
    };
  }
}
