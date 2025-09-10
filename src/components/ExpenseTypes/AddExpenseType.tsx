import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import HeroIconPicker from '../UI/HeroIconPicker'
import IconRenderer from '../UI/IconRenderer'
import { getSuggestedIcons, getDefaultIconForCategory } from '../../lib/heroicons'

interface AddExpenseTypeForm {
  name: string
  category_id: string
  icon_name: string
}

interface Category {
  id: string
  name: string
  color: string
}

interface AddExpenseTypeProps {
  categories: Category[]
  usedIcons: string[]
  onClose: () => void
  onSuccess: () => void
}

export default function AddExpenseType({
  categories,
  usedIcons,
  onClose,
  onSuccess
}: AddExpenseTypeProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddExpenseTypeForm>({
    defaultValues: {
      name: '',
      category_id: '',
      icon_name: ''
    }
  })

  const watchedName = watch('name')
  const watchedCategoryId = watch('category_id')

  // Trigger animation on mount
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  // Auto-suggest icons based on expense type name
  useEffect(() => {
    if (watchedName && watchedName.length >= 2 && !selectedIcon) {
      const suggestions = getSuggestedIcons(watchedName)
      if (suggestions.length > 0) {
        // Find the first suggestion that's not already used
        const availableSuggestion = suggestions.find(s => !usedIcons.includes(s.name))
        if (availableSuggestion) {
          setSelectedIcon(availableSuggestion.name)
          setValue('icon_name', availableSuggestion.name)
        }
      }
    }
  }, [watchedName, selectedIcon, usedIcons, setValue])

  // Set default icon when category changes
  useEffect(() => {
    if (watchedCategoryId && !selectedIcon) {
      const category = categories.find(c => c.id === watchedCategoryId)
      if (category) {
        const defaultIcon = getDefaultIconForCategory(category.name)
        if (!usedIcons.includes(defaultIcon)) {
          setSelectedIcon(defaultIcon)
          setValue('icon_name', defaultIcon)
        }
      }
    }
  }, [watchedCategoryId, selectedIcon, categories, usedIcons, setValue])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName)
    setValue('icon_name', iconName)
    setShowIconPicker(false)
  }

  const onSubmit = async (data: AddExpenseTypeForm) => {
    if (!selectedIcon) {
      setError('Please select an icon for your expense type')
      return
    }

    try {
      setError('')
      setLoading(true)

      // Check if the name already exists in this category
      const { data: existingData, error: checkError } = await supabase
        .from('expense_types')
        .select('id')
        .eq('category_id', data.category_id)
        .ilike('name', data.name)
        .limit(1)

      if (checkError) throw checkError

      if (existingData && existingData.length > 0) {
        setError('An expense type with this name already exists in the selected category')
        return
      }

      // Create the expense type
      const { error } = await supabase
        .from('expense_types')
        .insert({
          name: data.name.trim(),
          category_id: data.category_id,
          icon_name: selectedIcon,
          is_user_created: true,
          created_by_user_id: user!.id
        })

      if (error) throw error

      onSuccess()
    } catch (error: any) {
      console.error('Error creating expense type:', error)
      setError(error.message || 'Failed to create expense type')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div 
        className={`relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white transform transition-all duration-200 ease-in-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Add New Expense Type
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              {...register('category_id', { required: 'Please select a category' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
            )}
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              {...register('name', { 
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 50, message: 'Name must be less than 50 characters' }
              })}
              type="text"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 cursor-text"
              placeholder="e.g., Netflix, Gym Membership, Car Insurance"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            
            {/* Selected Icon Display */}
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className={`flex items-center space-x-3 px-4 py-3 border rounded-md transition-colors duration-200 cursor-pointer ${
                  selectedIcon 
                    ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' 
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {selectedIcon ? (
                  <>
                    <IconRenderer
                      iconName={selectedIcon}
                      size="md"
                      className="text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedIcon.replace('Icon', '')}
                    </span>
                    <span className="text-sm text-gray-500">
                      (Click to change)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 border-2 border-dashed border-gray-300 rounded" />
                    <span className="text-sm text-gray-600">
                      Click to select an icon
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Icon Picker */}
            {showIconPicker && (
              <div className="mb-4">
                <HeroIconPicker
                  selectedIcon={selectedIcon}
                  onIconSelect={handleIconSelect}
                  usedIcons={usedIcons}
                  className="max-h-96"
                />
              </div>
            )}
          </div>

          {/* Preview */}
          {selectedIcon && watchedName && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview:</h4>
              <div className="flex items-center space-x-3">
                <IconRenderer
                  iconName={selectedIcon}
                  size="md"
                  className="text-gray-600"
                />
                <span className="text-sm font-medium text-gray-900">
                  {watchedName}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedIcon}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Expense Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}