import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import IconRenderer from '../UI/IconRenderer'
import Modal from '../UI/Modal'
import FloatingLabelInput from '../UI/FloatingLabelInput'
import FloatingLabelTextarea from '../UI/FloatingLabelTextarea'
import FloatingLabelSelect from '../UI/FloatingLabelSelect'
import SelectionCard from '../UI/SelectionCard'
import CheckboxField from '../UI/CheckboxField'
import FormButtons from '../UI/FormButtons'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [editMode, setEditMode] = useState<'single' | 'all' | null>(
    expense.recurring_template_id ? null : 'single'
  )

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

  useEffect(() => {
    // Set form value immediately since expense types are pre-loaded
    if (expense.expense_type_id) {
      setValue('expense_type_id', expense.expense_type_id)
    }
  }, [expense.expense_type_id, setValue])

  const onSubmit = async (data: ExpenseForm) => {
    try {
      setError('')
      setLoading(true)

      // Calculate amounts for splitting
      const originalAmount = Number(data.amount)
      const finalAmount = data.is_split ? originalAmount / 2 : originalAmount

      // If editing all future instances of a recurring expense
      if (editMode === 'all' && expense.recurring_template_id) {
        // Update the template
        const { error: templateError } = await supabase
          .from('recurring_templates')
          .update({
            expense_type_id: data.expense_type_id,
            amount: finalAmount,
            description: data.description || null,
            is_split: data.is_split,
            original_amount: data.is_split ? originalAmount : null,
            split_with: data.is_split ? data.split_with || null : null,
          })
          .eq('id', expense.recurring_template_id)

        if (templateError) throw templateError

        // Update the current expense being edited
        const { error: currentError } = await supabase
          .from('expenses')
          .update({
            expense_type_id: data.expense_type_id,
            amount: finalAmount,
            description: data.description || null,
            is_split: data.is_split,
            original_amount: data.is_split ? originalAmount : null,
            split_with: data.is_split ? data.split_with || null : null,
          })
          .eq('id', expense.id)

        if (currentError) throw currentError

        // Delete all FUTURE generated instances (they'll regenerate with new values)
        const today = new Date().toISOString().split('T')[0]
        const { error: deleteError } = await supabase
          .from('expenses')
          .delete()
          .eq('recurring_template_id', expense.recurring_template_id)
          .eq('is_generated', true)
          .gt('date', today)

        if (deleteError) throw deleteError
      } else {
        // Edit single instance only (or non-recurring)
        const updateData: any = {
          expense_type_id: data.expense_type_id,
          amount: finalAmount,
          date: data.date,
          description: data.description || null,
          is_split: data.is_split,
          original_amount: data.is_split ? originalAmount : null,
          split_with: data.is_split ? data.split_with || null : null,
        }

        // If editing single instance of recurring expense, unlink from template
        if (editMode === 'single' && expense.recurring_template_id) {
          updateData.recurring_template_id = null
          updateData.is_recurring = false
        }

        const { error } = await supabase
          .from('expenses')
          .update(updateData)
          .eq('id', expense.id)

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

  const groupedTypes = expenseTypes.reduce((acc, type) => {
    const categoryName = type.categories?.name || 'Other'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(type)
    return acc
  }, {} as Record<string, ExpenseType[]>)

  // Show edit choice modal if this is a recurring expense
  if (expense.recurring_template_id && editMode === null) {
    return (
      <Modal title="Edit Recurring Expense" onClose={onClose} accentColor="blue">
        <div className="p-6 space-y-6">
          <p className="text-gray-700">
            This is a recurring expense. What would you like to edit?
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setEditMode('single')}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="font-semibold text-gray-900">Edit only this one</div>
              <div className="text-sm text-gray-600 mt-1">
                Changes will only affect this single transaction
              </div>
            </button>

            <button
              onClick={() => setEditMode('all')}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="font-semibold text-gray-900">Edit all future instances</div>
              <div className="text-sm text-gray-600 mt-1">
                Updates the template and all future occurrences
              </div>
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Edit Expense"
      onClose={onClose}
      accentColor="blue"
      desktopWidth="comfortable"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        {/* Two-column layout on desktop, single column on mobile */}
        <div className="flex flex-col md:grid md:grid-cols-[1.2fr_1fr] md:gap-6">
          {/* LEFT COLUMN - Type Selection */}
          <div className="space-y-4 md:pr-4 md:border-r md:border-gray-200">
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
                            <SelectionCard
                              key={type.id}
                              isSelected={isSelected}
                              onClick={() => {
                                register('expense_type_id').onChange({ target: { value: type.id, name: 'expense_type_id' } })
                              }}
                              icon={
                                <IconRenderer
                                  iconName={type.icon_name}
                                  size="lg"
                                  className="transition-colors"
                                />
                              }
                              label={type.name}
                              accentColor="emerald"
                            />
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
          </div>

          {/* RIGHT COLUMN - Form Fields */}
          <div className="space-y-4 mt-4 md:mt-0">
            {/* Amount - Floating Label */}
            <FloatingLabelInput
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })}
              label="Amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              accentColor="blue"
              error={errors.amount}
              autoComplete="off"
            />

            {/* Expense Splitting (conditional) */}
            {preferences.enableExpenseSplitting && (
              <div>
                <CheckboxField
                  {...register('is_split')}
                  label="Split this expense"
                  accentColor="blue"
                />

                {isSplit && (
                  <div className="mt-3 space-y-3">
                    <FloatingLabelInput
                      {...register('split_with', {
                        required: isSplit ? 'Please specify who you\'re splitting with' : false
                      })}
                      label="Split with"
                      type="text"
                      accentColor="blue"
                      error={errors.split_with}
                    />

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
            <CheckboxField
              {...register('is_recurring')}
              label="This is a recurring expense"
              accentColor="purple"
            />

            {/* One-time Expense Fields */}
            {!isRecurring && (
              <FloatingLabelInput
                {...register('date', { required: !isRecurring ? 'Date is required' : false })}
                label="Date"
                type="date"
                accentColor="blue"
                error={errors.date}
              />
            )}

            {/* Recurring Expense Fields */}
            {isRecurring && (
              <>
                <FloatingLabelSelect
                  {...register('recurring_frequency', { required: isRecurring ? 'Frequency is required' : false })}
                  label="Frequency"
                  accentColor="blue"
                  error={errors.recurring_frequency}
                >
                  <option value="">Select frequency</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly (Every 3 months)</option>
                  <option value="yearly">Yearly</option>
                </FloatingLabelSelect>

                <FloatingLabelInput
                  {...register('recurring_start_date', { required: isRecurring ? 'Start date is required' : false })}
                  label="Start Date"
                  type="date"
                  accentColor="blue"
                  error={errors.recurring_start_date}
                />

                <FloatingLabelInput
                  {...register('recurring_end_date')}
                  label="End Date (optional)"
                  type="date"
                  accentColor="blue"
                />
                <p className="mt-1.5 text-xs text-gray-500">Leave empty for ongoing expense</p>
              </>
            )}

            {/* Description - Floating Label */}
            <FloatingLabelTextarea
              {...register('description')}
              label="Description (optional)"
              rows={2}
              accentColor="blue"
            />

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

            <FormButtons
              onCancel={onClose}
              submitLabel={isRecurring ? 'Update Recurring Expense' : 'Update Expense'}
              isLoading={loading}
              loadingLabel="Updating..."
              accentColor="blue"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
