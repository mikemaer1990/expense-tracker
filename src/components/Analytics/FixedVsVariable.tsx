import { formatCurrency } from '../../utils/currency'

interface FixedVsVariableProps {
  fixedTotal: number
  variableTotal: number
  totalExpenses: number
  currency: string
}

export default function FixedVsVariable({ fixedTotal, variableTotal, totalExpenses, currency }: FixedVsVariableProps) {
  const fixedPct = totalExpenses > 0 ? (fixedTotal / totalExpenses) * 100 : 0
  const variablePct = totalExpenses > 0 ? (variableTotal / totalExpenses) * 100 : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-400 to-orange-400" />
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Fixed vs Variable</h3>

        {totalExpenses > 0 ? (
          <>
            <div className="h-3 rounded-full overflow-hidden flex mb-4">
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${fixedPct}%` }}
              />
              <div className="bg-orange-400 flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-1.5" />
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Fixed</p>
                <p className="text-xl font-bold text-blue-700 tabular-nums">
                  {formatCurrency(fixedTotal, currency, 0)}
                </p>
                <p className="text-xs text-blue-500">{fixedPct.toFixed(0)}% of spending</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-orange-400 mx-auto mb-1.5" />
                <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Variable</p>
                <p className="text-xl font-bold text-orange-700 tabular-nums">
                  {formatCurrency(variableTotal, currency, 0)}
                </p>
                <p className="text-xs text-orange-500">{variablePct.toFixed(0)}% of spending</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
              Fixed = recurring transactions · Variable = one-off expenses
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            No spending data yet
          </div>
        )}
      </div>
    </div>
  )
}
