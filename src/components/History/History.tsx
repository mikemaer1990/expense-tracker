import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { DocumentTextIcon, TrashIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import EditExpense from '../Expenses/EditExpense'
import EditIncome from '../Income/EditIncome'
import IconRenderer from '../UI/IconRenderer'
import UserDropdown from '../UI/UserDropdown'
import Toast from '../UI/Toast'

export default function History() {
  const { user, signOut } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'expenses' | 'income'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [editType, setEditType] = useState<'expense' | 'income' | null>(null)
  const [expenseTypes, setExpenseTypes] = useState<any[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
    deletedTransaction?: any
    deletedType?: 'expense' | 'income'
  }>({ show: false, message: '', type: 'info' })
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set())

  const loadExpenseTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('expense_types')
        .select(`
          id,
          name,
          icon_name,
          categories (
            id,
            name,
            color
          )
        `)
        .order('name')

      if (error) {
        console.error('Error loading expense types:', error)
      } else {
        setExpenseTypes(data || [])
      }
    } catch (error) {
      console.error('Error loading expense types:', error)
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      let allTransactions = []

      if (filter === 'all' || filter === 'expenses') {
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select(`
            id,
            amount,
            description,
            date,
            created_at,
            expense_type_id,
            is_recurring,
            expense_types (
              id,
              name,
              icon_name,
              categories (
                name,
                color
              )
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: sortOrder === 'asc' })
          .order('created_at', { ascending: sortOrder === 'asc' })

        if (expensesError) throw expensesError
        
        const expenses = expensesData?.map((expense: any) => ({
          ...expense,
          type: 'expense',
          category: expense.expense_types?.categories?.name || 'Unknown',
          subcategory: expense.expense_types?.name || 'Unknown',
          iconName: expense.expense_types?.icon_name || 'QuestionMarkCircleIcon'
        })) || []
        
        allTransactions.push(...expenses)
      }

      if (filter === 'all' || filter === 'income') {
        const { data: incomeData, error: incomeError } = await supabase
          .from('income')
          .select('id, amount, description, date, created_at, source, is_recurring')
          .eq('user_id', user.id)
          .order('date', { ascending: sortOrder === 'asc' })
          .order('created_at', { ascending: sortOrder === 'asc' })

        if (incomeError) throw incomeError
        
        const income = incomeData?.map(income => ({
          ...income,
          type: 'income',
          category: income.is_recurring ? 'Recurring Income' : 'One-time Income',
          subcategory: income.source,
          iconName: 'CurrencyDollarIcon'
        })) || []
        
        allTransactions.push(...income)
      }

      // Sort by date or amount
      if (sortBy === 'date') {
        allTransactions.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })
      } else {
        allTransactions.sort((a, b) => {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount
        })
      }

      setTransactions(allTransactions)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [user, filter, sortBy, sortOrder])

  useEffect(() => {
    if (user) {
      loadExpenseTypes()
      loadTransactions()
    }
  }, [user, loadExpenseTypes, loadTransactions])

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction)
    setEditType(transaction.type)
  }

  const handleEditClose = () => {
    setEditingTransaction(null)
    setEditType(null)
  }

  const handleEditSuccess = () => {
    setToast({
      show: true,
      message: `${editType === 'expense' ? 'Expense' : 'Income'} updated successfully`,
      type: 'success'
    })
    loadTransactions() // Refresh the list
  }

  const handleDelete = async (id: string, type: 'expense' | 'income') => {
    // Find the transaction before deleting for undo functionality
    const transactionToDelete = transactions.find(t => t.id === id && t.type === type)
    
    try {
      const { error } = await supabase
        .from(type === 'expense' ? 'expenses' : 'income')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Show success toast with undo option
      setToast({
        show: true,
        message: `${type === 'expense' ? 'Expense' : 'Income'} deleted`,
        type: 'success',
        deletedTransaction: transactionToDelete,
        deletedType: type
      })

      loadTransactions() // Refresh the list
    } catch (error) {
      console.error('Error deleting transaction:', error)
      setToast({
        show: true,
        message: 'Failed to delete transaction',
        type: 'error'
      })
    }
  }

  const handleUndo = async () => {
    if (!toast.deletedTransaction || !toast.deletedType) return

    try {
      const transaction = toast.deletedTransaction
      
      if (toast.deletedType === 'expense') {
        const { error } = await supabase.from('expenses').insert({
          user_id: user!.id,
          expense_type_id: transaction.expense_type_id,
          amount: transaction.amount,
          date: transaction.date,
          description: transaction.description
        })
        if (error) throw error
      } else {
        const { error } = await supabase.from('income').insert({
          user_id: user!.id,
          source: transaction.source,
          amount: transaction.amount,
          date: transaction.date,
          is_recurring: transaction.is_recurring,
          description: transaction.description
        })
        if (error) throw error
      }

      setToast({
        show: true,
        message: `${toast.deletedType === 'expense' ? 'Expense' : 'Income'} restored`,
        type: 'info'
      })

      loadTransactions() // Refresh the list
    } catch (error) {
      console.error('Error restoring transaction:', error)
      setToast({
        show: true,
        message: 'Failed to restore transaction',
        type: 'error'
      })
    }
  }

  const handleCloseToast = () => {
    setToast({ show: false, message: '', type: 'info' })
  }

  const toggleExpenseName = (transactionId: string) => {
    setExpandedNames(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
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
              {/* Desktop Navigation */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/history"
                  className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
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
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Expense Types
                </Link>
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden lg:flex lg:items-center">
              <UserDropdown onSignOut={handleSignOut} />
            </div>

            {/* Mobile menu button */}
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

          {/* Mobile menu */}
          <div className={`lg:hidden border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
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
                  className="text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
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
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
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

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 overflow-hidden">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600">View and manage your expenses and income</p>
          </div>

          {/* Modern Filters and Sorting */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            {/* Filter Pills */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Transactions</h3>
              <div className="flex flex-wrap gap-2 overflow-x-auto">
                {[
                  { value: 'all', label: 'All Transactions', count: transactions.length },
                  { value: 'expenses', label: 'Expenses', count: transactions.filter(t => t.type === 'expense').length },
                  { value: 'income', label: 'Income', count: transactions.filter(t => t.type === 'income').length }
                ].map((filterOption) => (
                  <button
                    key={filterOption.value}
                    onClick={() => setFilter(filterOption.value as 'all' | 'expenses' | 'income')}
                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      filter === filterOption.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                    }`}
                  >
                    {filterOption.label}
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      filter === filterOption.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {filterOption.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Sort By</h3>
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSortBy('date')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                      sortBy === 'date'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Date
                  </button>
                  <button
                    onClick={() => setSortBy('amount')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                      sortBy === 'amount'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Amount
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Order</h3>
                <div className="inline-flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                      sortOrder === 'desc'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {sortBy === 'date' ? 'Newest First' : 'Highest First'}
                  </button>
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                      sortOrder === 'asc'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {sortBy === 'date' ? 'Oldest First' : 'Lowest First'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No transactions found. Start by adding some expenses or income!
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-hidden rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={`${transaction.type}-${transaction.id}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="mr-3">
                                <IconRenderer
                                  iconName={transaction.iconName}
                                  size="md"
                                  className="text-gray-600"
                                />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                  <span>{transaction.subcategory || 'Unknown'}</span>
                                  {transaction.is_recurring && (
                                    <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                      🔄 Recurring
                                    </span>
                                  )}
                                </div>
                                {transaction.description && (
                                  <div className="text-sm text-gray-500">{transaction.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {transaction.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.date + 'T00:00:00').toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-semibold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                              title="Edit transaction"
                            >
                              <DocumentTextIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(transaction.id, transaction.type)}
                              className="text-red-600 hover:text-red-900 ml-3 p-1 cursor-pointer"
                              title="Delete transaction"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <div className="space-y-4 p-4 overflow-hidden">
                    {transactions.map((transaction) => (
                      <div key={`${transaction.type}-${transaction.id}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 min-w-0">
                        {/* Top Row: Icon + Name + Amount */}
                        <div className="bg-blue-50/30 px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <IconRenderer
                                iconName={transaction.iconName}
                                size="md"
                                className="text-gray-600 flex-shrink-0"
                              />
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span
                                  className={`font-medium text-gray-900 cursor-pointer ${
                                    expandedNames.has(`${transaction.type}-${transaction.id}`)
                                      ? 'whitespace-normal break-words'
                                      : 'truncate'
                                  }`}
                                  onClick={() => toggleExpenseName(`${transaction.type}-${transaction.id}`)}
                                >
                                  {transaction.subcategory || 'Unknown'}
                                  {!expandedNames.has(`${transaction.type}-${transaction.id}`) &&
                                   (transaction.subcategory || 'Unknown').length > 20 && (
                                    <span className="text-blue-500 ml-1 text-sm">⋯</span>
                                  )}
                                </span>
                                {transaction.is_recurring && (
                                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                                    🔄
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className={`text-lg font-semibold flex-shrink-0 ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Middle Section: Category + Date + Description */}
                        <div className="px-4 py-3">
                          {/* Second Row: Category + Date */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-800">
                              {transaction.category}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(transaction.date + 'T00:00:00').toLocaleDateString()}
                            </span>
                          </div>

                          {/* Third Row: Description (if exists) */}
                          {transaction.description && (
                            <div>
                              <p className="text-sm text-gray-600 pl-1">
                                {transaction.description}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Bottom Row: Action Buttons */}
                        <div className="bg-gray-50 border-t border-gray-100">
                          <div className="flex">
                            {/* Edit Button Section */}
                            <div className="flex-1 flex items-center justify-center py-3 border-r border-gray-200">
                              <button
                                onClick={() => handleEdit(transaction)}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 p-2 rounded-md hover:bg-blue-100 cursor-pointer transition-colors duration-200"
                                title="Edit transaction"
                              >
                                <DocumentTextIcon className="h-5 w-5" />
                                <span className="text-sm font-medium">Edit</span>
                              </button>
                            </div>

                            {/* Delete Button Section */}
                            <div className="flex-1 flex items-center justify-center py-3">
                              <button
                                onClick={() => handleDelete(transaction.id, transaction.type)}
                                className="flex items-center space-x-2 text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-red-100 cursor-pointer transition-colors duration-200"
                                title="Delete transaction"
                              >
                                <TrashIcon className="h-5 w-5" />
                                <span className="text-sm font-medium">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modals */}
      {editingTransaction && editType === 'expense' && (
        <EditExpense
          expense={editingTransaction}
          expenseTypes={expenseTypes}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
        />
      )}

      {editingTransaction && editType === 'income' && (
        <EditIncome
          income={editingTransaction}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleCloseToast}
          onUndo={toast.deletedTransaction ? handleUndo : undefined}
          showUndo={!!toast.deletedTransaction && toast.type === 'success'}
        />
      )}
    </div>
  )
}