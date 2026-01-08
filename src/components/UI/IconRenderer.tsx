import { getIconComponent } from '../../lib/heroicons'

interface IconRendererProps {
  iconName: string
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: string
}

// Size mappings for consistent icon sizing
const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4', 
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
}

// Color mappings for common colors
const colorClasses = {
  gray: 'text-gray-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
  purple: 'text-purple-600',
  indigo: 'text-indigo-600',
  pink: 'text-pink-600'
}

/**
 * IconRenderer - Dynamically renders HeroIcons by name
 * 
 * @param iconName - The HeroIcon component name (e.g., 'HomeIcon', 'ShoppingCartIcon')
 * @param className - Additional CSS classes
 * @param size - Predefined size (xs, sm, md, lg, xl) 
 * @param color - Color name or custom color class
 */
export default function IconRenderer({
  iconName,
  className = '',
  size = 'md',
  color
}: IconRendererProps) {
  const IconComponent = getIconComponent(iconName)

  // Build the complete className
  const sizeClass = sizeClasses[size]
  const colorClass = color && color in colorClasses
    ? colorClasses[color as keyof typeof colorClasses]
    : color || ''

  const finalClassName = `${sizeClass} ${colorClass} ${className}`.trim()

  return (
    <IconComponent
      className={finalClassName}
      aria-hidden="true"
    />
  )
}

// Convenience component for expense type icons specifically
interface ExpenseTypeIconProps {
  iconName: string
  className?: string
  categoryColor?: string
}

export function ExpenseTypeIcon({ 
  iconName, 
  className = '',
  categoryColor = 'text-gray-600'
}: ExpenseTypeIconProps) {
  return (
    <IconRenderer 
      iconName={iconName}
      size="md"
      className={`${categoryColor} ${className}`}
    />
  )
}

// Convenience component for icon with text label
interface IconWithLabelProps {
  iconName: string
  label: string
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  iconColor?: string
  className?: string
  labelClassName?: string
}

export function IconWithLabel({
  iconName,
  label,
  iconSize = 'sm',
  iconColor = 'text-gray-600',
  className = '',
  labelClassName = 'text-sm text-gray-900'
}: IconWithLabelProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <IconRenderer 
        iconName={iconName}
        size={iconSize}
        color={iconColor}
      />
      <span className={labelClassName}>
        {label}
      </span>
    </div>
  )
}