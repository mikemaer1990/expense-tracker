import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
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

export default function AddIncome({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IncomeForm>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      is_recurring: false,
      recurring_start_date: new Date().toISOString().split('T')[0],
    },
  })

  const isRecurring = watch('is_recurring')
  const recurringFrequency = watch('recurring_frequency')

  const onSubmit = async (data: IncomeForm) => {
    try {
      setError('')
      setLoading(true)

      if (data.is_recurring) {
        // Create recurring income entry with frequency in description
        const frequencyText = data.recurring_frequency === 'biweekly' ? 'every 2 weeks' : `every ${data.recurring_frequency?.replace('ly', '')}`
        const recurringDescription = `Recurring: ${frequencyText}${data.description ? ` - ${data.description}` : ''}`
        
        const { error } = await supabase.from('income').insert({
          user_id: user!.id,
          source: data.source,
          amount: data.amount,
          date: data.recurring_start_date!,
          is_recurring: true,
          description: recurringDescription,
        })

        if (error) throw error
      } else {
        // Create one-time income record
        const { error } = await supabase.from('income').insert({
          user_id: user!.id,
          source: data.source,
          amount: data.amount,
          date: data.date,
          is_recurring: false,
          description: data.description || null,
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

  return (
    <Modal
      title="Add New Income"
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
              submitLabel={isRecurring ? 'Set Up Recurring Income' : 'Add Income'}
              isLoading={loading}
              loadingLabel="Adding..."
              accentColor="green"
            />
          </form>
    </Modal>
  )
}