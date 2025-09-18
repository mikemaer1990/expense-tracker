import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PlusIcon, PencilIcon, TrashIcon, Cog6ToothIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import IconRenderer from '../UI/IconRenderer'
import AddExpenseType from './AddExpenseType'
import EditExpenseType from './EditExpenseType'
import ConfirmDialog from '../UI/ConfirmDialog'
import UserDropdown from '../UI/UserDropdown'
import Toast from '../UI/Toast'

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

export default function ExpenseTypeManager() {
  const { user, signOut } = useAuth()
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingExpenseType, setEditingExpenseType] = useState<ExpenseType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ show: false, message: '', type: 'info' })
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean
    expenseType: ExpenseType | null
  }>({ show: false, expenseType: null })

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Load expense types with category info
      const { data: expenseTypesData, error: expenseTypesError } = await supabase
        .from('expense_types')
        .select(`
          *,
          category:categories(id, name, color)
        `)
        .in('category_id', (categoriesData || []).map(c => c.id))
        .order('name')

      if (expenseTypesError) throw expenseTypesError
      setExpenseTypes(expenseTypesData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      showToast('Failed to load expense types', 'error')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, loadData])

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type })
  }

  const handleCloseToast = () => {
    setToast({ show: false, message: '', type: 'info' })
  }

  const handleAddSuccess = () => {
    showToast('Expense type created successfully', 'success')
    loadData()
    setShowAddModal(false)
  }

  const handleEditSuccess = () => {
    showToast('Expense type updated successfully', 'success')
    loadData()
    setEditingExpenseType(null)
  }

  const handleEdit = (expenseType: ExpenseType) => {
    setEditingExpenseType(expenseType)
  }

  const handleDelete = (expenseType: ExpenseType) => {
    if (!expenseType.is_user_created) {
      showToast('Cannot delete system default expense types', 'error')
      return
    }

    setDeleteConfirm({ show: true, expenseType })
  }

  const handleDeleteConfirmed = async () => {
    const expenseType = deleteConfirm.expenseType
    if (!expenseType) return

    setDeleteConfirm({ show: false, expenseType: null })

    try {
      // Check if the expense type is being used
      const { data: expensesData, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('expense_type_id', expenseType.id)
        .limit(1)

      if (checkError) throw checkError

      if (expensesData && expensesData.length > 0) {
        showToast('Cannot delete expense type that is being used in expenses', 'error')
        return
      }

      // Delete the expense type
      const { error } = await supabase
        .from('expense_types')
        .delete()
        .eq('id', expenseType.id)

      if (error) throw error

      showToast('Expense type deleted successfully', 'success')
      loadData()
    } catch (error) {
      console.error('Error deleting expense type:', error)
      showToast('Failed to delete expense type', 'error')
    }
  }

  const handleDeleteCanceled = () => {
    setDeleteConfirm({ show: false, expenseType: null })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Filter expense types by category
  const filteredExpenseTypes = selectedCategory === 'all' 
    ? expenseTypes 
    : expenseTypes.filter(et => et.category_id === selectedCategory)

  // Group expense types by category for display
  const groupedExpenseTypes = categories.map(category => ({
    category,
    expenseTypes: expenseTypes.filter(et => et.category_id === category.id)
  })).filter(group => selectedCategory === 'all' || group.category.id === selectedCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
          <p className="mt-2 text-gray-500">Loading expense types...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Loggy"
                className="h-10 w-auto mr-2 mb-2"
              />
              <div className="hidden lg:ml-8 lg:flex lg:space-x-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/history"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  History
                </Link>
                <Link
                  to="/analytics"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Analytics
                </Link>
                <Link
                  to="/expense-types"
                  className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Expense Types
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex lg:items-center">
              <UserDropdown onSignOut={handleSignOut} />
            </div>

            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-gray-900 p-2 cursor-pointer"
              >
                <div className="relative w-6 h-6">
                  <Bars3Icon
                    className={`absolute h-6 w-6 transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
                    }`}
                  />
                  <XMarkIcon
                    className={`absolute h-6 w-6 transition-all duration-300 ease-in-out ${
                      mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          <div className={`md:hidden border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                History
              </Link>
              <Link
                to="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                Analytics
              </Link>
              <Link
                to="/expense-types"
                onClick={() => setMobileMenuOpen(false)}
                className="text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                Expense Types
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
              >
                Settings
              </Link>
              <div className="border-t border-gray-200 pt-3">
                <div className="px-3 py-2">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-base font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Expense Types</h1>
            <p className="text-gray-600">Organize your expenses with custom categories and icons</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Expense Type</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
            }`}
          >
            All Categories ({expenseTypes.length})
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-2 text-sm rounded-md transition-colors flex items-center space-x-2 cursor-pointer ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span>
                {category.name} ({expenseTypes.filter(et => et.category_id === category.id).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Expense Types List */}
      <div className="space-y-6">
        {groupedExpenseTypes.map(({ category, expenseTypes: categoryExpenseTypes }) => (
          <div key={category.id} className="bg-white shadow rounded-lg">
            {/* Category Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                <span className="text-sm text-gray-500">
                  ({categoryExpenseTypes.length} types)
                </span>
              </div>
            </div>

            {/* Expense Types Grid */}
            {categoryExpenseTypes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No expense types in this category</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryExpenseTypes.map(expenseType => (
                    <div
                      key={expenseType.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <IconRenderer
                          iconName={expenseType.icon_name}
                          size="md"
                          className="text-gray-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {expenseType.name}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {expenseType.is_user_created ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                Custom
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => handleEdit(expenseType)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200 cursor-pointer"
                          title="Edit expense type"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {expenseType.is_user_created && (
                          <button
                            onClick={() => handleDelete(expenseType)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200 cursor-pointer"
                            title="Delete expense type"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredExpenseTypes.length === 0 && !loading && (
        <div className="text-center py-12">
          <Cog6ToothIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No expense types</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first custom expense type.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Expense Type
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddExpenseType
          categories={categories}
          usedIcons={expenseTypes.filter(et => et.created_by_user_id === user?.id).map(et => et.icon_name)}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {editingExpenseType && (
        <EditExpenseType
          expenseType={editingExpenseType}
          categories={categories}
          usedIcons={expenseTypes
            .filter(et => et.created_by_user_id === user?.id && et.id !== editingExpenseType.id)
            .map(et => et.icon_name)}
          onClose={() => setEditingExpenseType(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Expense Type"
        message={`Are you sure you want to delete "${deleteConfirm.expenseType?.name}"? This action cannot be undone and will remove this expense type from your account.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirmed}
        onCancel={handleDeleteCanceled}
      />

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleCloseToast}
        />
      )}
          </div>
        </div>
      </main>
    </div>
  )
}