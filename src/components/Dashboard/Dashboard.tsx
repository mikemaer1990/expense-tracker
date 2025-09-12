import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bars3Icon, XMarkIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import AddExpense from "../Expenses/AddExpense";
import AddIncome from "../Income/AddIncome";
import IconRenderer from "../UI/IconRenderer";
import UserDropdown from "../UI/UserDropdown";
import { supabase } from "../../lib/supabase";
import { formatCurrency } from "../../utils/currency";

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

  const loadDashboardData = useCallback(async () => {
    try {
      // Get total expenses
      const { data: allExpenses, error: totalError } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user!.id);

      if (totalError) throw totalError;

      const total =
        allExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      setTotalExpenses(total);
      setExpenseCount(allExpenses?.length || 0);

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
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentExpenses(recentData || []);

      // Get total income
      const { data: incomeData, error: incomeError } = await supabase
        .from("income")
        .select("amount")
        .eq("user_id", user!.id);

      if (incomeError) throw incomeError;

      const totalIncomeAmount =
        incomeData?.reduce((sum, income) => sum + income.amount, 0) || 0;
      setTotalIncome(totalIncomeAmount);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

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
              <h1 className="text-xl font-semibold text-gray-900">
                Spendlyzer
              </h1>
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
            className={`md:hidden border-t border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
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
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">$</span>
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
                    <div className="w-8 h-8 bg-success rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">↗</span>
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
                    <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">+</span>
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
                    <div className="w-8 h-8 bg-gray-400 rounded-md flex items-center justify-center">
                      <span className="text-white font-semibold">#</span>
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

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
              <div className="mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="flex items-center justify-center px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-md border border-red-200 hover:border-red-300 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <MinusIcon className="w-4 h-4 mr-2" />
                    Add Expense
                  </button>
                  <button
                    onClick={() => setShowAddIncome(true)}
                    className="flex items-center justify-center px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 rounded-md border border-green-200 hover:border-green-300 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Income
                  </button>
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
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div>
                            <IconRenderer
                              iconName={expense.expense_types?.icon_name || 'QuestionMarkCircleIcon'}
                              size="md"
                              className="text-gray-600"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <span>{expense.expense_types?.name || "Unknown"}</span>
                              {expense.is_recurring && (
                                <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                  🔄 Recurring
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {expense.expense_types?.categories?.name ||
                                "Unknown Category"}{" "}
                              • {expense.date}
                            </p>
                            {expense.description && (
                              <p className="text-xs text-gray-400 mt-1">
                                {expense.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(expense.amount || 0, preferences.currency)}
                          </p>
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
