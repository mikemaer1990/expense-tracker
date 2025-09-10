import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
            Add Income
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

            {/* One-time Income Fields */}
            {!isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  {...register('date', { required: !isRecurring ? 'Date is required' : false })}
                  type="date"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>
            )}

            {/* Recurring Income Fields */}
            {isRecurring && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    {...register('recurring_frequency', { required: isRecurring ? 'Frequency is required' : false })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty for ongoing income</p>
                </div>
              </>
            )}

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
            {isRecurring && recurringFrequency && (
              <div className="bg-green-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-green-900">Recurring Income Preview:</h4>
                <p className="text-sm text-green-700">
                  ${(Number(watch('amount')) || 0).toFixed(2)} from {watch('source') || 'income source'} every{' '}
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? 'Adding...' : isRecurring ? 'Set Up Recurring Income' : 'Add Income'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}