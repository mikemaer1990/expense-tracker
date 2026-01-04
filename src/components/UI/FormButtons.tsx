interface FormButtonsProps {
  onCancel: () => void
  submitLabel: string
  isLoading?: boolean
  loadingLabel?: string
  accentColor?: 'blue' | 'green' | 'purple' | 'orange'
}

const accentColorClasses = {
  blue: {
    gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    shadow: 'shadow-lg shadow-blue-500/30',
    hoverShadow: 'hover:shadow-xl hover:shadow-blue-500/40',
    hoverGradient: 'hover:from-blue-700 hover:to-indigo-700'
  },
  green: {
    gradient: 'bg-gradient-to-r from-green-600 to-emerald-600',
    shadow: 'shadow-lg shadow-green-500/30',
    hoverShadow: 'hover:shadow-xl hover:shadow-green-500/40',
    hoverGradient: 'hover:from-green-700 hover:to-emerald-700'
  },
  purple: {
    gradient: 'bg-gradient-to-r from-purple-600 to-pink-600',
    shadow: 'shadow-lg shadow-purple-500/30',
    hoverShadow: 'hover:shadow-xl hover:shadow-purple-500/40',
    hoverGradient: 'hover:from-purple-700 hover:to-pink-700'
  },
  orange: {
    gradient: 'bg-gradient-to-r from-orange-600 to-amber-600',
    shadow: 'shadow-lg shadow-orange-500/30',
    hoverShadow: 'hover:shadow-xl hover:shadow-orange-500/40',
    hoverGradient: 'hover:from-orange-700 hover:to-amber-700'
  }
}

export default function FormButtons({
  onCancel,
  submitLabel,
  isLoading = false,
  loadingLabel = 'Loading...',
  accentColor = 'blue'
}: FormButtonsProps) {
  const colors = accentColorClasses[accentColor]

  return (
    <div className="flex gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] min-h-[52px] font-semibold cursor-pointer transition-all duration-200"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isLoading}
        className={`flex-1 px-6 py-3.5 ${colors.gradient} text-white rounded-lg ${colors.shadow} ${colors.hoverShadow} ${colors.hoverGradient} active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none min-h-[52px] font-semibold cursor-pointer transition-all duration-200`}
      >
        {isLoading ? loadingLabel : submitLabel}
      </button>
    </div>
  )
}
