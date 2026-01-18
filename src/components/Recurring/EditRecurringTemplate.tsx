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

interface TemplateForm {
  amount: number
  description?: string
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  end_date?: string
  // Expense-specific
  expense_type_id?: string
  is_split: boolean
  split_with?: string
  // Income-specific
  source?: string
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

interface RecurringTemplate {
  id: string
  user_id: string
  template_type: 'expense' | 'income'
  amount: number
  description: string | null
  expense_type_id: string | null
  is_split: boolean
  original_amount: number | null
  split_with: string | null
  source: string | null
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  end_date: string | null
  last_generated_date: string | null
  next_generation_date: string | null
  is_active: boolean
  created_at: string
  expense_type?: ExpenseType
}

interface EditRecurringTemplateProps {
  template: RecurringTemplate
  expenseTypes: ExpenseType[]
  onClose: () => void
  onSuccess: () => void
}

export default function EditRecurringTemplate({
  template,
  expenseTypes,
  onClose,
  onSuccess
}: EditRecurringTemplateProps) {
  const { preferences } = useUserPreferences()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const isExpense = template.template_type === 'expense'

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TemplateForm>({
    defaultValues: {
      amount: template.is_split ? template.original_amount || template.amount : template.amount,
      description: template.description || '',
      frequency: template.frequency,
      start_date: template.start_date,
      end_date: template.end_date || '',
      expense_type_id: template.expense_type_id || '',
      is_split: template.is_split || false,
      split_with: template.split_with || '',
      source: template.source || '',
    },
  })

  const isSplit = watch('is_split')
  const amount = watch('amount')
  const frequency = watch('frequency')

  useEffect(() => {
    if (template.expense_type_id) {
      setValue('expense_type_id', template.expense_type_id)
    }
  }, [template.expense_type_id, setValue])

  const onSubmit = async (data: TemplateForm) => {
    try {
      setError('')
      setLoading(true)

      // Calculate amounts for splitting
      const originalAmount = Number(data.amount)
      const finalAmount = data.is_split ? originalAmount / 2 : originalAmount

      // Build update object based on template type
      const updateData = isExpense
        ? {
            amount: finalAmount,
            description: data.description || null,
            frequency: data.frequency,
            start_date: data.start_date,
            end_date: data.end_date || null,
            expense_type_id: data.expense_type_id,
            is_split: data.is_split,
            original_amount: data.is_split ? originalAmount : null,
            split_with: data.is_split ? data.split_with || null : null,
          }
        : {
            amount: finalAmount,
            description: data.description || null,
            frequency: data.frequency,
            start_date: data.start_date,
            end_date: data.end_date || null,
            source: data.source,
          }

      // Update the template
      const { error: templateError } = await supabase
        .from('recurring_templates')
        .update(updateData)
        .eq('id', template.id)

      if (templateError) throw templateError

      // Delete future generated instances (they'll regenerate with new values)
      const today = new Date().toISOString().split('T')[0]
      const table = isExpense ? 'expenses' : 'income'

      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('recurring_template_id', template.id)
        .eq('is_generated', true)
        .gt('date', today)

      if (deleteError) throw deleteError

      onSuccess()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Group expense types by category
  const groupedTypes = expenseTypes.reduce((acc, type) => {
    const categoryName = type.categories?.name || 'Other'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(type)
    return acc
  }, {} as Record<string, ExpenseType[]>)

  return (
    <Modal
      title={`Edit Recurring ${isExpense ? 'Expense' : 'Income'}`}
      onClose={onClose}
      accentColor={isExpense ? 'orange' : 'green'}
      desktopWidth={isExpense ? 'comfortable' : 'default'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        {isExpense ? (
          /* Expense Template: Two-column layout */
          <div className="flex flex-col md:grid md:grid-cols-[1.2fr_1fr] md:gap-6">
            {/* LEFT COLUMN - Type Selection */}
            <div className="space-y-4 md:pr-4 md:border-r md:border-gray-200">
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
                    className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                {/* Icon Grid - Grouped by Category */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
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
                                accentColor="orange"
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
              <FloatingLabelInput
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' }
                })}
                label="Amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                accentColor="orange"
                error={errors.amount}
                autoComplete="off"
              />

              {/* Expense Splitting */}
              {preferences.enableExpenseSplitting && (
                <div>
                  <CheckboxField
                    {...register('is_split')}
                    label="Split this expense"
                    accentColor="orange"
                  />

                  {isSplit && (
                    <div className="mt-3 space-y-3">
                      <FloatingLabelInput
                        {...register('split_with', {
                          required: isSplit ? 'Please specify who you\'re splitting with' : false
                        })}
                        label="Split with"
                        type="text"
                        accentColor="orange"
                        error={errors.split_with}
                      />

                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-100">
                        <h4 className="text-sm font-semibold text-orange-900 mb-1.5">Split Preview</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-orange-700">
                            <span className="font-medium">Original:</span> ${(Number(amount) || 0).toFixed(2)}
                          </p>
                          <p className="text-sm text-orange-700">
                            <span className="font-medium">Your share:</span> ${((Number(amount) || 0) / 2).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <FloatingLabelSelect
                {...register('frequency', { required: 'Frequency is required' })}
                label="Frequency"
                accentColor="orange"
                error={errors.frequency}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly (Every 3 months)</option>
                <option value="yearly">Yearly</option>
              </FloatingLabelSelect>

              <FloatingLabelInput
                {...register('start_date', { required: 'Start date is required' })}
                label="Start Date"
                type="date"
                accentColor="orange"
                error={errors.start_date}
              />

              <FloatingLabelInput
                {...register('end_date')}
                label="End Date (optional)"
                type="date"
                accentColor="orange"
              />
              <p className="mt-1.5 text-xs text-gray-500">Leave empty for ongoing expense</p>

              <FloatingLabelTextarea
                {...register('description')}
                label="Description (optional)"
                rows={2}
                accentColor="orange"
              />

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              {/* Preview */}
              {frequency && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-100">
                  <h4 className="text-sm font-semibold text-orange-900 mb-1.5">Recurring Expense</h4>
                  <p className="text-sm text-orange-700 leading-relaxed">
                    <span className="font-medium">
                      ${isSplit ? ((Number(amount) || 0) / 2).toFixed(2) : (Number(amount) || 0).toFixed(2)}
                    </span>
                    {isSplit && (
                      <span className="text-orange-600"> (your share of ${(Number(amount) || 0).toFixed(2)})</span>
                    )}
                    {watch('description') ? ` for ${watch('description')}` : ''} every{' '}
                    <span className="font-medium">{frequency === 'biweekly' ? '2 weeks' : frequency.replace('ly', '')}</span>
                  </p>
                </div>
              )}

              <FormButtons
                onCancel={onClose}
                submitLabel="Update Recurring Expense"
                isLoading={loading}
                loadingLabel="Updating..."
                accentColor="orange"
              />
            </div>
          </div>
        ) : (
          /* Income Template: Single column layout */
          <div className="space-y-4">
            <FloatingLabelInput
              {...register('source', { required: 'Income source is required' })}
              label="Income Source"
              type="text"
              accentColor="green"
              error={errors.source}
            />

            <FloatingLabelInput
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })}
              label="Amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              accentColor="green"
              error={errors.amount}
              autoComplete="off"
            />

            <FloatingLabelSelect
              {...register('frequency', { required: 'Frequency is required' })}
              label="Frequency"
              accentColor="green"
              error={errors.frequency}
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly (Every 3 months)</option>
              <option value="yearly">Yearly</option>
            </FloatingLabelSelect>

            <FloatingLabelInput
              {...register('start_date', { required: 'Start date is required' })}
              label="Start Date"
              type="date"
              accentColor="green"
              error={errors.start_date}
            />

            <FloatingLabelInput
              {...register('end_date')}
              label="End Date (optional)"
              type="date"
              accentColor="green"
            />
            <p className="mt-1.5 text-xs text-gray-500">Leave empty for ongoing income</p>

            <FloatingLabelTextarea
              {...register('description')}
              label="Description (optional)"
              rows={2}
              accentColor="green"
            />

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {/* Preview */}
            {frequency && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-100">
                <h4 className="text-sm font-semibold text-green-900 mb-1.5">Recurring Income</h4>
                <p className="text-sm text-green-700 leading-relaxed">
                  <span className="font-medium">${(Number(amount) || 0).toFixed(2)}</span> from {watch('source') || 'income source'} every{' '}
                  <span className="font-medium">{frequency === 'biweekly' ? '2 weeks' : frequency.replace('ly', '')}</span>
                </p>
              </div>
            )}

            <FormButtons
              onCancel={onClose}
              submitLabel="Update Recurring Income"
              isLoading={loading}
              loadingLabel="Updating..."
              accentColor="green"
            />
          </div>
        )}
      </form>
    </Modal>
  )
}
