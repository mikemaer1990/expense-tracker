import { useState, useMemo } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { iconCategories, searchIcons, type IconInfo } from '../../lib/heroicons'
import IconRenderer from './IconRenderer'

interface HeroIconPickerProps {
  selectedIcon?: string
  onIconSelect: (iconName: string) => void
  usedIcons?: string[] // Icons already used by this user
  className?: string
}

export default function HeroIconPicker({
  selectedIcon,
  onIconSelect,
  usedIcons = [],
  className = ''
}: HeroIconPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  
  // Filter icons based on search and category
  const filteredIcons = useMemo(() => {
    let icons: IconInfo[] = []
    
    if (searchQuery.trim()) {
      // If searching, search all icons
      icons = searchIcons(searchQuery)
    } else if (selectedCategory === 'All') {
      // Show all icons when no search and "All" category selected
      icons = Object.values(iconCategories).flat().map(icon => ({
        ...icon,
        category: Object.entries(iconCategories).find(([_, categoryIcons]) => 
          categoryIcons.includes(icon)
        )?.[0] || 'General'
      }))
    } else {
      // Show specific category
      const categoryIcons = iconCategories[selectedCategory as keyof typeof iconCategories] || []
      icons = categoryIcons.map(icon => ({
        ...icon,
        category: selectedCategory
      }))
    }
    
    return icons
  }, [searchQuery, selectedCategory])
  
  // Get categories for the tab navigation
  const categories = ['All', ...Object.keys(iconCategories)]
  
  const handleIconClick = (iconName: string) => {
    onIconSelect(iconName)
  }
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header with search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search icons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Category tabs */}
        {!searchQuery && (
          <div className="mt-3 flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Icon grid */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {filteredIcons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p>No icons found</p>
            {searchQuery && (
              <p className="text-sm">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {filteredIcons.map((icon) => {
              const isSelected = selectedIcon === icon.name
              const isUsed = usedIcons.includes(icon.name) && !isSelected
              
              return (
                <button
                  key={icon.name}
                  onClick={() => handleIconClick(icon.name)}
                  disabled={isUsed}
                  className={`
                    relative p-3 rounded-md transition-all duration-200 group
                    ${isSelected 
                      ? 'bg-blue-100 border-2 border-blue-500 shadow-md cursor-pointer' 
                      : isUsed 
                      ? 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm cursor-pointer'
                    }
                  `}
                  title={`${icon.description}${isUsed ? ' (already used)' : ''}`}
                >
                  <IconRenderer
                    iconName={icon.name}
                    size="lg"
                    className={`mx-auto ${
                      isSelected 
                        ? 'text-blue-600' 
                        : isUsed 
                        ? 'text-gray-400'
                        : 'text-gray-600 group-hover:text-gray-800'
                    }`}
                  />
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                  
                  {/* Used indicator */}
                  {isUsed && (
                    <div className="absolute -top-1 -right-1 bg-gray-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      ×
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Footer with icon info */}
      {selectedIcon && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <IconRenderer
              iconName={selectedIcon}
              size="md"
              className="text-blue-600"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {filteredIcons.find(icon => icon.name === selectedIcon)?.description || selectedIcon}
              </p>
              <p className="text-xs text-gray-500">
                {filteredIcons.find(icon => icon.name === selectedIcon)?.category}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simplified version for inline use
interface InlineIconPickerProps {
  selectedIcon?: string
  onIconSelect: (iconName: string) => void
  usedIcons?: string[]
  maxIcons?: number
}

export function InlineIconPicker({
  selectedIcon,
  onIconSelect,
  usedIcons = [],
  maxIcons = 12
}: InlineIconPickerProps) {
  // Show popular/commonly used icons for quick selection
  const popularIcons = [
    'HomeIcon', 'ShoppingCartIcon', 'TruckIcon', 'BoltIcon',
    'DevicePhoneMobileIcon', 'FilmIcon', 'HeartIcon', 'CakeIcon',
    'CreditCardIcon', 'WrenchScrewdriverIcon', 'GiftIcon', 'StarIcon'
  ]
  
  const availableIcons = popularIcons.slice(0, maxIcons)
  
  return (
    <div className="grid grid-cols-6 gap-2">
      {availableIcons.map((iconName) => {
        const isSelected = selectedIcon === iconName
        const isUsed = usedIcons.includes(iconName) && !isSelected
        
        return (
          <button
            key={iconName}
            onClick={() => onIconSelect(iconName)}
            disabled={isUsed}
            className={`
              p-2 rounded-md border transition-all
              ${isSelected 
                ? 'bg-blue-100 border-blue-500 cursor-pointer' 
                : isUsed 
                ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer'
              }
            `}
          >
            <IconRenderer
              iconName={iconName}
              size="md"
              className={`mx-auto ${
                isSelected ? 'text-blue-600' : isUsed ? 'text-gray-400' : 'text-gray-600'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}