import { useState, useEffect, useCallback } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { supabase } from '../../lib/supabase'
import CategoryBreakdown from './CategoryBreakdown'
import DataGrid from './DataGrid'
import PieChart from './PieChart'
import LineChart from './LineChart'
import BarChart from './BarChart'
import KPICard from './KPICard'
import InsightsBanner from './InsightsBanner'
import TopSpenders from './TopSpenders'
import FixedVsVariable from './FixedVsVariable'
import SavingsRateBar from './SavingsRateBar'
import Navigation from '../UI/Navigation'

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
  recurringAmount: number
  monthlyData: { [month: string]: number }
  transactionCount: number
}

type TimePeriod = 'monthly' | 'yearly'
type ViewMode = 'breakdown' | 'grid'

export default function Analytics() {
  const { user } = useAuth()
  const { preferences } = useUserPreferences()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly')
  const [viewMode, setViewMode] = useState<ViewMode>('breakdown')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [priorIncome, setPriorIncome] = useState(0)
  const [priorExpenses, setPriorExpenses] = useState(0)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [monthlyIncomeData, setMonthlyIncomeData] = useState<{ [month: string]: number }>({})
  const [monthlyExpenseSparkline, setMonthlyExpenseSparkline] = useState<number[]>([])

  const loadAnalyticsData = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get categories with their expense types and expenses (including is_recurring)
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
              date,
              is_recurring
            )
          )
        `)
        .eq('user_id', user.id)

      if (categoriesError) throw categoriesError

      // Build date ranges for selected and prior periods
      let startDate: string, endDate: string
      let priorStartDate: string, priorEndDate: string

      if (timePeriod === 'monthly') {
        startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0]
        endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0]
        // Prior = previous month (handle January → December of prior year)
        const priorMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
        const priorYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
        priorStartDate = new Date(priorYear, priorMonth, 1).toISOString().split('T')[0]
        priorEndDate = new Date(priorYear, priorMonth + 1, 0).toISOString().split('T')[0]
      } else {
        startDate = `${selectedYear}-01-01`
        endDate = `${selectedYear}-12-31`
        priorStartDate = `${selectedYear - 1}-01-01`
        priorEndDate = `${selectedYear - 1}-12-31`
      }

      // Fetch income for selected period
      const { data: incomeData, error: incomeError } = await supabase
        .from('income')
        .select('amount, date')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)

      if (incomeError) throw incomeError

      const periodIncome = incomeData?.reduce((sum, i) => sum + i.amount, 0) || 0
      setTotalIncome(periodIncome)

      // Compute monthly income breakdown (for BarChart income overlay in yearly mode)
      const incomeByMonth: { [month: string]: number } = {}
      incomeData?.forEach(income => {
        const year = parseInt(income.date.split('-')[0], 10)
        const month = parseInt(income.date.split('-')[1], 10) - 1
        const monthKey = new Date(year, month).toLocaleString('default', { month: 'short' })
        incomeByMonth[monthKey] = (incomeByMonth[monthKey] || 0) + income.amount
      })
      setMonthlyIncomeData(incomeByMonth)

      // Fetch prior period income
      const { data: priorIncomeData } = await supabase
        .from('income')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', priorStartDate)
        .lte('date', priorEndDate)
      setPriorIncome(priorIncomeData?.reduce((sum, i) => sum + i.amount, 0) || 0)

      // Fetch prior period expenses (flat query for performance)
      const { data: priorExpData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', priorStartDate)
        .lte('date', priorEndDate)
      setPriorExpenses(priorExpData?.reduce((sum, e) => sum + e.amount, 0) || 0)

      // Extract available years from all user data
      const yearsSet = new Set<number>()

      categoriesData?.forEach(category => {
        category.expense_types.forEach(expenseType => {
          expenseType.expenses.forEach(expense => {
            const expenseYear = parseInt(expense.date.split('-')[0], 10)
            if (!isNaN(expenseYear)) yearsSet.add(expenseYear)
          })
        })
      })

      const { data: allIncomeData, error: allIncomeError } = await supabase
        .from('income')
        .select('date')
        .eq('user_id', user.id)

      if (!allIncomeError && allIncomeData) {
        allIncomeData.forEach(income => {
          const incomeYear = parseInt(income.date.split('-')[0], 10)
          if (!isNaN(incomeYear)) yearsSet.add(incomeYear)
        })
      }

      const availableYearsList = Array.from(yearsSet).sort((a, b) => b - a)
      const finalAvailableYears = availableYearsList.length > 0 ? availableYearsList : [new Date().getFullYear()]
      setAvailableYears(finalAvailableYears)

      // Process categories
      const processedCategories: CategoryData[] = categoriesData?.map(category => {
        const expenseTypes: ExpenseTypeData[] = category.expense_types.map(expenseType => {
          const monthlyData: { [month: string]: number } = {}
          let totalAmount = 0
          let recurringAmount = 0
          let transactionCount = 0

          expenseType.expenses.forEach(expense => {
            const expenseYear = parseInt(expense.date.split('-')[0], 10)
            const expenseMonth = parseInt(expense.date.split('-')[1], 10) - 1

            if (timePeriod === 'monthly') {
              if (expenseYear === selectedYear && expenseMonth === selectedMonth) {
                totalAmount += expense.amount
                transactionCount++
                if (expense.is_recurring) recurringAmount += expense.amount
              }
            } else {
              if (expenseYear === selectedYear) {
                totalAmount += expense.amount
                transactionCount++
                if (expense.is_recurring) recurringAmount += expense.amount
                const monthKey = new Date(expenseYear, expenseMonth).toLocaleString('default', { month: 'short' })
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + expense.amount
              }
            }
          })

          return { id: expenseType.id, name: expenseType.name, totalAmount, recurringAmount, monthlyData, transactionCount }
        })

        const categoryTotal = expenseTypes.reduce((sum, et) => sum + et.totalAmount, 0)

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          totalAmount: categoryTotal,
          expenseTypes,
          percentage: 0
        }
      }) || []

      const totalExp = processedCategories.reduce((sum, cat) => sum + cat.totalAmount, 0)
      processedCategories.forEach(cat => {
        cat.percentage = totalExp > 0 ? (cat.totalAmount / totalExp) * 100 : 0
      })

      setCategories(processedCategories)
      setTotalExpenses(totalExp)

      // Compute monthly expense sparkline for yearly view (all 12 months)
      if (timePeriod === 'yearly') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const sparkline = months.map(m =>
          processedCategories.reduce((sum, cat) =>
            sum + cat.expenseTypes.reduce((etSum, et) => etSum + (et.monthlyData[m] || 0), 0), 0)
        )
        setMonthlyExpenseSparkline(sparkline)
      } else {
        setMonthlyExpenseSparkline([])
      }

    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [user, timePeriod, selectedYear, selectedMonth])

  useEffect(() => {
    if (user) loadAnalyticsData()
  }, [user, loadAnalyticsData])

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0])
    }
  }, [availableYears, selectedYear])

  const surplus = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0

  const recurringTotal = categories.reduce((sum, cat) =>
    sum + cat.expenseTypes.reduce((etSum, et) => etSum + et.recurringAmount, 0), 0)

  const topSpenders = categories
    .flatMap(cat => cat.expenseTypes.map(et => ({
      id: et.id,
      name: et.name,
      categoryName: cat.name,
      categoryColor: cat.color,
      totalAmount: et.totalAmount,
      transactionCount: et.transactionCount,
    })))
    .filter(et => et.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)

  const topCategory = categories
    .filter(c => c.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount)[0] || null

  const currentPeriodLabel = timePeriod === 'monthly'
    ? new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })
    : selectedYear.toString()

  // Insight reset key — banner resets when period changes
  const insightKey = `${timePeriod}-${selectedYear}-${selectedMonth}`

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
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            </div>
            <p className="text-gray-600">Detailed analysis of your spending patterns and trends</p>
          </div>

          {/* Controls */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 mb-6 p-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                  <div className="flex bg-gray-100 rounded-md p-1">
                    <button
                      onClick={() => setTimePeriod('monthly')}
                      className={`px-3 py-1 text-sm font-medium rounded transition-all duration-200 cursor-pointer ${
                        timePeriod === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setTimePeriod('yearly')}
                      className={`px-3 py-1 text-sm font-medium rounded transition-all duration-200 cursor-pointer ${
                        timePeriod === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
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
                          selectedYear === year ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
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
                            selectedMonth === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
                          }`}
                          title={new Date(selectedYear, i).toLocaleString('default', { month: 'long' })}
                        >
                          {new Date(selectedYear, i).toLocaleString('default', { month: 'short' })}
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
                      viewMode === 'breakdown' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Charts
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors duration-200 cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Data
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Hero Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KPICard
              label="Income"
              value={totalIncome}
              currency={preferences.currency}
              priorValue={priorIncome}
              sentiment="income"
              sparklineData={timePeriod === 'yearly' ? Object.values(monthlyIncomeData) : undefined}
            />
            <KPICard
              label="Expenses"
              value={totalExpenses}
              currency={preferences.currency}
              priorValue={priorExpenses}
              sentiment="expense"
              sparklineData={timePeriod === 'yearly' ? monthlyExpenseSparkline : undefined}
            />
            <KPICard
              label={surplus >= 0 ? 'Surplus' : 'Deficit'}
              value={Math.abs(surplus)}
              currency={preferences.currency}
              priorValue={Math.abs(priorIncome - priorExpenses)}
              sentiment={surplus >= 0 ? 'surplus' : 'deficit'}
            />
          </div>

          {/* Insights Banner — resets on period change */}
          <InsightsBanner
            key={insightKey}
            totalExpenses={totalExpenses}
            priorExpenses={priorExpenses}
            totalIncome={totalIncome}
            topCategory={topCategory ? { name: topCategory.name, percentage: topCategory.percentage } : null}
            recurringTotal={recurringTotal}
            savingsRate={savingsRate}
            timePeriod={timePeriod}
            currency={preferences.currency}
          />

          {/* Main Content */}
          {loading ? (
            <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8">
              <div className="text-center text-gray-500">Loading analytics data...</div>
            </div>
          ) : viewMode === 'breakdown' ? (
            <div className="space-y-6">

              {/* Row 1: Donut + Bar chart */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <PieChart
                  categories={categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    color: cat.color,
                    totalAmount: cat.totalAmount,
                    percentage: cat.percentage
                  }))}
                  currency={preferences.currency}
                  onCategoryClick={(categoryId) => void categoryId}
                />

                {timePeriod === 'yearly' && (
                  <BarChart
                    currency={preferences.currency}
                    showIncome={true}
                    data={Array.from({ length: 12 }, (_, i) => {
                      const monthKey = new Date(selectedYear, i).toLocaleString('default', { month: 'short' })
                      const monthTotal = categories.reduce((sum, cat) =>
                        sum + cat.expenseTypes.reduce((etSum, et) => etSum + (et.monthlyData[monthKey] || 0), 0), 0)
                      const expenseCount = categories.reduce((sum, cat) =>
                        sum + cat.expenseTypes.reduce((etSum, et) => etSum + (et.monthlyData[monthKey] ? 1 : 0), 0), 0)
                      return {
                        month: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
                        expenses: monthTotal,
                        income: monthlyIncomeData[monthKey] || 0,
                        expenseCount,
                      }
                    })}
                    onBarClick={(monthData) => void monthData}
                  />
                )}
              </div>

              {/* Row 2: Savings Rate Bar */}
              <SavingsRateBar
                income={totalIncome}
                expenses={totalExpenses}
                currency={preferences.currency}
              />

              {/* Row 3: Top Spenders + Fixed vs Variable */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5">
                  <TopSpenders
                    items={topSpenders}
                    totalExpenses={totalExpenses}
                    currency={preferences.currency}
                  />
                </div>
                <div className="md:col-span-7">
                  <FixedVsVariable
                    fixedTotal={recurringTotal}
                    variableTotal={totalExpenses - recurringTotal}
                    totalExpenses={totalExpenses}
                    currency={preferences.currency}
                  />
                </div>
              </div>

              {/* Row 4: Line Chart (yearly only) */}
              {timePeriod === 'yearly' && (
                <LineChart
                  currency={preferences.currency}
                  data={Array.from({ length: 12 }, (_, i) => {
                    const monthKey = new Date(selectedYear, i).toLocaleString('default', { month: 'short' })
                    const monthTotal = categories.reduce((sum, cat) =>
                      sum + cat.expenseTypes.reduce((etSum, et) => etSum + (et.monthlyData[monthKey] || 0), 0), 0)
                    const expenseCount = categories.reduce((sum, cat) =>
                      sum + cat.expenseTypes.reduce((etSum, et) => etSum + (et.monthlyData[monthKey] ? 1 : 0), 0), 0)
                    return {
                      date: `${selectedYear}-${String(i + 1).padStart(2, '0')}-15`,
                      amount: monthTotal,
                      expenseCount,
                    }
                  })}
                  timeframe="year"
                />
              )}

              {/* Row 5: Category Breakdown */}
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
                onExportCSV={() => {}}
              />
            ) : (
              <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8">
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
