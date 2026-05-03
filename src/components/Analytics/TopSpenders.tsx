import { formatCurrency } from '../../utils/currency'

interface SpenderItem {
  id: string
  name: string
  categoryName: string
  categoryColor: string
  totalAmount: number
  transactionCount: number
}

interface TopSpendersProps {
  items: SpenderItem[]
  totalExpenses: number
  currency: string
}

export default function TopSpenders({ items, totalExpenses, currency }: TopSpendersProps) {
  const top5 = items.slice(0, 5)
  const maxAmount = top5[0]?.totalAmount || 1

  if (top5.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center h-40 text-gray-400 text-sm">
        No spending data yet
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-purple-400 to-indigo-500" />
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Top Spending Areas</h3>
        <ol className="space-y-4">
          {top5.map((item, i) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.categoryColor }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                  <span className="text-sm font-semibold text-gray-900 ml-2 flex-shrink-0 tabular-nums">
                    {formatCurrency(item.totalAmount, currency)}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.totalAmount / maxAmount) * 100}%`,
                      backgroundColor: item.categoryColor,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-0.5 block">
                  {totalExpenses > 0 ? ((item.totalAmount / totalExpenses) * 100).toFixed(1) : 0}% · {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
