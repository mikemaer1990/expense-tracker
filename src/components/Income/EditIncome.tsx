import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import Modal from '../UI/Modal'
import FloatingLabelInput from '../UI/FloatingLabelInput'
import FloatingLabelTextarea from '../UI/FloatingLabelTextarea'
import FloatingLabelSelect from '../UI/FloatingLabelSelect'
import CheckboxField from '../UI/CheckboxField'
import FormButtons from '../UI/FormButtons'

interface IncomeForm {
  source: string
  amount: number
  date: string
  is_recurring: boolean
  recurring_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  recurring_start_date?: string
  recurring_end_date?: string
  description?: string
}

interface EditIncomeProps {
  income: any
  onClose: () => void
  onSuccess: () => void
}

export default function EditIncome({ income, onClose, onSuccess }: EditIncomeProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState<'single' | 'all' | null>(
    income.recurring_template_id ? null : 'single'
  )
  const [templateData, setTemplateData] = useState<{
    frequency: string
    start_date: string
    end_date: string | null
  } | null>(null)

  // Fetch recurring template data if this is recurring income
  useEffect(() => {
    async function fetchTemplate() {
      if (income.recurring_template_id) {
        const { data, error } = await supabase
          .from('recurring_templates')
          .select('frequency, start_date, end_date')
          .eq('id', income.recurring_template_id)
          .single()

        if (!error && data) {
          setTemplateData(data)
        }
      }
    }
    fetchTemplate()
  }, [income.recurring_template_id])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IncomeForm>({
    defaultValues: {
      source: income.source || '',
      amount: income.amount,
      date: income.date,
      is_recurring: income.is_recurring || false,
      recurring_frequency: undefined,
      recurring_start_date: income.date,
      description: income.description || '',
    },
  })

  const isRecurring = watch('is_recurring')
  const recurringFrequency = watch('recurring_frequency')

  // Populate recurring fields when template data loads
  useEffect(() => {
    if (templateData) {
      setValue('recurring_frequency', templateData.frequency as any)
      setValue('recurring_start_date', templateData.start_date)
      if (templateData.end_date) {
        setValue('recurring_end_date', templateData.end_date)
      }
    }
  }, [templateData, setValue])

  const onSubmit = async (data: IncomeForm) => {
    try {
      setError('')
      setLoading(true)

      // If editing all future instances of a recurring income
      if (editMode === 'all' && income.recurring_template_id) {
        // Update the template
        const { error: templateError } = await supabase
          .from('recurring_templates')
          .update({
            source: data.source,
            amount: data.amount,
            description: data.description || null,
            frequency: data.recurring_frequency,
            start_date: data.recurring_start_date,
            end_date: data.recurring_end_date || null,
          })
          .eq('id', income.recurring_template_id)

        if (templateError) throw templateError

        // Update the current income being edited
        const { error: currentError } = await supabase
          .from('income')
          .update({
            source: data.source,
            amount: data.amount,
            description: data.description || null,
          })
          .eq('id', income.id)

        if (currentError) throw currentError

        // Delete all FUTURE generated instances (they'll regenerate with new values)
        const today = new Date().toISOString().split('T')[0]
        const { error: deleteError } = await supabase
          .from('income')
          .delete()
          .eq('recurring_template_id', income.recurring_template_id)
          .eq('is_generated', true)
          .gt('date', today)

        if (deleteError) throw deleteError
      } else {
        // Edit single instance only (or non-recurring)
        // Keep recurring link intact - just modify this instance's values
        const updateData: any = {
          source: data.source,
          amount: data.amount,
          date: data.date,
          description: data.description || null,
        }

        const { error } = await supabase
          .from('income')
          .update(updateData)
          .eq('id', income.id)

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

  // Show edit choice modal if this is a recurring income
  if (income.recurring_template_id && editMode === null) {
    return (
      <Modal title="Edit Recurring Income" onClose={onClose} accentColor="green">
        <div className="p-6 space-y-6">
          <p className="text-gray-700">
            This is recurring income. What would you like to edit?
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setEditMode('single')}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="font-semibold text-gray-900">Edit only this one</div>
              <div className="text-sm text-gray-600 mt-1">
                Changes will only affect this single transaction
              </div>
            </button>

            <button
              onClick={() => setEditMode('all')}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
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
      title="Edit Income"
      onClose={onClose}
      accentColor="green"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
            {/* Income Source - Floating Label */}
            <FloatingLabelInput
              {...register('source', { required: 'Income source is required' })}
              label="Income Source"
              type="text"
              accentColor="green"
              error={errors.source}
            />

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
              accentColor="green"
              error={errors.amount}
              autoComplete="off"
            />

            {/* Recurring Toggle */}
            <CheckboxField
              {...register('is_recurring')}
              label="This is recurring income"
              accentColor="green"
            />

            {/* One-time Income Fields */}
            {!isRecurring && (
              <FloatingLabelInput
                {...register('date', { required: !isRecurring ? 'Date is required' : false })}
                label="Date"
                type="date"
                accentColor="green"
                error={errors.date}
              />
            )}

            {/* Recurring Income Fields */}
            {isRecurring && (
              <>
                <FloatingLabelSelect
                  {...register('recurring_frequency', { required: isRecurring ? 'Frequency is required' : false })}
                  label="Frequency"
                  accentColor="green"
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
                  accentColor="green"
                  error={errors.recurring_start_date}
                />

                <FloatingLabelInput
                  {...register('recurring_end_date')}
                  label="End Date (optional)"
                  type="date"
                  accentColor="green"
                />
                <p className="mt-1.5 text-xs text-gray-500">Leave empty for ongoing income</p>
              </>
            )}

            {/* Description - Floating Label */}
            <FloatingLabelTextarea
              {...register('description')}
              label="Description (optional)"
              rows={2}
              accentColor="green"
            />

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {/* Preview for recurring */}
            {isRecurring && recurringFrequency && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-100">
                <h4 className="text-sm font-semibold text-purple-900 mb-1.5">Recurring Income</h4>
                <p className="text-sm text-purple-700 leading-relaxed">
                  <span className="font-medium">${(Number(watch('amount')) || 0).toFixed(2)}</span> from {watch('source') || 'income source'} every{' '}
                  <span className="font-medium">{recurringFrequency === 'biweekly' ? '2 weeks' : recurringFrequency.replace('ly', '')}</span>
                </p>
              </div>
            )}

            <FormButtons
              onCancel={onClose}
              submitLabel={isRecurring ? 'Update Recurring Income' : 'Update Income'}
              isLoading={loading}
              loadingLabel="Updating..."
              accentColor="green"
            />
          </form>
    </Modal>
  )
}
