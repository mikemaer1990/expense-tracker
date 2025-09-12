import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'pill' | 'toggle'
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  children: React.ReactNode
}

export const Button = ({ 
  variant = 'secondary', 
  size = 'md',
  active = false,
  className = '',
  children,
  ...props 
}: ButtonProps) => {
  const baseStyles = 'cursor-pointer transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md rounded-md',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm rounded-md',
    pill: `rounded-full ${active 
      ? 'bg-blue-600 text-white shadow-md' 
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
    }`,
    toggle: `rounded-md ${active 
      ? 'bg-white text-gray-900 shadow-sm' 
      : 'text-gray-600 hover:text-gray-900'
    }`
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm', 
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
}

export const ButtonGroup = ({ children, className = '' }: ButtonGroupProps) => (
  <div className={`inline-flex bg-gray-100 rounded-lg p-1 ${className}`}>
    {children}
  </div>
)

interface FilterPillProps extends Omit<ButtonProps, 'variant'> {
  count?: number
  children: React.ReactNode
}

export const FilterPill = ({ 
  count, 
  active = false, 
  className = '',
  children, 
  ...props 
}: FilterPillProps) => (
  <Button 
    variant="pill" 
    active={active}
    className={`flex items-center whitespace-nowrap ${className}`}
    {...props}
  >
    {children}
    {count !== undefined && (
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
        active
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-600'
      }`}>
        {count}
      </span>
    )}
  </Button>
)