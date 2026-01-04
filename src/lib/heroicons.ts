// HeroIcons mapping system for expense types
// Provides categorized icons and dynamic rendering functionality

import {
  // Housing & Real Estate
  HomeIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  KeyIcon,
  ShieldCheckIcon,
  
  // Transportation
  TruckIcon,
  MapPinIcon,
  GlobeAltIcon,
  PaperAirplaneIcon,
  
  // Shopping & Commerce
  ShoppingCartIcon,
  ShoppingBagIcon,
  GiftIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  
  // Technology & Communication
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  WifiIcon,
  TvIcon,
  RectangleStackIcon,
  
  // Utilities & Services
  BoltIcon,
  FireIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
  ClockIcon,
  CalendarIcon,
  
  // Health & Wellness
  HeartIcon,
  UserIcon,
  BeakerIcon,
  EyeIcon,
  AcademicCapIcon,
  
  // Food & Dining
  CakeIcon,
  StarIcon as CoffeeIcon, // Using Star for beverages/coffee
  BuildingLibraryIcon, // Using as generic food icon
  
  // Entertainment & Lifestyle
  FilmIcon,
  MusicalNoteIcon,
  PuzzlePieceIcon,
  SparklesIcon,
  BookOpenIcon,
  
  // Finance & Business
  CurrencyDollarIcon,
  BanknotesIcon,
  ChartBarIcon,
  CalculatorIcon,
  DocumentTextIcon,
  
  // General Purpose
  StarIcon,
  TagIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

// Type for icon components
export type HeroIcon = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
    title?: string
    titleId?: string
  } & React.RefAttributes<SVGSVGElement>
>

// Interface for icon metadata
export interface IconInfo {
  name: string
  component: HeroIcon
  category: string
  keywords: string[]
  description: string
}

// Complete mapping of available icons organized by category
export const iconCategories = {
  'Housing & Real Estate': [
    { 
      name: 'HomeIcon', 
      component: HomeIcon, 
      keywords: ['home', 'house', 'rent', 'mortgage', 'dwelling'],
      description: 'Home, rent, mortgage'
    },
    { 
      name: 'BuildingOfficeIcon', 
      component: BuildingOfficeIcon, 
      keywords: ['office', 'building', 'commercial', 'workspace'],
      description: 'Office, commercial building'
    },
    { 
      name: 'BuildingStorefrontIcon', 
      component: BuildingStorefrontIcon, 
      keywords: ['store', 'shop', 'retail', 'business'],
      description: 'Store, retail, business'
    },
    { 
      name: 'KeyIcon', 
      component: KeyIcon, 
      keywords: ['key', 'security', 'lock', 'access'],
      description: 'Security, locks, keys'
    },
    { 
      name: 'ShieldCheckIcon', 
      component: ShieldCheckIcon, 
      keywords: ['insurance', 'protection', 'security', 'safety'],
      description: 'Insurance, protection'
    }
  ],

  'Transportation': [
    { 
      name: 'TruckIcon', 
      component: TruckIcon, 
      keywords: ['truck', 'vehicle', 'gas', 'fuel', 'transportation', 'car', 'auto', 'driving'],
      description: 'Vehicles, gas, auto expenses'
    },
    { 
      name: 'MapPinIcon', 
      component: MapPinIcon, 
      keywords: ['location', 'travel', 'uber', 'taxi', 'transport'],
      description: 'Transportation, rideshare'
    },
    { 
      name: 'PaperAirplaneIcon', 
      component: PaperAirplaneIcon, 
      keywords: ['travel', 'flight', 'vacation', 'trip'],
      description: 'Travel, flights, vacation'
    },
    { 
      name: 'GlobeAltIcon', 
      component: GlobeAltIcon, 
      keywords: ['travel', 'international', 'world', 'global'],
      description: 'International travel'
    }
  ],

  'Shopping & Commerce': [
    { 
      name: 'ShoppingCartIcon', 
      component: ShoppingCartIcon, 
      keywords: ['groceries', 'shopping', 'food', 'supermarket'],
      description: 'Groceries, shopping'
    },
    { 
      name: 'ShoppingBagIcon', 
      component: ShoppingBagIcon, 
      keywords: ['shopping', 'retail', 'clothes', 'purchases'],
      description: 'Shopping, retail purchases'
    },
    { 
      name: 'GiftIcon', 
      component: GiftIcon, 
      keywords: ['gift', 'present', 'celebration', 'surprise'],
      description: 'Gifts, presents'
    },
    { 
      name: 'CreditCardIcon', 
      component: CreditCardIcon, 
      keywords: ['payment', 'card', 'finance', 'banking'],
      description: 'Credit card, payments'
    },
    { 
      name: 'ReceiptPercentIcon', 
      component: ReceiptPercentIcon, 
      keywords: ['receipt', 'discount', 'sale', 'deal'],
      description: 'Receipts, discounts'
    }
  ],

  'Technology & Communication': [
    { 
      name: 'DevicePhoneMobileIcon', 
      component: DevicePhoneMobileIcon, 
      keywords: ['phone', 'mobile', 'cell', 'communication'],
      description: 'Phone, mobile service'
    },
    { 
      name: 'ComputerDesktopIcon', 
      component: ComputerDesktopIcon, 
      keywords: ['computer', 'tech', 'hardware', 'software'],
      description: 'Computer, technology'
    },
    { 
      name: 'WifiIcon', 
      component: WifiIcon, 
      keywords: ['internet', 'wifi', 'connection', 'network'],
      description: 'Internet, WiFi'
    },
    { 
      name: 'TvIcon', 
      component: TvIcon, 
      keywords: ['tv', 'television', 'entertainment', 'streaming'],
      description: 'TV, streaming services'
    },
    { 
      name: 'RectangleStackIcon', 
      component: RectangleStackIcon, 
      keywords: ['subscription', 'service', 'stack', 'multiple'],
      description: 'Subscriptions, services'
    }
  ],

  'Utilities & Services': [
    {
      name: 'BoltIcon',
      component: BoltIcon,
      keywords: ['electricity', 'power', 'utilities', 'energy'],
      description: 'Electricity, power utilities'
    },
    {
      name: 'FireIcon',
      component: FireIcon,
      keywords: ['gas', 'heating', 'fire', 'utilities'],
      description: 'Gas, heating utilities'
    },
    {
      name: 'WrenchScrewdriverIcon',
      component: WrenchScrewdriverIcon,
      keywords: ['maintenance', 'repair', 'tools', 'fix'],
      description: 'Maintenance, repairs'
    },
    {
      name: 'Cog6ToothIcon',
      component: Cog6ToothIcon,
      keywords: ['service', 'maintenance', 'settings', 'mechanical'],
      description: 'Services, maintenance'
    },
    {
      name: 'ClockIcon',
      component: ClockIcon,
      keywords: ['time', 'schedule', 'appointment', 'hourly'],
      description: 'Time-based services'
    },
    {
      name: 'CalendarIcon',
      component: CalendarIcon,
      keywords: ['calendar', 'recurring', 'subscription', 'scheduled', 'monthly'],
      description: 'Recurring subscriptions'
    }
  ],

  'Health & Wellness': [
    { 
      name: 'HeartIcon', 
      component: HeartIcon, 
      keywords: ['health', 'medical', 'wellness', 'fitness'],
      description: 'Health, wellness, fitness'
    },
    { 
      name: 'UserIcon', 
      component: UserIcon, 
      keywords: ['personal', 'self', 'individual', 'care'],
      description: 'Personal care, self'
    },
    { 
      name: 'BeakerIcon', 
      component: BeakerIcon, 
      keywords: ['medical', 'pharmacy', 'medicine', 'science'],
      description: 'Medical, pharmacy'
    },
    { 
      name: 'EyeIcon', 
      component: EyeIcon, 
      keywords: ['vision', 'eye', 'optical', 'glasses'],
      description: 'Vision, optical care'
    },
    { 
      name: 'AcademicCapIcon', 
      component: AcademicCapIcon, 
      keywords: ['education', 'learning', 'school', 'course'],
      description: 'Education, learning'
    }
  ],

  'Food & Dining': [
    { 
      name: 'CakeIcon', 
      component: CakeIcon, 
      keywords: ['food', 'dining', 'restaurant', 'meal'],
      description: 'Food, dining, restaurants'
    },
    { 
      name: 'CoffeeIcon', 
      component: CoffeeIcon, 
      keywords: ['coffee', 'drink', 'beverage', 'cafe'],
      description: 'Coffee, beverages'
    },
    { 
      name: 'BuildingLibraryIcon', 
      component: BuildingLibraryIcon, 
      keywords: ['dining', 'establishment', 'venue', 'place'],
      description: 'Dining establishments'
    }
  ],

  'Entertainment & Lifestyle': [
    { 
      name: 'FilmIcon', 
      component: FilmIcon, 
      keywords: ['movie', 'film', 'entertainment', 'cinema'],
      description: 'Movies, entertainment'
    },
    { 
      name: 'MusicalNoteIcon', 
      component: MusicalNoteIcon, 
      keywords: ['music', 'audio', 'concert', 'sound'],
      description: 'Music, concerts'
    },
    { 
      name: 'PuzzlePieceIcon', 
      component: PuzzlePieceIcon, 
      keywords: ['hobby', 'game', 'puzzle', 'leisure'],
      description: 'Hobbies, games'
    },
    { 
      name: 'SparklesIcon', 
      component: SparklesIcon, 
      keywords: ['special', 'luxury', 'treat', 'sparkle'],
      description: 'Special treats, luxury'
    },
    { 
      name: 'BookOpenIcon', 
      component: BookOpenIcon, 
      keywords: ['book', 'reading', 'literature', 'knowledge'],
      description: 'Books, reading'
    }
  ],

  'Finance & Business': [
    { 
      name: 'CurrencyDollarIcon', 
      component: CurrencyDollarIcon, 
      keywords: ['money', 'dollar', 'finance', 'currency'],
      description: 'General finance, money'
    },
    { 
      name: 'BanknotesIcon', 
      component: BanknotesIcon, 
      keywords: ['cash', 'money', 'bills', 'payment'],
      description: 'Cash, bills'
    },
    { 
      name: 'ChartBarIcon', 
      component: ChartBarIcon, 
      keywords: ['investment', 'growth', 'chart', 'finance'],
      description: 'Investments, financial growth'
    },
    { 
      name: 'CalculatorIcon', 
      component: CalculatorIcon, 
      keywords: ['calculation', 'accounting', 'math', 'numbers'],
      description: 'Accounting, calculations'
    },
    { 
      name: 'DocumentTextIcon', 
      component: DocumentTextIcon, 
      keywords: ['document', 'paperwork', 'forms', 'legal'],
      description: 'Documents, paperwork'
    }
  ],

  'General Purpose': [
    { 
      name: 'StarIcon', 
      component: StarIcon, 
      keywords: ['favorite', 'special', 'important', 'star'],
      description: 'Special, important items'
    },
    { 
      name: 'TagIcon', 
      component: TagIcon, 
      keywords: ['label', 'tag', 'category', 'organize'],
      description: 'Labels, categories'
    },
    { 
      name: 'FolderIcon', 
      component: FolderIcon, 
      keywords: ['folder', 'organize', 'group', 'collection'],
      description: 'Organization, grouping'
    },
    { 
      name: 'ExclamationTriangleIcon', 
      component: ExclamationTriangleIcon, 
      keywords: ['warning', 'important', 'alert', 'caution'],
      description: 'Important, urgent'
    },
    { 
      name: 'QuestionMarkCircleIcon', 
      component: QuestionMarkCircleIcon, 
      keywords: ['unknown', 'question', 'help', 'uncertain'],
      description: 'Unknown, miscellaneous'
    }
  ]
}

// Flattened list of all icons for easy searching
export const allIcons: IconInfo[] = Object.entries(iconCategories).flatMap(([category, icons]) =>
  icons.map(icon => ({
    ...icon,
    category
  }))
)

// Map icon names to components for dynamic rendering
export const iconMap: Record<string, HeroIcon> = allIcons.reduce((map, icon) => {
  map[icon.name] = icon.component
  return map
}, {} as Record<string, HeroIcon>)

// Get icon component by name
export const getIconComponent = (iconName: string): HeroIcon => {
  return iconMap[iconName] || CurrencyDollarIcon // Fallback to default
}

// Search icons by keyword
export const searchIcons = (query: string): IconInfo[] => {
  if (!query.trim()) return allIcons
  
  const searchTerm = query.toLowerCase().trim()
  
  return allIcons.filter(icon => 
    icon.name.toLowerCase().includes(searchTerm) ||
    icon.description.toLowerCase().includes(searchTerm) ||
    icon.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
    icon.category.toLowerCase().includes(searchTerm)
  )
}

// Get suggested icons for an expense type name
export const getSuggestedIcons = (expenseTypeName: string): IconInfo[] => {
  if (!expenseTypeName.trim()) return []
  
  const suggestions = searchIcons(expenseTypeName)
  
  // Return top 5 most relevant suggestions
  return suggestions.slice(0, 5)
}

// Default icons for each category
export const defaultCategoryIcons = {
  'Fixed Expenses': 'HomeIcon',
  'Variable Expenses': 'ShoppingCartIcon', 
  'Optional Expenses': 'SparklesIcon'
}

// Get default icon for a category
export const getDefaultIconForCategory = (categoryName: string): string => {
  return defaultCategoryIcons[categoryName as keyof typeof defaultCategoryIcons] || 'CurrencyDollarIcon'
}