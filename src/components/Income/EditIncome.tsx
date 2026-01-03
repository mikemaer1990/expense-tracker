import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { XMarkIcon } from '@heroicons/react/24/outline'
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

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 transition-opacity duration-200 opacity-100">
      <div className="relative mx-auto border shadow-lg bg-white
                      /* Mobile: Full screen with slide-up animation */
                      min-h-screen w-full p-0 rounded-none
                      /* Desktop: Centered modal with fade animation */
                      md:top-20 md:w-96 md:max-h-[80vh] md:min-h-0 md:rounded-md md:overflow-y-auto
                      /* Animation classes */
                      transform transition-all duration-300 scale-100 translate-y-0">
        {/* Close button - top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full transition-colors duration-200 z-20"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Modal Header */}
        <div className="relative">
          {/* Gradient accent bar */}
          <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-6 py-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 text-center">
              Edit Income
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
            {/* Income Source - Floating Label */}
            <div className="relative">
              <input
                {...register('source', { required: 'Income source is required' })}
                type="text"
                placeholder=" "
                className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-transparent min-h-[52px]"
              />
              <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:font-medium peer-focus:text-green-600 peer-focus:bg-white">
                Income Source
              </label>
              {errors.source && (
                <p className="mt-1.5 text-sm text-red-600">{errors.source.message}</p>
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
                className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-transparent min-h-[52px]"
              />
              <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:font-medium peer-focus:text-green-600 peer-focus:bg-white">
                Amount
              </label>
              {errors.amount && (
                <p className="mt-1.5 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Date - Floating Label */}
            <div className="relative">
              <input
                {...register('date', { required: 'Date is required' })}
                type="date"
                className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all min-h-[52px]"
              />
              <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 peer-focus:text-green-600 transition-colors">
                Date
              </label>
              {errors.date && (
                <p className="mt-1.5 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Recurring Toggle */}
            <div>
              <label className="flex items-center cursor-pointer group">
                <input
                  {...register('is_recurring')}
                  type="checkbox"
                  className="h-5 w-5 text-green-600 focus:ring-2 focus:ring-green-500/20 focus:ring-offset-0 border-2 border-gray-300 rounded-md transition-all cursor-pointer"
                />
                <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">This is recurring income</span>
              </label>
            </div>

            {/* Description - Floating Label */}
            <div className="relative">
              <textarea
                {...register('description')}
                rows={2}
                placeholder=" "
                className="peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder-transparent resize-none"
              />
              <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:font-medium peer-focus:text-green-600 peer-focus:bg-white">
                Description (optional)
              </label>
            </div>

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

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] min-h-[52px] font-semibold cursor-pointer transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none min-h-[52px] font-semibold cursor-pointer transition-all duration-200"
              >
                {loading ? 'Updating...' : 'Update Income'}
              </button>
            </div>
          </form>
      </div>
    </div>
  )
}