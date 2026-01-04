import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import type { FieldError } from 'react-hook-form'

interface FloatingLabelTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: FieldError
  accentColor?: 'blue' | 'green' | 'purple' | 'orange'
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

const FloatingLabelTextarea = forwardRef<HTMLTextAreaElement, FloatingLabelTextareaProps>(
  ({ label, error, accentColor = 'blue', className = '', ...props }, ref) => {
    const colors = accentColorClasses[accentColor]

    return (
      <div className="relative">
        <textarea
          ref={ref}
          placeholder=" "
          className={`peer block w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 ${colors.ring} ${colors.border} transition-all placeholder-transparent resize-none ${className}`}
          {...props}
        />
        <label className={`absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:font-medium ${colors.label} peer-focus:bg-white`}>
          {label}
        </label>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error.message}</p>
        )}
      </div>
    )
  }
)

FloatingLabelTextarea.displayName = 'FloatingLabelTextarea'

export default FloatingLabelTextarea
