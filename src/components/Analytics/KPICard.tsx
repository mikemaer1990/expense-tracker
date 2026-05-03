import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '../../utils/currency'

interface KPICardProps {
  label: string
  value: number
  currency: string
  priorValue: number
  sentiment: 'income' | 'expense' | 'surplus' | 'deficit'
  sparklineData?: number[]
}

const gradients: Record<string, string> = {
  income: 'from-green-400 to-emerald-500',
  expense: 'from-orange-400 to-red-500',
  surplus: 'from-blue-400 to-indigo-500',
  deficit: 'from-red-400 to-rose-500',
}

const valueColors: Record<string, string> = {
  income: 'text-green-600',
  expense: 'text-orange-600',
  surplus: 'text-blue-600',
  deficit: 'text-red-600',
}

const sparklineColors: Record<string, string> = {
  income: 'rgb(34, 197, 94)',
  expense: 'rgb(234, 88, 12)',
  surplus: 'rgb(99, 102, 241)',
  deficit: 'rgb(239, 68, 68)',
}

export default function KPICard({ label, value, currency, priorValue, sentiment, sparklineData }: KPICardProps) {
  const delta = priorValue > 0 ? ((value - priorValue) / priorValue) * 100 : null

  // For expenses: more spending (positive delta) is bad; for everything else: positive is good
  const deltaIsPositive = delta !== null && delta > 0
  const deltaIsBad = sentiment === 'expense' ? deltaIsPositive : !deltaIsPositive

  const hasSparkline = sparklineData && sparklineData.length > 1
  const maxSparkline = hasSparkline ? Math.max(...sparklineData!, 0.01) : 0.01

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${gradients[sentiment]}`} />
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{label}</p>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className={`text-3xl font-bold tabular-nums leading-tight ${valueColors[sentiment]}`}>
            {formatCurrency(value, currency)}
          </p>
          {delta !== null && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
              deltaIsBad ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {deltaIsPositive
                ? <ArrowTrendingUpIcon className="h-3 w-3" />
                : <ArrowTrendingDownIcon className="h-3 w-3" />
              }
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          vs {formatCurrency(priorValue, currency)} prior period
        </p>
        {hasSparkline && (
          <div className="mt-3">
            <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
              {sparklineData!.map((v, i) => {
                const barW = 100 / sparklineData!.length
                const barH = (v / maxSparkline) * 26
                return (
                  <rect
                    key={i}
                    x={i * barW + 1}
                    y={30 - barH}
                    width={barW - 2}
                    height={Math.max(barH, 1)}
                    rx="1"
                    fill={sparklineColors[sentiment]}
                    opacity="0.4"
                  />
                )
              })}
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
