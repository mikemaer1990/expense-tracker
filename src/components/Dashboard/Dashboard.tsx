import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import AddExpense from "../Expenses/AddExpense";
import AddIncome from "../Income/AddIncome";
import IconRenderer from "../UI/IconRenderer";
import UserDropdown from "../UI/UserDropdown";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../utils/currency";
import { getYearStartDate, getYearEndDate, getAvailableYears } from "../../utils/date";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { preferences } = useUserPreferences();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      // Get total expenses for selected year
      const { data: allExpenses, error: totalError } = await supabase
        .from("expenses")
        .select("amount, date")
        .eq("user_id", user!.id)
        .gte("date", getYearStartDate(selectedYear))
        .lte("date", getYearEndDate(selectedYear));

      if (totalError) throw totalError;

      const total =
        allExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      setTotalExpenses(total);
      setExpenseCount(allExpenses?.length || 0);

      // Extract available years from all expenses
      const { data: allExpensesForYears, error: yearsError } = await supabase
        .from("expenses")
        .select("date")
        .eq("user_id", user!.id);

      if (!yearsError && allExpensesForYears) {
        const dates = allExpensesForYears.map(e => e.date);
        setAvailableYears(getAvailableYears(dates));
      }

      // Get current month expenses
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
        .toISOString()
        .split("T")[0];
      const firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1)
        .toISOString()
        .split("T")[0];

      const { data: monthlyData, error: monthlyError } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user!.id)
        .gte("date", firstDayOfMonth)
        .lt("date", firstDayOfNextMonth);

      if (monthlyError) throw monthlyError;

      const monthlyTotal =
        monthlyData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      setMonthlyExpenses(monthlyTotal);

      // Get recent expenses with category and expense type info
      const { data: recentData, error: recentError } = await supabase
        .from("expenses")
        .select(
          `
          id,
          amount,
          description,
          date,
          is_recurring,
          is_split,
          original_amount,
          split_with,
          expense_types (
            name,
            icon_name,
            categories (
              name,
              color
            )
          )
        `
        )
        .eq("user_id", user!.id)
        .gte("date", getYearStartDate(selectedYear))
        .lte("date", getYearEndDate(selectedYear))
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentExpenses(recentData || []);

      // Get total income for selected year
      const { data: incomeData, error: incomeError } = await supabase
        .from("income")
        .select("amount")
        .eq("user_id", user!.id)
        .gte("date", getYearStartDate(selectedYear))
        .lte("date", getYearEndDate(selectedYear));

      if (incomeError) throw incomeError;

      const totalIncomeAmount =
        incomeData?.reduce((sum, income) => sum + income.amount, 0) || 0;
      setTotalIncome(totalIncomeAmount);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }, [user, selectedYear]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  // Auto-select most recent year if current year has no data
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleExpenseAdded = () => {
    loadDashboardData(); // Refresh the data
  };

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
                  className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
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
                      mobileMenuOpen
                        ? "opacity-0 rotate-90"
                        : "opacity-100 rotate-0"
                    }`}
                  />
                  <XMarkIcon
                    className={`absolute h-6 w-6 transition-all duration-300 ease-in-out ${
                      mobileMenuOpen
                        ? "opacity-100 rotate-0"
                        : "opacity-0 -rotate-90"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div
            className={`lg:hidden border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
              mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
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
        <div className="px-4 pb-6 sm:px-0">
          {/* Page Header with Year Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Overview of your finances</p>
              {availableYears.length > 1 && (
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
              )}
            </div>
          </div>

          {/* Add Expense/Income Buttons - Mobile Optimized */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {/* Add Expense Button */}
              <button
                onClick={() => setShowAddExpense(true)}
                className="group w-full flex items-center justify-center space-x-2 md:space-x-3 bg-white border border-gray-200 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden relative hover:bg-gradient-to-br hover:from-red-50/0 hover:to-red-50/100"
              >
                <div className="relative flex items-center space-x-2 md:space-x-3">
                  <div className="rounded-full bg-red-100 p-2 md:p-3 group-hover:bg-red-200 transition-all duration-300">
                    <MinusIcon className="h-4 w-4 md:h-6 md:w-6 text-red-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex flex-col items-start md:items-center">
                    <span className="font-medium text-gray-900 text-sm md:text-base group-hover:text-red-800 transition-all duration-300">Add Expense</span>
                    <span className="hidden md:block text-xs md:text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">Record a purchase</span>
                  </div>
                </div>
              </button>

              {/* Add Income Button */}
              <button
                onClick={() => setShowAddIncome(true)}
                className="group w-full flex items-center justify-center space-x-2 md:space-x-3 bg-white border border-gray-200 rounded-lg p-3 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden relative hover:bg-gradient-to-br hover:from-green-50/0 hover:to-green-50/100"
              >
                <div className="relative flex items-center space-x-2 md:space-x-3">
                  <div className="rounded-full bg-green-100 p-2 md:p-3 group-hover:bg-green-200 transition-all duration-300">
                    <PlusIcon className="h-4 w-4 md:h-6 md:w-6 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex flex-col items-start md:items-center">
                    <span className="font-medium text-gray-900 text-sm md:text-base group-hover:text-green-800 transition-all duration-300">Add Income</span>
                    <span className="hidden md:block text-xs md:text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">Record earnings</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                      <CreditCardIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Expenses
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
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
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <CalendarDaysIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        This Month
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(monthlyExpenses, preferences.currency)}
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
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <BanknotesIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Income
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
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
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Transactions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {expenseCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Expenses
              </h3>
              <div className="mt-5">
                {recentExpenses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No expenses recorded yet. Start by adding your first
                    expense!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 min-w-0"
                      >
                        {/* Top Row: Icon + Name + Amount */}
                        <div className="bg-blue-50/30 px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <IconRenderer
                                iconName={expense.expense_types?.icon_name || "QuestionMarkCircleIcon"}
                                size="md"
                                className="text-gray-600 flex-shrink-0"
                              />
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-medium text-gray-900 truncate">
                                  {expense.expense_types?.name || "Unknown"}
                                </span>
                                {expense.is_recurring && (
                                  <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                                    🔄 Recurring
                                  </span>
                                )}
                                {expense.is_split && (
                                  <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                                    👥 Split
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-semibold text-gray-900">
                                {formatCurrency(expense.amount || 0, preferences.currency)}
                              </div>
                              {expense.is_split && expense.original_amount && (
                                <div className="text-xs text-gray-500">
                                  of {formatCurrency(expense.original_amount, preferences.currency)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Details */}
                        <div className="px-4 py-3 bg-gray-50/50">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <CalendarDaysIcon className="h-4 w-4" />
                                <span>{expense.date}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <ClipboardDocumentListIcon className="h-4 w-4" />
                                <span>{expense.expense_types?.categories?.name || "Unknown Category"}</span>
                              </span>
                            </div>
                          </div>
                          {expense.description && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="text-gray-500">Note:</span> {expense.description}
                            </div>
                          )}
                          {expense.is_split && expense.split_with && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="text-gray-500">Split with:</span> {expense.split_with}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAddExpense && (
        <AddExpense
          onClose={() => setShowAddExpense(false)}
          onSuccess={handleExpenseAdded}
        />
      )}

      {showAddIncome && (
        <AddIncome
          onClose={() => setShowAddIncome(false)}
          onSuccess={handleExpenseAdded}
        />
      )}
    </div>
  );
}
