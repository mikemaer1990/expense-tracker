import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { ChartOptions, Plugin } from 'chart.js'
import { formatCurrency } from '../../utils/currency'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CategoryData {
  id: string
  name: string
  color: string
  totalAmount: number
  percentage: number
}

interface PieChartProps {
  categories: CategoryData[]
  currency?: string
  onCategoryClick?: (categoryId: string) => void
}

export default function PieChart({ categories, currency = 'USD', onCategoryClick }: PieChartProps) {
  const total = categories.reduce((sum, cat) => sum + cat.totalAmount, 0)

  const centerTextPlugin: Plugin<'doughnut'> = {
    id: 'centerText',
    afterDraw(chart) {
      const { ctx, chartArea } = chart
      if (!chartArea) return
      const cx = chartArea.left + chartArea.width / 2
      const cy = chartArea.top + chartArea.height / 2
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = "bold 16px Inter, system-ui, sans-serif"
      ctx.fillStyle = '#111827'
      ctx.fillText(formatCurrency(total, currency, 0), cx, cy - 9)
      ctx.font = "11px Inter, system-ui, sans-serif"
      ctx.fillStyle = '#9CA3AF'
      ctx.fillText('total', cx, cy + 9)
      ctx.restore()
    }
  }

  const data = {
    labels: categories.map(cat => cat.name),
    datasets: [
      {
        data: categories.map(cat => cat.totalAmount),
        backgroundColor: categories.map(cat => cat.color),
        borderColor: 'white',
        borderWidth: 3,
        hoverOffset: 8,
        hoverBorderWidth: 3,
      }
    ]
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: {
            size: 12,
            family: "'Inter', 'system-ui', 'sans-serif'"
          },
          generateLabels: (chart) => {
            const chartData = chart.data
            if (chartData.labels?.length && chartData.datasets.length) {
              return chartData.labels.map((label, i) => {
                const dataset = chartData.datasets[0]
                const category = categories[i]
                const bgColor = Array.isArray(dataset.backgroundColor)
                  ? dataset.backgroundColor[i]
                  : dataset.backgroundColor
                return {
                  text: `${label} (${category.percentage.toFixed(1)}%)`,
                  fillStyle: bgColor as string,
                  strokeStyle: 'white',
                  lineWidth: 0,
                  hidden: false,
                  index: i
                }
              })
            }
            return []
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const category = categories[context.dataIndex]
            const value = context.parsed
            return [
              `${context.label}: ${formatCurrency(value, currency)}`,
              `${category.percentage.toFixed(1)}% of total spending`
            ]
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true
      }
    },
    onClick: (_event, elements) => {
      if (elements.length > 0 && onCategoryClick) {
        const elementIndex = elements[0].index
        const categoryId = categories[elementIndex].id
        onCategoryClick(categoryId)
      }
    },
    onHover: (event, elements) => {
      const target = event.native?.target as HTMLElement
      if (target) {
        target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
      }
    }
  }

  if (categories.length === 0 || total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
        <div className="p-6 flex items-center justify-center h-72">
          <div className="text-center">
            <p className="text-gray-500 text-sm">No expense data available</p>
            <p className="text-gray-400 text-xs mt-1">Add some expenses to see the breakdown</p>
          </div>
        </div>
      </div>
    )
  }

  const topColor = categories.sort((a, b) => b.totalAmount - a.totalAmount)[0]?.color || '#E5E7EB'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-1" style={{ background: `linear-gradient(to right, ${topColor}, ${topColor}88)` }} />
      <div className="p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Spending by Category</h3>
        <div className="relative h-64">
          <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
        </div>
      </div>
    </div>
  )
}
