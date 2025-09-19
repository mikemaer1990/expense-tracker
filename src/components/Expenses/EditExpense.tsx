import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import { useUserPreferences } from '../../hooks/useUserPreferences'

interface ExpenseForm {
  expense_type_id: string
  amount: number
  date: string
  description?: string
  is_recurring: boolean
  recurring_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  recurring_start_date?: string
  recurring_end_date?: string
  is_split: boolean
  split_with?: string
}

interface ExpenseType {
  id: string
  name: string
  categories: {
    id: string
    name: string
    color: string
  }
}

interface EditExpenseProps {
  expense: any
  expenseTypes: ExpenseType[]
  onClose: () => void
  onSuccess: () => void
}

export default function EditExpense({ expense, expenseTypes, onClose, onSuccess }: EditExpenseProps) {
  const { preferences } = useUserPreferences()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  // Parse recurring information from description
  const isCurrentlyRecurring = expense.is_recurring || false
  const parseRecurringFromDescription = (description: string) => {
    if (!description || !description.includes('Recurring:')) return { frequency: '', cleanDescription: description }
    
    const parts = description.split('Recurring: ')[1] || ''
    if (parts.includes('every 2 weeks')) return { frequency: 'biweekly', cleanDescription: parts.split(' - ')[1] || '' }
    if (parts.includes('every week')) return { frequency: 'weekly', cleanDescription: parts.split(' - ')[1] || '' }
    if (parts.includes('every month')) return { frequency: 'monthly', cleanDescription: parts.split(' - ')[1] || '' }
    if (parts.includes('every quarter')) return { frequency: 'quarterly', cleanDescription: parts.split(' - ')[1] || '' }
    if (parts.includes('every year')) return { frequency: 'yearly', cleanDescription: parts.split(' - ')[1] || '' }
    
    return { frequency: '', cleanDescription: parts.split(' - ')[1] || parts }
  }

  const { frequency: currentFrequency, cleanDescription } = parseRecurringFromDescription(expense.description || '')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseForm>({
    defaultValues: {
      expense_type_id: expense.expense_type_id || '',
      amount: expense.is_split ? expense.original_amount || expense.amount : expense.amount,
      date: expense.date,
      description: cleanDescription || '',
      is_recurring: isCurrentlyRecurring,
      recurring_frequency: currentFrequency as any,
      recurring_start_date: expense.date,
      is_split: expense.is_split || false,
      split_with: expense.split_with || '',
    },
  })

  const isRecurring = watch('is_recurring')
  const recurringFrequency = watch('recurring_frequency')
  const isSplit = watch('is_split')
  const amount = watch('amount')

  const handleClose = () => {
    setIsVisible(false)
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose()
    }, 200) // Match the animation duration
  }

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    // Set form value immediately since expense types are pre-loaded
    if (expense.expense_type_id) {
      setValue('expense_type_id', expense.expense_type_id)
    }
    // Trigger animation on mount
    setTimeout(() => setIsVisible(true), 10)
  }, [expense.expense_type_id, setValue])

  const onSubmit = async (data: ExpenseForm) => {
    try {
      setError('')
      setLoading(true)

      // Calculate amounts for splitting
      const originalAmount = Number(data.amount)
      const finalAmount = data.is_split ? originalAmount / 2 : originalAmount

      let updateData: any = {
        expense_type_id: data.expense_type_id,
        amount: finalAmount,
        is_recurring: data.is_recurring,
        is_split: data.is_split,
        original_amount: data.is_split ? originalAmount : null,
        split_with: data.is_split ? data.split_with || null : null,
      }

      if (data.is_recurring) {
        // Create recurring expense entry with frequency in description
        const frequencyText = data.recurring_frequency === 'biweekly' ? 'every 2 weeks' : `every ${data.recurring_frequency?.replace('ly', '')}`
        const recurringDescription = `Recurring: ${frequencyText}${data.description ? ` - ${data.description}` : ''}`
        
        updateData.date = data.recurring_start_date!
        updateData.description = recurringDescription
      } else {
        // One-time expense
        updateData.date = data.date
        updateData.description = data.description || null
      }

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expense.id)

      if (error) throw error

      onSuccess()
      handleClose()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const groupedTypes = expenseTypes.reduce((acc, type) => {
    const categoryName = type.categories?.name || 'Other'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(type)
    return acc
  }, {} as Record<string, ExpenseType[]>)

  return (
    <div
      className={`fixed inset-0 bg-gray-600 overflow-y-auto h-full w-full z-50 transition-opacity duration-200 ${isVisible ? 'bg-opacity-50 opacity-100' : 'bg-opacity-0 opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`relative mx-auto border shadow-lg bg-white
                    /* Mobile: Full screen with slide-up animation */
                    min-h-screen w-full p-4 pt-8 pb-8 rounded-none
                    /* Desktop: Centered modal with fade animation */
                    md:top-20 md:w-96 md:max-h-[80vh] md:min-h-0 md:p-5 md:rounded-md md:overflow-y-auto
                    /* Animation classes */
                    transform transition-all duration-200 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
            Edit Expense
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Expense Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Expense Type</label>
              <select
                {...register('expense_type_id', { required: 'Please select an expense type' })}
                className="mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              >
                <option value="">Select an expense type</option>
                {Object.entries(groupedTypes).map(([category, types]) => (
                  <optgroup key={category} label={category}>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.expense_type_id && (
                <p className="mt-1 text-sm text-red-600">{errors.expense_type_id.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                type="number"
                inputMode="decimal"
                step="0.01"
                className="mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
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
                        className="mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
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
                  className="mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
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
                    className="mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
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
                    className="mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
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
                    className="mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty for ongoing expense</p>
                </div>
              </>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
              <textarea
                {...register('description')}
                rows={2}
                className="mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
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

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 md:py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 min-h-[48px] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] font-medium cursor-pointer"
              >
                {loading ? 'Updating...' : isRecurring ? 'Update Recurring Expense' : 'Update Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}