import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import { format, parseISO } from 'date-fns'
import { getCurrencySymbol, formatCurrency } from '../../utils/currency'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface MonthlyData {
  month: string
  expenses: number
  income?: number
  expenseCount: number
  incomeCount?: number
}

interface BarChartProps {
  data: MonthlyData[]
  title?: string
  showIncome?: boolean
  currency?: string
  onBarClick?: (monthData: MonthlyData) => void
}

export default function BarChart({ 
  data, 
  title = "Monthly Spending Comparison", 
  showIncome = false,
  currency = 'USD',
  onBarClick 
}: BarChartProps) {
  const currencySymbol = getCurrencySymbol(currency)
  const chartData = {
    labels: data.map(item => {
      const date = parseISO(item.month + '-01') // Add day to make valid date
      return format(date, 'MMM yyyy')
    }),
    datasets: [
      {
        label: 'Expenses',
        data: data.map(item => item.expenses),
        backgroundColor: 'rgba(234, 88, 12, 0.8)', // orange-600
        borderColor: 'rgb(234, 88, 12)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
      ...(showIncome ? [{
        label: 'Income',
        data: data.map(item => item.income || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // green-500
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      }] : [])
    ]
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: "'Inter', 'system-ui', 'sans-serif'"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          title: function(context) {
            const dataIndex = context[0].dataIndex
            const item = data[dataIndex]
            const date = parseISO(item.month + '-01')
            return format(date, 'MMMM yyyy')
          },
          label: function(context) {
            const dataIndex = context.dataIndex
            const item = data[dataIndex]
            const value = context.parsed.y
            
            if (context.dataset.label === 'Expenses') {
              return [
                `Expenses: ${currencySymbol}${value.toLocaleString()}`,
                `Transactions: ${item.expenseCount}`
              ]
            } else if (context.dataset.label === 'Income') {
              return [
                `Income: ${currencySymbol}${value.toLocaleString()}`,
                `Sources: ${item.incomeCount || 0}`
              ]
            }
            return `${context.dataset.label}: ${currencySymbol}${value.toLocaleString()}`
          },
          afterBody: function(context) {
            const dataIndex = context[0].dataIndex
            const item = data[dataIndex]
            
            if (showIncome && item.income !== undefined) {
              const netIncome = item.income - item.expenses
              const isPositive = netIncome >= 0
              return [
                '',
                `Net ${isPositive ? 'Savings' : 'Deficit'}: ${isPositive ? '+' : ''}${currencySymbol}${netIncome.toLocaleString()}`
              ]
            }
            return []
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false
        },
        ticks: {
          color: 'rgb(107, 114, 128)', // gray-500
          font: {
            size: 12,
            family: "'Inter', 'system-ui', 'sans-serif'"
          }
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
            family: "'Inter', 'system-ui', 'sans-serif'"
          },
          callback: function(value) {
            return currencySymbol + Number(value).toLocaleString()
          }
        }
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onBarClick) {
        const elementIndex = elements[0].index
        onBarClick(data[elementIndex])
      }
    },
    onHover: (event, elements) => {
      const target = event.native?.target as HTMLElement
      if (target) {
        target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
      }
    }
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            📊
          </div>
          <p className="text-gray-500 text-sm">No monthly data available</p>
          <p className="text-gray-400 text-xs">Add some expenses to see monthly comparisons</p>
        </div>
      </div>
    )
  }

  // Calculate insights
  const currentMonth = data[data.length - 1]
  const previousMonth = data[data.length - 2]
  let monthlyChange = 0
  let isIncreasing = false

  if (previousMonth && currentMonth && previousMonth.expenses > 0) {
    monthlyChange = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
    isIncreasing = monthlyChange > 0
  }

  // Only calculate from months with actual expenses
  const activeMonths = data.filter(item => item.expenses > 0)
  const averageSpending = activeMonths.length > 0 
    ? activeMonths.reduce((sum, item) => sum + item.expenses, 0) / activeMonths.length 
    : 0
  const highestMonth = data.reduce((max, item) => item.expenses > max.expenses ? item : max, data[0])
  const lowestMonth = activeMonths.length > 0 
    ? activeMonths.reduce((min, item) => item.expenses < min.expenses ? item : min, activeMonths[0])
    : data[0]

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {data.length > 1 && (
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              {previousMonth && previousMonth.expenses > 0 && currentMonth && (
                <span className={`flex items-center ${isIncreasing ? 'text-orange-600' : 'text-green-600'}`}>
                  {isIncreasing ? '↗' : '↘'} {Math.abs(monthlyChange).toFixed(1)}% vs last month
                </span>
              )}
              {previousMonth && previousMonth.expenses === 0 && currentMonth && currentMonth.expenses > 0 && (
                <span className="flex items-center text-blue-600">
                  ↗ New spending this month
                </span>
              )}
              {previousMonth && currentMonth && previousMonth.expenses > 0 && currentMonth.expenses === 0 && (
                <span className="flex items-center text-green-600">
                  ↘ No spending this month
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {onBarClick && 'Click bar for details'}
        </div>
      </div>

      <div className="relative h-64 mb-4">
        <Bar data={chartData} options={options} />
      </div>

      {/* Insights Summary */}
      {data.length > 0 && (
        activeMonths.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Average</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(averageSpending, currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Highest</p>
              <p className="text-lg font-semibold text-orange-600">{formatCurrency(highestMonth.expenses, currency)}</p>
              <p className="text-xs text-gray-400">{format(parseISO(highestMonth.month + '-01'), 'MMM yyyy')}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Lowest</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(lowestMonth.expenses, currency)}</p>
              <p className="text-xs text-gray-400">{format(parseISO(lowestMonth.month + '-01'), 'MMM yyyy')}</p>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-gray-100 text-center text-gray-500">
            <p className="text-sm">No spending data yet</p>
          </div>
        )
      )}
    </div>
  )
}