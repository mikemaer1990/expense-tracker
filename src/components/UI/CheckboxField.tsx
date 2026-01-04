import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  accentColor?: 'blue' | 'green' | 'purple' | 'orange'
}

const accentColorClasses = {
  blue: {
    text: 'text-blue-600',
    ring: 'focus:ring-blue-500/20'
  },
  green: {
    text: 'text-green-600',
    ring: 'focus:ring-green-500/20'
  },
  purple: {
    text: 'text-purple-600',
    ring: 'focus:ring-purple-500/20'
  },
  orange: {
    text: 'text-orange-600',
    ring: 'focus:ring-orange-500/20'
  }
}

const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, accentColor = 'blue', className = '', ...props }, ref) => {
    const colors = accentColorClasses[accentColor]

    return (
      <div>
        <label className="flex items-center cursor-pointer group">
          <input
            ref={ref}
            type="checkbox"
            className={`h-5 w-5 ${colors.text} focus:ring-2 ${colors.ring} focus:ring-offset-0 border-2 border-gray-300 rounded-md transition-all cursor-pointer ${className}`}
            {...props}
          />
          <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
        </label>
      </div>
    )
  }
)

CheckboxField.displayName = 'CheckboxField'

export default CheckboxField
