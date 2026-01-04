import { forwardRef } from 'react'
import type { SelectHTMLAttributes, ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'

interface FloatingLabelSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: FieldError
  accentColor?: 'blue' | 'green' | 'purple' | 'orange'
  helpText?: string
  children: ReactNode
}

const accentColorClasses = {
  blue: {
    ring: 'focus:ring-blue-500/20',
    border: 'focus:border-blue-500',
    label: 'peer-focus:text-blue-600'
  },
  green: {
    ring: 'focus:ring-green-500/20',
    border: 'focus:border-green-500',
    label: 'peer-focus:text-green-600'
  },
  purple: {
    ring: 'focus:ring-purple-500/20',
    border: 'focus:border-purple-500',
    label: 'peer-focus:text-purple-600'
  },
  orange: {
    ring: 'focus:ring-orange-500/20',
    border: 'focus:border-orange-500',
    label: 'peer-focus:text-orange-600'
  }
}

const FloatingLabelSelect = forwardRef<HTMLSelectElement, FloatingLabelSelectProps>(
  ({ label, error, accentColor = 'blue', helpText, className = '', children, ...props }, ref) => {
    const colors = accentColorClasses[accentColor]

    return (
      <div className="relative">
        <select
          ref={ref}
          className={`peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${colors.ring} ${colors.border} transition-all min-h-[52px] appearance-none bg-white ${className}`}
          {...props}
        >
          {children}
        </select>
        <label className={`absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 ${colors.label} transition-colors pointer-events-none`}>
          {label}
        </label>
        {/* Dropdown arrow */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error.message}</p>
        )}
        {helpText && !error && (
          <p className="mt-1.5 text-xs text-gray-500">{helpText}</p>
        )}
      </div>
    )
  }
)

FloatingLabelSelect.displayName = 'FloatingLabelSelect'

export default FloatingLabelSelect
