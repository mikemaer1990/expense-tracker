import type { ReactNode } from 'react'

interface SelectionCardProps {
  isSelected: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  accentColor?: 'blue' | 'green' | 'purple' | 'orange' | 'emerald'
  minHeight?: string
}

const accentColorClasses = {
  blue: {
    selectedBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    selectedShadow: 'shadow-md shadow-blue-200/30',
    selectedGradient: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    selectedIconColor: 'text-blue-600',
    selectedTextColor: 'text-blue-900'
  },
  green: {
    selectedBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    selectedShadow: 'shadow-md shadow-green-200/30',
    selectedGradient: 'bg-gradient-to-br from-green-500 to-emerald-500',
    selectedIconColor: 'text-green-600',
    selectedTextColor: 'text-green-900'
  },
  emerald: {
    selectedBg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    selectedShadow: 'shadow-md shadow-emerald-200/30',
    selectedGradient: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    selectedIconColor: 'text-emerald-600',
    selectedTextColor: 'text-emerald-900'
  },
  purple: {
    selectedBg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    selectedShadow: 'shadow-md shadow-purple-200/30',
    selectedGradient: 'bg-gradient-to-br from-purple-500 to-pink-500',
    selectedIconColor: 'text-purple-600',
    selectedTextColor: 'text-purple-900'
  },
  orange: {
    selectedBg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    selectedShadow: 'shadow-md shadow-orange-200/30',
    selectedGradient: 'bg-gradient-to-br from-orange-500 to-amber-500',
    selectedIconColor: 'text-orange-600',
    selectedTextColor: 'text-orange-900'
  }
}

export default function SelectionCard({
  isSelected,
  onClick,
  icon,
  label,
  accentColor = 'blue',
  minHeight = '90px'
}: SelectionCardProps) {
  const colors = accentColorClasses[accentColor]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer min-h-[110px]
        hover:scale-[1.02] active:scale-[0.98]
        ${isSelected
          ? `border-transparent ${colors.selectedBg} ${colors.selectedShadow}`
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Gradient border effect for selected state */}
      {isSelected && (
        <div className={`absolute inset-0 rounded-xl ${colors.selectedGradient} -z-10 p-[2px]`}>
          <div className="h-full w-full bg-white rounded-xl"></div>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 w-full">
        <div className={`${isSelected ? colors.selectedIconColor : 'text-gray-600'} flex-shrink-0`}>
          {icon}
        </div>
        <span className={`text-xs md:text-[0.7rem] text-center font-medium leading-tight w-full px-1 break-words ${isSelected ? colors.selectedTextColor : 'text-gray-700'}`}>
          {label}
        </span>
      </div>
    </button>
  )
}
