import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'

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
  onCategoryClick?: (categoryId: string) => void
}

export default function PieChart({ categories, onCategoryClick }: PieChartProps) {
  // Prepare data for Chart.js
  const data = {
    labels: categories.map(cat => cat.name),
    datasets: [
      {
        data: categories.map(cat => cat.totalAmount),
        backgroundColor: categories.map(cat => cat.color),
        borderColor: categories.map(cat => cat.color),
        borderWidth: 2,
        hoverBackgroundColor: categories.map(cat => {
          // Lighten the color on hover
          const hex = cat.color.replace('#', '')
          const r = parseInt(hex.substr(0, 2), 16)
          const g = parseInt(hex.substr(2, 2), 16)  
          const b = parseInt(hex.substr(4, 2), 16)
          return `rgba(${r}, ${g}, ${b}, 0.8)`
        }),
        hoverBorderWidth: 3,
      }
    ]
  }

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: "'Inter', 'system-ui', 'sans-serif'"
          },
          generateLabels: (chart) => {
            const data = chart.data
            if (data.labels?.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0]
                const category = categories[i]
                const bgColor = Array.isArray(dataset.backgroundColor)
                  ? dataset.backgroundColor[i]
                  : dataset.backgroundColor
                const borderCol = Array.isArray(dataset.borderColor)
                  ? dataset.borderColor[i]
                  : dataset.borderColor

                return {
                  text: `${label} (${category.percentage.toFixed(1)}%)`,
                  fillStyle: bgColor as string,
                  strokeStyle: borderCol as string,
                  lineWidth: dataset.borderWidth as number,
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
              `${context.label}: $${value.toLocaleString()}`,
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

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            📊
          </div>
          <p className="text-gray-500 text-sm">No expense data available</p>
          <p className="text-gray-400 text-xs">Add some expenses to see the breakdown</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Spending by Category</h3>
        <div className="text-sm text-gray-500">
          {onCategoryClick && 'Click slice for details'}
        </div>
      </div>
      <div className="relative h-64">
        <Pie data={data} options={options} />
      </div>
    </div>
  )
}