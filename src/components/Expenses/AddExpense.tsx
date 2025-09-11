import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useUserPreferences } from '../../hooks/useUserPreferences'

interface ExpenseForm {
  category_id: string
  expense_type_id: string
  amount: number
  description: string
  date: string
  is_recurring: boolean
  recurring_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  recurring_start_date?: string
  recurring_end_date?: string
  is_split: boolean
  split_with?: string
}

interface Category {
  id: string
  name: string
  color: string
}

interface ExpenseType {
  id: string
  name: string
  icon_name: string
}

export default function AddExpense({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const { preferences } = useUserPreferences()
  const [categories, setCategories] = useState<Category[]>([])
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExpenseForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      is_recurring: false,
      recurring_start_date: new Date().toISOString().split('T')[0],
      is_split: false,
      split_with: '',
    },
  })

  const watchedCategoryId = watch('category_id')
  const isRecurring = watch('is_recurring')
  const recurringFrequency = watch('recurring_frequency')
  const isSplit = watch('is_split')
  const amount = watch('amount')

  useEffect(() => {
    if (user) {
      loadCategories()
    }
  }, [user])

  useEffect(() => {
    if (watchedCategoryId) {
      setSelectedCategoryId(watchedCategoryId)
      loadExpenseTypes(watchedCategoryId)
    }
  }, [watchedCategoryId])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user!.id)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      setError('Failed to load categories')
      console.error(error)
    }
  }

  const loadExpenseTypes = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('expense_types')
        .select('id, name, icon_name')
        .eq('category_id', categoryId)
        .order('name')

      if (error) throw error
      setExpenseTypes(data || [])
    } catch (error: any) {
      console.error(error)
      setExpenseTypes([])
    }
  }

  const onSubmit = async (data: ExpenseForm) => {
    try {
      setError('')
      setLoading(true)

      // Calculate amounts for splitting
      const originalAmount = Number(data.amount)
      const finalAmount = data.is_split ? originalAmount / 2 : originalAmount

      if (data.is_recurring) {
        // Create recurring expense entry with frequency in description
        const frequencyText = data.recurring_frequency === 'biweekly' ? 'every 2 weeks' : `every ${data.recurring_frequency?.replace('ly', '')}`
        const recurringDescription = `Recurring: ${frequencyText}${data.description ? ` - ${data.description}` : ''}`
        
        const { error } = await supabase.from('expenses').insert({
          user_id: user!.id,
          expense_type_id: data.expense_type_id,
          amount: finalAmount,
          date: data.recurring_start_date!,
          is_recurring: true,
          description: recurringDescription,
          is_split: data.is_split,
          original_amount: data.is_split ? originalAmount : null,
          split_with: data.is_split ? data.split_with || null : null,
        })

        if (error) throw error
      } else {
        // Create one-time expense record
        const { error } = await supabase.from('expenses').insert({
          user_id: user!.id,
          expense_type_id: data.expense_type_id,
          amount: finalAmount,
          description: data.description || null,
          date: data.date,
          is_recurring: false,
          is_split: data.is_split,
          original_amount: data.is_split ? originalAmount : null,
          split_with: data.is_split ? data.split_with || null : null,
        })

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // If no categories exist, show a message
  if (categories.length === 0) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <h3 className="text-lg font-medium text-gray-900">No Categories Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              You need to set up categories first. Would you like me to create default categories for you?
            </p>
            <div className="mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
            Add New Expense
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                {...register('category_id', { required: 'Please select a category' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expense Type</label>
              <select
                {...register('expense_type_id', { required: 'Please select an expense type' })}
                disabled={!selectedCategoryId || expenseTypes.length === 0}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="">Select an expense type</option>
                {expenseTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.expense_type_id && (
                <p className="mt-1 text-sm text-red-600">{errors.expense_type_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                type="number"
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Expense Splitting (conditional) */}
            {preferences.enableExpenseSplitting && (
              <div>
                <label className="flex items-center">
                  <input
                    {...register('is_split')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Split this expense</span>
                </label>
                
                {isSplit && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Split with</label>
                      <input
                        {...register('split_with', { 
                          required: isSplit ? 'Please specify who you\'re splitting with' : false 
                        })}
                        type="text"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., GF, Roommate, Friend"
                      />
                      {errors.split_with && (
                        <p className="mt-1 text-sm text-red-600">{errors.split_with.message}</p>
                      )}
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-blue-900">Split Preview:</h4>
                      <p className="text-sm text-blue-700">
                        Original amount: ${(Number(amount) || 0).toFixed(2)}<br />
                        Your share: ${((Number(amount) || 0) / 2).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recurring Toggle */}
            <div>
              <label className="flex items-center">
                <input
                  {...register('is_recurring')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">This is a recurring expense</span>
              </label>
            </div>

            {/* One-time Expense Fields */}
            {!isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  {...register('date', { required: !isRecurring ? 'Date is required' : false })}
                  type="date"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>
            )}

            {/* Recurring Expense Fields */}
            {isRecurring && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    {...register('recurring_frequency', { required: isRecurring ? 'Frequency is required' : false })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select frequency</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly (Every 3 months)</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  {errors.recurring_frequency && (
                    <p className="mt-1 text-sm text-red-600">{errors.recurring_frequency.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    {...register('recurring_start_date', { required: isRecurring ? 'Start date is required' : false })}
                    type="date"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.recurring_start_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.recurring_start_date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date (optional)</label>
                  <input
                    {...register('recurring_end_date')}
                    type="date"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty for ongoing expense</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
              <textarea
                {...register('description')}
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional details about this expense..."
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {/* Preview for recurring */}
            {isRecurring && recurringFrequency && (
              <div className="bg-red-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-red-900">Recurring Expense Preview:</h4>
                <p className="text-sm text-red-700">
                  ${(Number(watch('amount')) || 0).toFixed(2)} for {watch('description') || 'expense'} every{' '}
                  {recurringFrequency === 'biweekly' ? '2 weeks' : recurringFrequency.replace('ly', '')}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              >
                {loading ? 'Adding...' : isRecurring ? 'Set Up Recurring Expense' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}