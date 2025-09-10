import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  CogIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import UserDropdown from '../UI/UserDropdown'
import Toast from '../UI/Toast'

export default function Settings() {
  const { user, signOut } = useAuth()
  const { preferences, loading, error, updatePreference } = useUserPreferences()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ show: false, message: '', type: 'info' })

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type })
  }

  const handleSettingChange = async (key: string, value: string) => {
    try {
      await updatePreference(key as keyof typeof preferences, value)
      showToast('Settings updated successfully', 'success')
    } catch (err) {
      showToast('Failed to update settings', 'error')
      console.error('Error updating preference:', err)
    }
  }

  const handleExportData = () => {
    // TODO: Implement data export functionality
    showToast('Data export feature coming soon', 'info')
  }

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion with confirmation
    if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      showToast('Account deletion feature coming soon', 'info')
    }
  }

  // Show error toast if preferences failed to load - only once when error changes
  useEffect(() => {
    if (error && typeof error === 'string' && error.trim().length > 0) {
      showToast('Failed to load preferences, using local settings', 'error')
    }
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Expense Tracker
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
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
              >
                Dashboard
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
              >
                History
              </Link>
              <Link
                to="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
              >
                Analytics
              </Link>
              <Link
                to="/expense-types"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
              >
                Expense Types
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium cursor-pointer"
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
                  className="w-full text-left bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-base font-medium cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account preferences and app settings
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <UserCircleIcon className="h-6 w-6 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Profile</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* App Preferences */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CogIcon className="h-6 w-6 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">App Preferences</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Default Currency
                    </label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => handleSettingChange('currency', e.target.value)}
                      disabled={loading}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer disabled:opacity-50"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date Format
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                      disabled={loading}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer disabled:opacity-50"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Theme
                    </label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                      disabled={loading}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-pointer disabled:opacity-50"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark (Coming Soon)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ArrowDownTrayIcon className="h-6 w-6 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Data Management</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Export Data</h4>
                      <p className="text-sm text-gray-500">
                        Download all your expense and income data
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
                    >
                      Export
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Quick Access</h4>
                        <p className="text-sm text-gray-500">
                          Manage your expense categories and types
                        </p>
                      </div>
                      <Link
                        to="/expense-types"
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
                      >
                        Manage Types
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white shadow rounded-lg border border-red-200">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <TrashIcon className="h-6 w-6 text-red-400" />
                  <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-red-700">Delete Account</h4>
                      <p className="text-sm text-red-500">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {toast.show && (
        <Toast 
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  )
}