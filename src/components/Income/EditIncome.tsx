import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full transition-opacity duration-200 opacity-100">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto transform transition-all duration-300 scale-100 translate-y-0">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
            Edit Income
          </h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Income Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Income Source</label>
              <input
                {...register('source', { required: 'Income source is required' })}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Salary, Freelance, Investment"
              />
              {errors.source && (
                <p className="mt-1 text-sm text-red-600">{errors.source.message}</p>
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
                step="0.01"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                {...register('date', { required: 'Date is required' })}
                type="date"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Recurring Toggle */}
            <div>
              <label className="flex items-center">
                <input
                  {...register('is_recurring')}
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">This is recurring income</span>
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description (optional)</label>
              <textarea
                {...register('description')}
                rows={2}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Additional details about this income..."
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {/* Preview for recurring */}
            {isRecurring && (
              <div className="bg-green-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-green-900">Recurring Income:</h4>
                <p className="text-sm text-green-700">
                  ${(Number(watch('amount')) || 0).toFixed(2)} from {watch('source') || 'income source'}
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Income'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}