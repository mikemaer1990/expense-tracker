import { formatCurrency } from '../../utils/currency'

interface SavingsRateBarProps {
  income: number
  expenses: number
  currency: string
}

export default function SavingsRateBar({ income, expenses, currency }: SavingsRateBarProps) {
  if (income <= 0) return null

  const saved = income - expenses
  const rate = (saved / income) * 100
  const displayRate = Math.max(-999, Math.min(999, rate))
  const barWidth = Math.max(0, Math.min(100, rate))

  const rateColor = rate >= 20 ? 'text-green-600' : rate > 0 ? 'text-yellow-600' : 'text-red-600'
  const barColor = rate >= 20 ? 'bg-green-500' : rate > 0 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">Savings Rate</span>
        <span className={`text-xl font-bold tabular-nums ${rateColor}`}>
          {displayRate.toFixed(0)}%
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1.5">
        <span>{formatCurrency(expenses, currency)} spent</span>
        <span className={saved >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
          {saved >= 0 ? '+' : ''}{formatCurrency(saved, currency)} {saved >= 0 ? 'saved' : 'over budget'}
        </span>
      </div>
    </div>
  )
}
