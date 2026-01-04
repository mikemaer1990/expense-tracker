import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import Modal from '../UI/Modal'
import FloatingLabelInput from '../UI/FloatingLabelInput'
import FloatingLabelTextarea from '../UI/FloatingLabelTextarea'
import CheckboxField from '../UI/CheckboxField'
import FormButtons from '../UI/FormButtons'

interface IncomeForm {
  source: string
  amount: number
  date: string
  is_recurring: boolean
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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IncomeForm>({
    defaultValues: {
      source: income.source || '',
      amount: income.amount,
      date: income.date,
      is_recurring: income.is_recurring || false,
      description: income.description || '',
    },
  })

  const isRecurring = watch('is_recurring')

  const onSubmit = async (data: IncomeForm) => {
    try {
      setError('')
      setLoading(true)

      const { error } = await supabase
        .from('income')
        .update({
          source: data.source,
          amount: data.amount,
          date: data.date,
          is_recurring: data.is_recurring,
          description: data.description || null,
        })
        .eq('id', income.id)

      if (error) throw error

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
            />

            {/* Date - Floating Label */}
            <FloatingLabelInput
              {...register('date', { required: 'Date is required' })}
              label="Date"
              type="date"
              accentColor="green"
              error={errors.date}
            />

            {/* Recurring Toggle */}
            <CheckboxField
              {...register('is_recurring')}
              label="This is recurring income"
              accentColor="green"
            />

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
            {isRecurring && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-100">
                <h4 className="text-sm font-semibold text-purple-900 mb-1.5">Recurring Income</h4>
                <p className="text-sm text-purple-700 leading-relaxed">
                  <span className="font-medium">${(Number(watch('amount')) || 0).toFixed(2)}</span> from {watch('source') || 'income source'}
                </p>
              </div>
            )}

            <FormButtons
              onCancel={onClose}
              submitLabel="Update Income"
              isLoading={loading}
              loadingLabel="Updating..."
              accentColor="green"
            />
          </form>
    </Modal>
  )
}
