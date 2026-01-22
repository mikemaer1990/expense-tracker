import { useState, useEffect, useCallback } from 'react'
import { PencilIcon, TrashIcon, ArrowPathIcon, PlayIcon, PauseIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { formatCurrency } from '../../utils/currency'
import IconRenderer from '../UI/IconRenderer'
import EditRecurringTemplate from './EditRecurringTemplate'
import ConfirmDialog from '../UI/ConfirmDialog'
import Navigation from '../UI/Navigation'
import Toast from '../UI/Toast'

interface ExpenseType {
  id: string
  name: string
  icon_name: string
  categories: {
    id: string
    name: string
    color: string
  }
}

interface RecurringTemplate {
  id: string
  user_id: string
  template_type: 'expense' | 'income'
  amount: number
  description: string | null
  expense_type_id: string | null
  is_split: boolean
  original_amount: number | null
  split_with: string | null
  source: string | null
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  end_date: string | null
  last_generated_date: string | null
  next_generation_date: string | null
  is_active: boolean
  created_at: string
  expense_type?: ExpenseType
}

type FilterType = 'all' | 'expense' | 'income'

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly'
}

export default function RecurringManager() {
  const { user } = useAuth()
  const { preferences } = useUserPreferences()
  const [templates, setTemplates] = useState<RecurringTemplate[]>([])
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ show: false, message: '', type: 'info' })
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean
    template: RecurringTemplate | null
  }>({ show: false, template: null })

  const loadData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load expense types for the expense type selector and icons
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)

      if (categoriesData) {
        const { data: expenseTypesData } = await supabase
          .from('expense_types')
          .select(`
            id, name, icon_name,
            categories (id, name, color)
          `)
          .in('category_id', categoriesData.map(c => c.id))
          .order('name')

        if (expenseTypesData) {
          setExpenseTypes(expenseTypesData as unknown as ExpenseType[])
        }
      }

      // Load recurring templates with expense_type info
      const { data: templatesData, error: templatesError } = await supabase
        .from('recurring_templates')
        .select(`
          *,
          expense_type:expense_types (
            id, name, icon_name,
            categories (id, name, color)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError
      setTemplates(templatesData || [])

    } catch (error) {
      console.error('Error loading data:', error)
      showToast('Failed to load recurring transactions', 'error')
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

  const handleEditSuccess = () => {
    showToast('Recurring transaction updated successfully', 'success')
    loadData()
    setEditingTemplate(null)
  }

  const handleEdit = (template: RecurringTemplate) => {
    setEditingTemplate(template)
  }

  const handleDelete = (template: RecurringTemplate) => {
    setDeleteConfirm({ show: true, template })
  }

  const handleDeleteConfirmed = async () => {
    const template = deleteConfirm.template
    if (!template) return

    setDeleteConfirm({ show: false, template: null })

    try {
      const today = new Date().toISOString().split('T')[0]
      const table = template.template_type === 'expense' ? 'expenses' : 'income'

      // 1. Delete future instances (date > today)
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('recurring_template_id', template.id)
        .gt('date', today)

      if (deleteError) throw deleteError

      // 2. Unlink past instances (keep transactions, remove link)
      const { error: unlinkError } = await supabase
        .from(table)
        .update({ recurring_template_id: null })
        .eq('recurring_template_id', template.id)

      if (unlinkError) throw unlinkError

      // 3. Delete template
      const { error: templateError } = await supabase
        .from('recurring_templates')
        .delete()
        .eq('id', template.id)

      if (templateError) throw templateError

      showToast('Recurring transaction deleted successfully', 'success')
      loadData()
    } catch (error) {
      console.error('Error deleting template:', error)
      showToast('Failed to delete recurring transaction', 'error')
    }
  }

  const handleDeleteCanceled = () => {
    setDeleteConfirm({ show: false, template: null })
  }

  const handleToggleActive = async (template: RecurringTemplate) => {
    try {
      const { error } = await supabase
        .from('recurring_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id)

      if (error) throw error

      showToast(
        template.is_active ? 'Recurring transaction paused' : 'Recurring transaction resumed',
        'success'
      )
      loadData()
    } catch (error) {
      console.error('Error toggling template status:', error)
      showToast('Failed to update status', 'error')
    }
  }

  // Filter templates by type
  const filteredTemplates = filter === 'all'
    ? templates
    : templates.filter(t => t.template_type === filter)

  // Count by type
  const expenseCount = templates.filter(t => t.template_type === 'expense').length
  const incomeCount = templates.filter(t => t.template_type === 'income').length

  const formatNextDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled'
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            <p className="mt-2 text-gray-500">Loading recurring transactions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowPathIcon className="h-6 w-6 text-blue-600" />
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Recurring Transactions</h1>
                  </div>
                  <p className="text-sm md:text-base text-gray-600">Manage your recurring expenses and income</p>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  All ({templates.length})
                </button>
                <button
                  onClick={() => setFilter('expense')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    filter === 'expense'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  Expenses ({expenseCount})
                </button>
                <button
                  onClick={() => setFilter('income')}
                  className={`px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${
                    filter === 'income'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  Income ({incomeCount})
                </button>
              </div>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recurring transactions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all'
                    ? 'Create a recurring expense or income to get started.'
                    : filter === 'expense'
                    ? 'No recurring expenses found.'
                    : 'No recurring income found.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                      template.template_type === 'income' ? 'border-l-green-500' : 'border-l-orange-500'
                    } ${!template.is_active ? 'opacity-60' : ''}`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {template.template_type === 'expense' && template.expense_type ? (
                          <div
                            className="p-2 rounded-lg flex-shrink-0"
                            style={{
                              backgroundColor: `${template.expense_type.categories?.color}20`,
                            }}
                          >
                            <IconRenderer
                              iconName={template.expense_type.icon_name}
                              size="md"
                              className="text-gray-700"
                            />
                          </div>
                        ) : (
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            template.template_type === 'income' ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            <ArrowPathIcon className={`h-5 w-5 ${
                              template.template_type === 'income' ? 'text-green-600' : 'text-orange-600'
                            }`} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {template.template_type === 'expense' && template.expense_type
                              ? template.expense_type.name
                              : template.source || 'Income'}
                          </p>
                          {template.description && (
                            <p className="text-sm text-gray-500 truncate">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`text-lg font-semibold flex-shrink-0 ${
                        template.template_type === 'income' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {template.template_type === 'income' ? '+' : '-'}
                        {formatCurrency(template.amount, preferences.currency)}
                      </span>
                    </div>

                    {/* Badges Row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        template.template_type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {template.template_type === 'income' ? 'Income' : 'Expense'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {frequencyLabels[template.frequency]}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        template.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Paused'}
                      </span>
                      {template.is_split && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Split{template.split_with ? ` with ${template.split_with}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Next Date Info */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                      <CalendarDaysIcon className="h-4 w-4" />
                      <span>Next: {formatNextDate(template.next_generation_date)}</span>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleActive(template)}
                        className={`flex items-center gap-1 px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                          template.is_active
                            ? 'text-gray-600 hover:bg-gray-100'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={template.is_active ? 'Pause' : 'Resume'}
                      >
                        {template.is_active ? (
                          <PauseIcon className="h-4 w-4" />
                        ) : (
                          <PlayIcon className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">
                          {template.is_active ? 'Pause' : 'Resume'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="flex items-center gap-1 px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="flex items-center gap-1 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Edit Modal */}
            {editingTemplate && (
              <EditRecurringTemplate
                template={editingTemplate}
                expenseTypes={expenseTypes}
                onClose={() => setEditingTemplate(null)}
                onSuccess={handleEditSuccess}
              />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
              isOpen={deleteConfirm.show}
              title="Delete Recurring Transaction"
              message={`Are you sure you want to delete this recurring ${deleteConfirm.template?.template_type}? Future instances will be removed, but past transactions will remain in your history.`}
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
