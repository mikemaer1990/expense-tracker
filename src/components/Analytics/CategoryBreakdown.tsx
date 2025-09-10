import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface ExpenseTypeData {
  id: string
  name: string
  totalAmount: number
  monthlyData: { [month: string]: number }
  transactionCount: number
}

interface CategoryData {
  id: string
  name: string
  color: string
  totalAmount: number
  expenseTypes: ExpenseTypeData[]
  percentage: number
}

interface CategoryBreakdownProps {
  categories: CategoryData[]
  timePeriod: 'monthly' | 'yearly'
  currentPeriodLabel: string
  onExpenseTypeClick?: (categoryId: string, expenseTypeId: string) => void
}

export default function CategoryBreakdown({ 
  categories, 
  timePeriod, 
  currentPeriodLabel,
  onExpenseTypeClick 
}: CategoryBreakdownProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const formatTrend = (monthlyData: { [month: string]: number }) => {
    if (timePeriod === 'monthly' || Object.keys(monthlyData).length < 2) return null
    
    const months = Object.keys(monthlyData).sort()
    const lastMonth = monthlyData[months[months.length - 2]] || 0
    const currentMonth = monthlyData[months[months.length - 1]] || 0
    
    if (lastMonth === 0) return null
    
    const percentChange = ((currentMonth - lastMonth) / lastMonth) * 100
    return {
      direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'same',
      percentage: Math.abs(percentChange)
    }
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id)
        const hasExpenseTypes = category.expenseTypes.length > 0

        return (
          <div key={category.id} className="bg-white shadow rounded-lg overflow-hidden">
            {/* Category Header */}
            <div 
              className={`px-6 py-4 border-b border-gray-200 ${hasExpenseTypes ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={hasExpenseTypes ? () => toggleCategory(category.id) : undefined}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {hasExpenseTypes && (
                    <div className="text-gray-400">
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5" />
                      )}
                    </div>
                  )}
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {category.percentage.toFixed(1)}% of total expenses • {currentPeriodLabel}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xl font-semibold text-gray-900">
                    ${category.totalAmount.toFixed(2)}
                  </div>
                  {timePeriod === 'yearly' && (
                    <div className="text-sm text-gray-500">
                      Avg: ${(category.totalAmount / 12).toFixed(2)}/month
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Expense Types */}
            {isExpanded && hasExpenseTypes && (
              <div className="px-6 py-4">
                <div className="space-y-3">
                  {category.expenseTypes
                    .sort((a, b) => b.totalAmount - a.totalAmount)
                    .map((expenseType) => {
                      const trend = formatTrend(expenseType.monthlyData)
                      
                      return (
                        <div 
                          key={expenseType.id}
                          className={`flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg ${
                            onExpenseTypeClick ? 'cursor-pointer hover:bg-gray-100 transition-colors duration-200' : ''
                          }`}
                          onClick={() => onExpenseTypeClick?.(category.id, expenseType.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900 flex items-center space-x-2">
                                  <span>{expenseType.name}</span>
                                  {trend && (
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      trend.direction === 'up' 
                                        ? 'bg-red-100 text-red-700' 
                                        : trend.direction === 'down' 
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} 
                                      {trend.percentage.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-sm text-gray-500 mt-1 space-x-4">
                                  {timePeriod === 'yearly' && Object.keys(expenseType.monthlyData).length > 0 && (
                                    <span>
                                      Monthly avg: ${(expenseType.totalAmount / Math.max(Object.keys(expenseType.monthlyData).length, 1)).toFixed(2)}
                                    </span>
                                  )}
                                  {expenseType.transactionCount > 0 && (
                                    <span>
                                      {expenseType.transactionCount} transaction{expenseType.transactionCount !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="text-right ml-4">
                                <div className="font-semibold text-gray-900">
                                  ${expenseType.totalAmount.toFixed(2)}
                                </div>
                                {timePeriod === 'yearly' && Object.keys(expenseType.monthlyData).length > 0 && (
                                  <div className="text-sm text-gray-500">
                                    {Object.keys(expenseType.monthlyData).length} months active
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Monthly breakdown for yearly view */}
                            {timePeriod === 'yearly' && isExpanded && Object.keys(expenseType.monthlyData).length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="grid grid-cols-6 md:grid-cols-12 gap-2 text-xs">
                                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                                    <div key={month} className="text-center">
                                      <div className="font-medium text-gray-600">{month}</div>
                                      <div className={`${expenseType.monthlyData[month] ? 'text-gray-900' : 'text-gray-300'}`}>
                                        ${expenseType.monthlyData[month]?.toFixed(0) || '0'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!hasExpenseTypes && (
              <div className="px-6 py-8 text-center text-gray-500">
                No expenses in this category for the selected period
              </div>
            )}
          </div>
        )
      })}

      {categories.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center text-gray-500">
            No expense data available for the selected period
          </div>
        </div>
      )}
    </div>
  )
}