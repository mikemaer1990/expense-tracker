import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface MonthlyData {
  [month: string]: number
}

interface ExpenseTypeRow {
  id: string
  name: string
  categoryName: string
  monthlyData: MonthlyData
  yearTotal: number
  isSubrow: boolean
}

interface CategoryRow {
  id: string
  name: string
  color: string
  monthlyData: MonthlyData
  yearTotal: number
  isCategory: boolean
  expenseTypes: ExpenseTypeRow[]
}

interface DataGridProps {
  data: CategoryRow[]
  selectedYear: number
  onExportCSV?: () => void
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function DataGrid({ data, selectedYear, onExportCSV }: DataGridProps) {
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

  const calculateTotals = () => {
    const monthlyTotals: MonthlyData = {}
    let grandTotal = 0

    months.forEach(month => {
      monthlyTotals[month] = data.reduce((sum, category) => sum + (category.monthlyData[month] || 0), 0)
    })

    grandTotal = data.reduce((sum, category) => sum + category.yearTotal, 0)

    return { monthlyTotals, grandTotal }
  }

  const { monthlyTotals, grandTotal } = calculateTotals()

  const exportToCSV = () => {
    const csvData = []
    
    // Header
    csvData.push(['Category/Type', ...months, 'Year Total'])
    
    // Data rows
    data.forEach(category => {
      // Category row
      csvData.push([
        category.name,
        ...months.map(month => category.monthlyData[month] || 0),
        category.yearTotal
      ])
      
      // Expense type rows
      category.expenseTypes.forEach(expenseType => {
        csvData.push([
          `  ${expenseType.name}`, // Indent sub-items
          ...months.map(month => expenseType.monthlyData[month] || 0),
          expenseType.yearTotal
        ])
      })
    })
    
    // Totals row
    csvData.push([
      'TOTAL',
      ...months.map(month => monthlyTotals[month] || 0),
      grandTotal
    ])
    
    // Create CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n')
    
    // Download
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-breakdown-${selectedYear}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    onExportCSV?.()
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Expense Breakdown - {selectedYear}
          </h3>
          <p className="text-sm text-gray-500">
            Monthly breakdown by category and expense type
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-48">
                  Category / Type
                </th>
                {months.map(month => (
                  <th key={month} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    {month}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Total
                </th>
              </tr>
            </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map(category => {
              const isExpanded = expandedCategories.has(category.id)
              const hasExpenseTypes = category.expenseTypes.length > 0
              
              return (
                <>
                  {/* Category Row */}
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td 
                      className={`px-6 py-4 sticky left-0 bg-white z-10 ${hasExpenseTypes ? 'cursor-pointer' : ''}`}
                      onClick={hasExpenseTypes ? () => toggleCategory(category.id) : undefined}
                    >
                      <div className="flex items-center space-x-2">
                        {hasExpenseTypes && (
                          <div className="text-gray-400">
                            {isExpanded ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </div>
                        )}
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    {months.map(month => (
                      <td key={month} className="px-3 py-4 text-center text-sm text-gray-900">
                        ${(category.monthlyData[month] || 0).toFixed(0)}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center font-semibold text-gray-900">
                      ${category.yearTotal.toFixed(2)}
                    </td>
                  </tr>

                  {/* Expense Type Rows */}
                  {isExpanded && category.expenseTypes.map(expenseType => (
                    <tr key={expenseType.id} className="bg-gray-50 hover:bg-gray-100">
                      <td className="px-4 py-3 sticky left-0 bg-gray-50 z-10">
                        <div className="flex items-center space-x-2 ml-6">
                          <span className="text-sm text-gray-700">{expenseType.name}</span>
                        </div>
                      </td>
                      {months.map(month => (
                        <td key={month} className="px-2 py-3 text-center text-sm text-gray-700">
                          {expenseType.monthlyData[month] ? `$${expenseType.monthlyData[month].toFixed(0)}` : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                        ${expenseType.yearTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </>
              )
            })}
            
            {/* Totals Row */}
            <tr className="bg-blue-50 font-semibold">
              <td className="px-4 py-4 sticky left-0 bg-blue-50 z-10">
                <span className="text-blue-900 font-bold">TOTAL</span>
              </td>
              {months.map(month => (
                <td key={month} className="px-2 py-4 text-center text-blue-900">
                  ${(monthlyTotals[month] || 0).toFixed(0)}
                </td>
              ))}
              <td className="px-4 py-4 text-center text-blue-900 font-bold">
                ${grandTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="xl:hidden">
        <div className="p-4 space-y-4">
          {data.map(category => {
            const isExpanded = expandedCategories.has(category.id)
            const hasExpenseTypes = category.expenseTypes.length > 0
            
            return (
              <div key={category.id} className="border border-gray-200 rounded-lg">
                {/* Category Header */}
                <div 
                  className={`p-4 ${hasExpenseTypes ? 'cursor-pointer' : ''}`}
                  onClick={hasExpenseTypes ? () => toggleCategory(category.id) : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {hasExpenseTypes && (
                        <div className="text-gray-400">
                          {isExpanded ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-gray-900">{category.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${category.yearTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Monthly breakdown */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {months.map(month => (
                          <div key={month} className="text-center">
                            <div className="text-xs text-gray-500">{month}</div>
                            <div className="text-sm font-medium">
                              ${(category.monthlyData[month] || 0).toFixed(0)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Expense Types */}
                      {category.expenseTypes.length > 0 && (
                        <div className="space-y-2">
                          {category.expenseTypes.map(expenseType => (
                            <div key={expenseType.id} className="bg-gray-50 p-3 rounded">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">{expenseType.name}</span>
                                <span className="text-sm font-semibold">${expenseType.yearTotal.toFixed(2)}</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                {months.map(month => (
                                  <div key={month} className="text-center">
                                    <div className="text-xs text-gray-500">{month.slice(0, 1)}</div>
                                    <div className="text-xs">
                                      {expenseType.monthlyData[month] ? `$${expenseType.monthlyData[month].toFixed(0)}` : '-'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Mobile Total */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-blue-900">TOTAL</span>
              <span className="font-bold text-blue-900">${grandTotal.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {months.map(month => (
                <div key={month} className="text-center">
                  <div className="text-xs text-blue-700">{month}</div>
                  <div className="text-sm font-medium text-blue-900">
                    ${(monthlyTotals[month] || 0).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}