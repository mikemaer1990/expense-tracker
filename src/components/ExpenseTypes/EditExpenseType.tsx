import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'
import HeroIconPicker from '../UI/HeroIconPicker'
import IconRenderer from '../UI/IconRenderer'
import { getSuggestedIcons, getDefaultIconForCategory } from '../../lib/heroicons'

interface EditExpenseTypeForm {
  name: string
  category_id: string
  icon_name: string
}

interface ExpenseType {
  id: string
  name: string
  icon_name: string
  is_user_created: boolean
  created_by_user_id: string | null
  category_id: string
  category: {
    id: string
    name: string
    color: string
  }
}

interface Category {
  id: string
  name: string
  color: string
}

interface EditExpenseTypeProps {
  expenseType: ExpenseType
  categories: Category[]
  usedIcons: string[]
  onClose: () => void
  onSuccess: () => void
}

export default function EditExpenseType({
  expenseType,
  categories,
  usedIcons,
  onClose,
  onSuccess
}: EditExpenseTypeProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedIcon, setSelectedIcon] = useState(expenseType.icon_name)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditExpenseTypeForm>({
    defaultValues: {
      name: expenseType.name,
      category_id: expenseType.category_id,
      icon_name: expenseType.icon_name
    }
  })

  const watchedName = watch('name')
  const watchedCategoryId = watch('category_id')

  // Trigger animation on mount
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  // Auto-suggest icons based on expense type name (only if user changes the name significantly)
  useEffect(() => {
    if (watchedName && watchedName.length >= 2 && watchedName !== expenseType.name) {
      const suggestions = getSuggestedIcons(watchedName)
      if (suggestions.length > 0) {
        // Find the first suggestion that's not already used (excluding current icon)
        const availableSuggestion = suggestions.find(s => 
          !usedIcons.includes(s.name) || s.name === expenseType.icon_name
        )
        if (availableSuggestion && availableSuggestion.name !== selectedIcon) {
          setSelectedIcon(availableSuggestion.name)
          setValue('icon_name', availableSuggestion.name)
        }
      }
    }
  }, [watchedName, expenseType.name, expenseType.icon_name, usedIcons, setValue, selectedIcon])

  // Set default icon when category changes (only if user changes category)
  useEffect(() => {
    if (watchedCategoryId && watchedCategoryId !== expenseType.category_id) {
      const category = categories.find(c => c.id === watchedCategoryId)
      if (category) {
        const defaultIcon = getDefaultIconForCategory(category.name)
        if (!usedIcons.includes(defaultIcon) || defaultIcon === expenseType.icon_name) {
          setSelectedIcon(defaultIcon)
          setValue('icon_name', defaultIcon)
        }
      }
    }
  }, [watchedCategoryId, expenseType.category_id, categories, usedIcons, setValue, expenseType.icon_name])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 200)
  }

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName)
    setValue('icon_name', iconName)
    setShowIconPicker(false)
  }

  const onSubmit = async (data: EditExpenseTypeForm) => {
    if (!selectedIcon) {
      setError('Please select an icon for your expense type')
      return
    }

    // Check if this is a system default expense type
    if (!expenseType.is_user_created) {
      setError('Cannot edit system default expense types')
      return
    }

    try {
      setError('')
      setLoading(true)

      // Check if the name already exists in this category (excluding current expense type)
      const { data: existingData, error: checkError } = await supabase
        .from('expense_types')
        .select('id')
        .eq('category_id', data.category_id)
        .ilike('name', data.name)
        .neq('id', expenseType.id)
        .limit(1)

      if (checkError) throw checkError

      if (existingData && existingData.length > 0) {
        setError('An expense type with this name already exists in the selected category')
        return
      }

      // Update the expense type
      const { error } = await supabase
        .from('expense_types')
        .update({
          name: data.name.trim(),
          category_id: data.category_id,
          icon_name: selectedIcon
        })
        .eq('id', expenseType.id)

      if (error) throw error

      onSuccess()
    } catch (error: any) {
      console.error('Error updating expense type:', error)
      setError(error.message || 'Failed to update expense type')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div
        className={`relative mx-auto border shadow-lg bg-white
                    /* Mobile: Full screen with slide-up animation */
                    min-h-screen w-full p-4 pt-8 pb-8 rounded-none
                    /* Desktop: Centered modal with fade animation */
                    md:top-20 md:w-full md:max-w-2xl md:min-h-0 md:p-5 md:rounded-md md:overflow-y-auto
                    /* Animation classes */
                    transform transition-all duration-200 ease-in-out ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Edit Expense Type
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Show warning for system default types */}
        {!expenseType.is_user_created && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              This is a system default expense type and cannot be edited. Only custom expense types can be modified.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              {...register('category_id', { required: 'Please select a category' })}
              disabled={!expenseType.is_user_created}
              className={`mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px] ${
                !expenseType.is_user_created ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
              }`}
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
              disabled={!expenseType.is_user_created}
              className={`mt-1 block w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-[44px] ${
                !expenseType.is_user_created ? 'bg-gray-100 cursor-not-allowed' : 'cursor-text'
              }`}
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
                onClick={() => expenseType.is_user_created && setShowIconPicker(!showIconPicker)}
                disabled={!expenseType.is_user_created}
                className={`flex items-center space-x-3 px-4 py-3 border rounded-md transition-colors duration-200 ${
                  !expenseType.is_user_created
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : selectedIcon 
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
                    {expenseType.is_user_created && (
                      <span className="text-sm text-gray-500">
                        (Click to change)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 border-2 border-dashed border-gray-300 rounded" />
                    <span className="text-sm text-gray-600">
                      {expenseType.is_user_created ? 'Click to select an icon' : 'Icon (read-only)'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Icon Picker */}
            {showIconPicker && expenseType.is_user_created && (
              <div className="mb-4">
                <HeroIconPicker
                  selectedIcon={selectedIcon}
                  onIconSelect={handleIconSelect}
                  usedIcons={usedIcons}
                  className="max-h-[75vh] md:max-h-96"
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
              className="flex-1 px-4 py-3 md:py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 cursor-pointer min-h-[48px] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedIcon || !expenseType.is_user_created}
              className="flex-1 px-4 py-3 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer min-h-[48px] font-medium"
            >
              {loading ? 'Updating...' : 'Update Expense Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}