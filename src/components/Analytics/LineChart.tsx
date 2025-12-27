import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import { format, parseISO } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface TrendData {
  date: string
  amount: number
  expenseCount: number
}

interface LineChartProps {
  data: TrendData[]
  title?: string
  timeframe: 'week' | 'month' | 'year'
  currency?: string
}

export default function LineChart({ data, title = "Spending Trends", timeframe }: LineChartProps) {
  const chartData = {
    labels: data.map(item => {
      const date = parseISO(item.date)
      switch (timeframe) {
        case 'week':
          return format(date, 'EEE') // Mon, Tue, Wed
        case 'month':
          return format(date, 'MMM dd') // Jan 15, Feb 20
        case 'year':
          return format(date, 'MMM yyyy') // Jan 2024
        default:
          return format(date, 'MMM dd')
      }
    }),
    datasets: [
      {
        label: 'Daily Spending',
        data: data.map(item => item.amount),
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4, // Smooth curves
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)', // blue-600
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2,
      }
    ]
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false // We'll show our own title
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: function(context) {
            const dataIndex = context[0].dataIndex
            const item = data[dataIndex]
            const date = parseISO(item.date)
            return format(date, 'EEEE, MMMM do, yyyy')
          },
          label: function(context) {
            const dataIndex = context.dataIndex
            const item = data[dataIndex]
            return [
              `Amount: $${context.parsed.y.toLocaleString()}`,
              `Transactions: ${item.expenseCount}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.2)', // gray-400 with opacity
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
            return '$' + Number(value).toLocaleString()
          }
        }
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
            📈
          </div>
          <p className="text-gray-500 text-sm">No trend data available</p>
          <p className="text-gray-400 text-xs">Add some expenses to see spending trends</p>
        </div>
      </div>
    )
  }

  // Calculate trend indicator
  const firstAmount = data[0]?.amount || 0
  const lastAmount = data[data.length - 1]?.amount || 0
  const trendPercentage = firstAmount > 0 ? ((lastAmount - firstAmount) / firstAmount) * 100 : 0
  const isIncreasing = trendPercentage > 5
  const isDecreasing = trendPercentage < -5

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {data.length > 1 && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-500">Trend:</span>
              {isIncreasing ? (
                <span className="text-sm text-orange-600 flex items-center">
                  ↗ +{Math.abs(trendPercentage).toFixed(1)}%
                </span>
              ) : isDecreasing ? (
                <span className="text-sm text-green-600 flex items-center">
                  ↘ -{Math.abs(trendPercentage).toFixed(1)}%
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  → Stable
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {timeframe === 'week' ? 'Last 7 days' : 
           timeframe === 'month' ? 'Last 30 days' : 
           'Last 12 months'}
        </div>
      </div>
      <div className="relative h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}