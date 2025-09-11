import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bars3Icon, XMarkIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../utils/currency'
import CategoryBreakdown from './CategoryBreakdown'
import DataGrid from './DataGrid'
import PieChart from './PieChart'
import LineChart from './LineChart'
import BarChart from './BarChart'
import UserDropdown from '../UI/UserDropdown'

interface CategoryData {
  id: string
  name: string
  color: string
  totalAmount: number
  expenseTypes: ExpenseTypeData[]
  percentage: number
}

interface ExpenseTypeData {
  id: string
  name: string
  totalAmount: number
  monthlyData: { [month: string]: number }
  transactionCount: number
}

type TimePeriod = 'monthly' | 'yearly'
type ViewMode = 'breakdown' | 'grid'

export default function Analytics() {
  const { user, signOut } = useAuth()
  const { preferences } = useUserPreferences()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly')
  const [viewMode, setViewMode] = useState<ViewMode>('breakdown')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const loadAnalyticsData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get categories with their expense types and expenses
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          color,
          expense_types (
            id,
            name,
            expenses (
              amount,
              date
            )
          )
        `)
        .eq('user_id', user.id)

      if (categoriesError) throw categoriesError

      // Get income for the selected period
      let incomeQuery = supabase
        .from('income')
        .select('amount, date')
        .eq('user_id', user.id)

      if (timePeriod === 'monthly') {
        const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0]
        const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0]
        incomeQuery = incomeQuery.gte('date', startDate).lte('date', endDate)
      } else {
        const startDate = `${selectedYear}-01-01`
        const endDate = `${selectedYear}-12-31`
        incomeQuery = incomeQuery.gte('date', startDate).lte('date', endDate)
      }

      const { data: incomeData, error: incomeError } = await incomeQuery

      if (incomeError) throw incomeError

      const totalIncome = incomeData?.reduce((sum, income) => sum + income.amount, 0) || 0
      setTotalIncome(totalIncome)

      // Extract available years from all user data
      const yearsSet = new Set<number>()
      
      // Add years from expense data
      categoriesData?.forEach(category => {
        category.expense_types.forEach(expenseType => {
          expenseType.expenses.forEach(expense => {
            const expenseYear = new Date(expense.date).getFullYear()
            yearsSet.add(expenseYear)
          })
        })
      })
      
      // Get all income data (not just selected period) for year extraction
      const { data: allIncomeData, error: allIncomeError } = await supabase
        .from('income')
        .select('date')
        .eq('user_id', user.id)
      
      if (!allIncomeError && allIncomeData) {
        allIncomeData.forEach(income => {
          const incomeYear = new Date(income.date).getFullYear()
          yearsSet.add(incomeYear)
        })
      }
      
      // Convert to sorted array (newest first)
      const availableYearsList = Array.from(yearsSet).sort((a, b) => b - a)
      
      // If no data exists, show current year
      const finalAvailableYears = availableYearsList.length > 0 
        ? availableYearsList 
        : [new Date().getFullYear()]
      
      setAvailableYears(finalAvailableYears)

      // Process categories data
      const processedCategories: CategoryData[] = categoriesData?.map(category => {
        const expenseTypes: ExpenseTypeData[] = category.expense_types.map(expenseType => {
          const monthlyData: { [month: string]: number } = {}
          let totalAmount = 0
          let transactionCount = 0

          expenseType.expenses.forEach(expense => {
            const expenseDate = new Date(expense.date)
            const expenseYear = expenseDate.getFullYear()
            const expenseMonth = expenseDate.getMonth()

            if (timePeriod === 'monthly') {
              if (expenseYear === selectedYear && expenseMonth === selectedMonth) {
                totalAmount += expense.amount
                transactionCount++
              }
            } else {
              if (expenseYear === selectedYear) {
                totalAmount += expense.amount
                transactionCount++
                const monthKey = expenseDate.toLocaleString('default', { month: 'short' })
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount
              }
            }
          })

          return {
            id: expenseType.id,
            name: expenseType.name,
            totalAmount,
            monthlyData,
            transactionCount
          }
        })

        const categoryTotal = expenseTypes.reduce((sum, et) => sum + et.totalAmount, 0)

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          totalAmount: categoryTotal,
          expenseTypes,
          percentage: 0 // Will be calculated after we have total expenses
        }
      }) || []

      const totalExpenses = processedCategories.reduce((sum, cat) => sum + cat.totalAmount, 0)
      
      // Calculate percentages
      processedCategories.forEach(category => {
        category.percentage = totalExpenses > 0 ? (category.totalAmount / totalExpenses) * 100 : 0
      })

      setCategories(processedCategories)
      setTotalExpenses(totalExpenses)

    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, timePeriod, selectedYear, selectedMonth])

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user, loadAnalyticsData])

  // Auto-select most recent available year when available years change
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]) // First item is most recent due to sorting
    }
  }, [availableYears, selectedYear])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const surplus = totalIncome - totalExpenses
  const currentPeriodLabel = timePeriod === 'monthly' 
    ? new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })
    : selectedYear.toString()

  // Transform data for DataGrid component
  const gridData = categories.map(category => ({
    id: category.id,
    name: category.name,
    color: category.color,
    monthlyData: category.expenseTypes.reduce((acc, et) => {
      Object.keys(et.monthlyData).forEach(month => {
        acc[month] = (acc[month] || 0) + et.monthlyData[month]
      })
      return acc
    }, {} as { [month: string]: number }),
    yearTotal: category.totalAmount,
    isCategory: true,
    expenseTypes: category.expenseTypes.map(et => ({
      id: et.id,
      name: et.name,
      categoryName: category.name,
      monthlyData: et.monthlyData,
      yearTotal: et.totalAmount,
      isSubrow: true
    }))
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Spendlyzer
              </h1>
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
                  className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
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
                className="text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            </div>
            <p className="text-gray-600">Detailed analysis of your spending patterns and trends</p>
          </div>

          {/* Controls */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <button
                      onClick={() => setTimePeriod('monthly')}
                      className={`px-3 py-1 text-sm font-medium rounded transition-all duration-200 cursor-pointer ${
                        timePeriod === 'monthly' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setTimePeriod('yearly')}
                      className={`px-3 py-1 text-sm font-medium rounded transition-all duration-200 cursor-pointer ${
                        timePeriod === 'yearly' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <div className="flex bg-gray-100 rounded-md p-1">
                    {availableYears.map(year => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-3 py-1 text-sm font-medium rounded transition-all duration-200 cursor-pointer ${
                          selectedYear === year 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {timePeriod === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <div className="flex bg-gray-100 rounded-md p-1 flex-wrap">
                      {Array.from({ length: 12 }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedMonth(i)}
                          className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 cursor-pointer ${
                            selectedMonth === i 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
                          }`}
                          title={new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        >
                          {new Date(2024, i).toLocaleString('default', { month: 'short' })}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display</label>
                <div className="flex bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setViewMode('breakdown')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors duration-200 cursor-pointer ${
                      viewMode === 'breakdown' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Charts
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors duration-200 cursor-pointer ${
                      viewMode === 'grid' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Data
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">+</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Income ({currentPeriodLabel})
                      </dt>
                      <dd className="text-lg font-medium text-green-600">
                        {formatCurrency(totalIncome, preferences.currency)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">-</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Expenses ({currentPeriodLabel})
                      </dt>
                      <dd className="text-lg font-medium text-orange-600">
                        {formatCurrency(totalExpenses, preferences.currency)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      surplus >= 0 ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      <span className="text-white font-semibold">=</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {surplus >= 0 ? 'Surplus' : 'Deficit'} ({currentPeriodLabel})
                      </dt>
                      <dd className={`text-lg font-medium ${
                        surplus >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(surplus), preferences.currency)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="bg-white shadow rounded-lg p-8">
              <div className="text-center text-gray-500">Loading analytics data...</div>
            </div>
          ) : viewMode === 'breakdown' ? (
            <div className="space-y-6">
              {/* Charts View */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Pie Chart - Category Distribution */}
                <PieChart 
                  categories={categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    color: cat.color,
                    totalAmount: cat.totalAmount,
                    percentage: cat.percentage
                  }))}
                  onCategoryClick={(categoryId) => {
                    console.log('Category clicked:', categoryId)
                    // Future: Show detailed breakdown for selected category
                  }}
                />
                
                {/* Bar Chart - Monthly Comparison */}
                {timePeriod === 'yearly' && (
                  <BarChart
                    currency={preferences.currency}
                    data={Array.from({ length: 12 }, (_, i) => {
                      const monthKey = new Date(2024, i).toLocaleString('default', { month: 'short' })
                      const monthTotal = categories.reduce((sum, cat) => 
                        sum + cat.expenseTypes.reduce((etSum, et) => etSum + (et.monthlyData[monthKey] || 0), 0), 0
                      )
                      const expenseCount = categories.reduce((sum, cat) => 
                        sum + cat.expenseTypes.reduce((etSum, et) => etSum + (et.monthlyData[monthKey] ? 1 : 0), 0), 0
                      )
                      return {
                        month: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
                        expenses: monthTotal,
                        expenseCount: expenseCount
                      }
                    })}
                    onBarClick={(monthData) => {
                      console.log('Month clicked:', monthData)
                      // Future: Show detailed breakdown for selected month
                    }}
                  />
                )}
              </div>
              
              {/* Line Chart - Spending Trends */}
              {timePeriod === 'yearly' && (
                <LineChart
                  currency={preferences.currency}
                  data={Array.from({ length: 12 }, (_, i) => {
                    const monthKey = new Date(2024, i).toLocaleString('default', { month: 'short' })
                    const monthTotal = categories.reduce((sum, cat) => 
                      sum + cat.expenseTypes.reduce((etSum, et) => etSum + (et.monthlyData[monthKey] || 0), 0), 0
                    )
                    const expenseCount = categories.reduce((sum, cat) => 
                      sum + cat.expenseTypes.reduce((etSum, et) => etSum + (et.monthlyData[monthKey] ? 1 : 0), 0), 0
                    )
                    return {
                      date: `${selectedYear}-${String(i + 1).padStart(2, '0')}-15`, // Mid-month date
                      amount: monthTotal,
                      expenseCount: expenseCount
                    }
                  })}
                  timeframe="year"
                />
              )}
              
              {/* Original Category Breakdown - Still available below charts */}
              <CategoryBreakdown 
                categories={categories}
                timePeriod={timePeriod}
                currentPeriodLabel={currentPeriodLabel}
                currency={preferences.currency}
              />
            </div>
          ) : (
            timePeriod === 'yearly' ? (
              <DataGrid 
                data={gridData}
                selectedYear={selectedYear}
                currency={preferences.currency}
                onExportCSV={() => console.log('CSV exported')}
              />
            ) : (
              <div className="bg-white shadow rounded-lg p-8">
                <div className="text-center text-gray-500">
                  Data view is only available for yearly data. Please switch to yearly view to see the spreadsheet-style breakdown.
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )
}