import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import IconRenderer from '../UI/IconRenderer'

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
  icon_name: string
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
  const [searchTerm, setSearchTerm] = useState('')

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
                    min-h-screen w-full p-0 rounded-none
                    /* Desktop: Centered modal with fade animation */
                    md:top-20 md:w-96 md:max-h-[80vh] md:min-h-0 md:rounded-md md:overflow-y-auto
                    /* Animation classes */
                    transform transition-all duration-200 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - top right */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full transition-colors duration-200 z-20"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Modal Header */}
        <div className="relative">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 text-center">
              Edit Expense
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
            {/* Expense Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Expense Type</label>

              {/* Search Input */}
              <div className="relative mb-3">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search expense types..."
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Icon Grid - Grouped by Category */}
              <div className="space-y-4">
                {Object.entries(groupedTypes).map(([category, types]) => {
                  const filteredTypes = types.filter(type =>
                    searchTerm === '' ||
                    type.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )

                  if (filteredTypes.length === 0) return null

                  return (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{category}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {filteredTypes.map((type) => {
                          const isSelected = watch('expense_type_id') === type.id
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                register('expense_type_id').onChange({ target: { value: type.id, name: 'expense_type_id' } })
                              }}
                              className={`
                                relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 min-h-[90px] cursor-pointer
                                hover:scale-[1.02] active:scale-[0.98]
                                ${isSelected
                                  ? 'border-transparent bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md shadow-emerald-200/30'
                                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                }
                              `}
                            >
                              {/* Gradient border effect for selected state */}
                              {isSelected && (
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 -z-10 p-[2px]">
                                  <div className="h-full w-full bg-white rounded-xl"></div>
                                </div>
                              )}

                              <IconRenderer
                                iconName={type.icon_name}
                                size="lg"
                                color={isSelected ? 'text-emerald-600' : 'text-gray-600'}
                                className="mb-2 transition-colors"
                              />
                              <span className={`text-xs text-center font-medium leading-tight ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>
                                {type.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {errors.expense_type_id && (
                <p className="mt-2 text-sm text-red-600">{errors.expense_type_id.message}</p>
              )}
            </div>

            {/* Amount - Floating Label */}
            <div className="relative">
              <input
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder=" "
                className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-transparent min-h-[52px]"
              />
              <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:font-medium peer-focus:text-blue-600 peer-focus:bg-white">
                Amount
              </label>
              {errors.amount && (
                <p className="mt-1.5 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Expense Splitting (conditional) */}
            {preferences.enableExpenseSplitting && (
              <div>
                <label className="flex items-center cursor-pointer group">
                  <input
                    {...register('is_split')}
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0 border-2 border-gray-300 rounded-md transition-all cursor-pointer"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">Split this expense</span>
                </label>

                {isSplit && (
                  <div className="mt-3 space-y-3">
                    <div className="relative">
                      <input
                        {...register('split_with', {
                          required: isSplit ? 'Please specify who you\'re splitting with' : false
                        })}
                        type="text"
                        placeholder=" "
                        className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-transparent min-h-[52px]"
                      />
                      <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:font-medium peer-focus:text-blue-600 peer-focus:bg-white">
                        Split with
                      </label>
                      {errors.split_with && (
                        <p className="mt-1.5 text-sm text-red-600">{errors.split_with.message}</p>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-100">
                      <h4 className="text-sm font-semibold text-blue-900 mb-1.5">Split Preview</h4>
                      <div className="space-y-1">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Original:</span> ${(Number(amount) || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Your share:</span> ${((Number(amount) || 0) / 2).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recurring Toggle */}
            <div>
              <label className="flex items-center cursor-pointer group">
                <input
                  {...register('is_recurring')}
                  type="checkbox"
                  className="h-5 w-5 text-purple-600 focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-0 border-2 border-gray-300 rounded-md transition-all cursor-pointer"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">This is a recurring expense</span>
              </label>
            </div>

            {/* One-time Expense Fields */}
            {!isRecurring && (
              <div className="relative">
                <input
                  {...register('date', { required: !isRecurring ? 'Date is required' : false })}
                  type="date"
                  className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[52px]"
                />
                <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 peer-focus:text-blue-600 transition-colors">
                  Date
                </label>
                {errors.date && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>
            )}

            {/* Recurring Expense Fields */}
            {isRecurring && (
              <>
                <div className="relative">
                  <select
                    {...register('recurring_frequency', { required: isRecurring ? 'Frequency is required' : false })}
                    className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[52px] appearance-none bg-white"
                  >
                    <option value="">Select frequency</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly (Every 3 months)</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 peer-focus:text-blue-600 transition-colors">
                    Frequency
                  </label>
                  {/* Dropdown arrow */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {errors.recurring_frequency && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.recurring_frequency.message}</p>
                  )}
                </div>

                <div className="relative">
                  <input
                    {...register('recurring_start_date', { required: isRecurring ? 'Start date is required' : false })}
                    type="date"
                    className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[52px]"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 peer-focus:text-blue-600 transition-colors">
                    Start Date
                  </label>
                  {errors.recurring_start_date && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.recurring_start_date.message}</p>
                  )}
                </div>

                <div className="relative">
                  <input
                    {...register('recurring_end_date')}
                    type="date"
                    className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[52px]"
                  />
                  <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 peer-focus:text-blue-600 transition-colors">
                    End Date (optional)
                  </label>
                  <p className="mt-1.5 text-xs text-gray-500">Leave empty for ongoing expense</p>
                </div>
              </>
            )}

            {/* Description - Floating Label */}
            <div className="relative">
              <textarea
                {...register('description')}
                rows={2}
                placeholder=" "
                className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-transparent resize-none"
              />
              <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:font-medium peer-focus:text-blue-600 peer-focus:bg-white">
                Description (optional)
              </label>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {/* Preview for recurring */}
            {isRecurring && recurringFrequency && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-100">
                <h4 className="text-sm font-semibold text-purple-900 mb-1.5">Recurring Expense</h4>
                <p className="text-sm text-purple-700 leading-relaxed">
                  <span className="font-medium">${(Number(watch('amount')) || 0).toFixed(2)}</span> {watch('description') ? `for ${watch('description')}` : ''} every{' '}
                  <span className="font-medium">{recurringFrequency === 'biweekly' ? '2 weeks' : recurringFrequency.replace('ly', '')}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] min-h-[52px] font-semibold cursor-pointer transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none min-h-[52px] font-semibold cursor-pointer transition-all duration-200"
              >
                {loading ? 'Updating...' : isRecurring ? 'Update Recurring Expense' : 'Update Expense'}
              </button>
            </div>
          </form>
      </div>
    </div>
  )
}