import { useState } from 'react'
import { LightBulbIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { formatCurrency, getCurrencySymbol } from '../../utils/currency'

interface InsightsBannerProps {
  totalExpenses: number
  priorExpenses: number
  totalIncome: number
  topCategory: { name: string; percentage: number } | null
  recurringTotal: number
  savingsRate: number
  timePeriod: 'monthly' | 'yearly'
  currency: string
}

function generateInsights(props: InsightsBannerProps): string[] {
  const { totalExpenses, priorExpenses, totalIncome, topCategory, recurringTotal, savingsRate, timePeriod, currency } = props
  const insights: string[] = []
  const sym = getCurrencySymbol(currency)
  const periodWord = timePeriod === 'monthly' ? 'last month' : 'last year'

  if (priorExpenses > 0 && totalExpenses > 0) {
    const pct = ((totalExpenses - priorExpenses) / priorExpenses) * 100
    if (Math.abs(pct) >= 5) {
      const diff = Math.abs(totalExpenses - priorExpenses)
      insights.push(pct > 0
        ? `You spent ${pct.toFixed(0)}% more than ${periodWord} (${sym}${diff.toLocaleString(undefined, { maximumFractionDigits: 0 })} over).`
        : `You spent ${Math.abs(pct).toFixed(0)}% less than ${periodWord} — great discipline!`
      )
    }
  }

  if (topCategory && topCategory.percentage > 40) {
    insights.push(`${topCategory.name} accounts for ${topCategory.percentage.toFixed(0)}% of all spending — consider reviewing this category.`)
  }

  if (recurringTotal > 0 && totalExpenses > 0) {
    const pct = (recurringTotal / totalExpenses) * 100
    insights.push(`${formatCurrency(recurringTotal, currency, 0)} (${pct.toFixed(0)}%) of your spending is fixed recurring costs.`)
  }

  if (totalIncome > 0) {
    if (savingsRate >= 20) {
      insights.push(`Your savings rate is ${savingsRate.toFixed(0)}% — on track for long-term goals.`)
    } else if (savingsRate > 0) {
      insights.push(`Your savings rate is ${savingsRate.toFixed(0)}%. Aim for 20%+ for long-term financial health.`)
    } else if (savingsRate < 0) {
      insights.push(`You're spending more than you earn this period. Check the fixed vs variable breakdown below.`)
    }
  }

  return insights.slice(0, 3)
}

export default function InsightsBanner(props: InsightsBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  const insights = generateInsights(props)

  if (dismissed || insights.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-2">
          <LightBulbIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-blue-700">Insights</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-300 hover:text-blue-500 transition-colors duration-200 cursor-pointer ml-2 flex-shrink-0"
          aria-label="Dismiss insights"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
      <ul className="space-y-1.5">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
            {insight}
          </li>
        ))}
      </ul>
    </div>
  )
}
