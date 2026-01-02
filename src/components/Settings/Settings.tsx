import { useState, useEffect, useCallback } from 'react'
import {
  UserCircleIcon,
  CogIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ArrowPathIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import Navigation from '../UI/Navigation'
import Toast from '../UI/Toast'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { testSplitwiseConnection } from '../../lib/splitwise'
import type { SplitwiseConnection } from '../../lib/splitwise-types'
import { syncSplitwiseExpenses } from '../../lib/splitwise-sync'

export default function Settings() {
  const { user } = useAuth()
  const { preferences, loading, error, updatePreference } = useUserPreferences()
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ show: false, message: '', type: 'info' })

  // Splitwise integration state
  const [splitwiseConnection, setSplitwiseConnection] = useState<SplitwiseConnection | null>(null)
  const [splitwiseApiKey, setSplitwiseApiKey] = useState('')
  const [splitwiseLoading, setSplitwiseLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type })
  }

  const loadSplitwiseConnection = useCallback(async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('splitwise_connections')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error
      }

      if (data) {
        setSplitwiseConnection(data)
        setSplitwiseApiKey('') // Don't show API key for security
      }
    } catch (err) {
      console.error('Error loading Splitwise connection:', err)
    }
  }, [user?.id])

  // Load Splitwise connection on mount
  useEffect(() => {
    if (user?.id) {
      loadSplitwiseConnection()
    }
  }, [user?.id, loadSplitwiseConnection])

  const handleConnectSplitwise = async () => {
    if (!user?.id || !splitwiseApiKey.trim()) {
      showToast('Please enter your Splitwise API key', 'error')
      return
    }

    setSplitwiseLoading(true)
    try {
      // Test the API key first
      await testSplitwiseConnection(splitwiseApiKey)

      // Save to database with sync_start_date set to today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const { data, error } = await supabase
        .from('splitwise_connections')
        .upsert({
          user_id: user.id,
          api_key: splitwiseApiKey,
          is_connected: true,
          sync_start_date: today, // Only sync expenses from today forward
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      setSplitwiseConnection(data)
      setSplitwiseApiKey('') // Clear input for security
      showToast('Successfully connected to Splitwise!', 'success')
    } catch (err) {
      console.error('Error connecting to Splitwise:', err)
      showToast(
        err instanceof Error ? err.message : 'Failed to connect to Splitwise',
        'error'
      )
    } finally {
      setSplitwiseLoading(false)
    }
  }

  const handleDisconnectSplitwise = async () => {
    if (!user?.id || !splitwiseConnection) return

    if (!window.confirm('Are you sure you want to disconnect from Splitwise?')) {
      return
    }

    setSplitwiseLoading(true)
    try {
      const { error } = await supabase
        .from('splitwise_connections')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setSplitwiseConnection(null)
      setSplitwiseApiKey('')
      showToast('Disconnected from Splitwise', 'success')
    } catch (err) {
      console.error('Error disconnecting from Splitwise:', err)
      showToast('Failed to disconnect from Splitwise', 'error')
    } finally {
      setSplitwiseLoading(false)
    }
  }

  const handleSyncSplitwise = async () => {
    if (!user?.id || !splitwiseConnection) return

    setIsSyncing(true)
    try {
      // Use sync_start_date to only import expenses from connection date forward
      const syncOptions = splitwiseConnection.sync_start_date
        ? { dated_after: `${splitwiseConnection.sync_start_date}T00:00:00Z` }
        : {}; // Fallback: sync all if no start date set

      const result = await syncSplitwiseExpenses(
        user.id,
        splitwiseConnection.api_key,
        syncOptions
      )

      if (result.success) {
        const message = result.imported > 0
          ? `Successfully imported ${result.imported} expense${result.imported === 1 ? '' : 's'}!${
              result.skipped > 0 ? ` (${result.skipped} already synced)` : ''
            }`
          : result.skipped > 0
          ? `All expenses already synced (${result.skipped} found)`
          : 'No new expenses to sync'

        showToast(message, result.imported > 0 ? 'success' : 'info')

        // Reload connection to update last_sync_at
        await loadSplitwiseConnection()
      } else {
        const errorMsg = result.errors.length > 0
          ? result.errors[0]
          : 'Unknown sync error'
        showToast(`Sync failed: ${errorMsg}`, 'error')
      }
    } catch (err) {
      console.error('Error syncing with Splitwise:', err)
      showToast(
        err instanceof Error ? err.message : 'Failed to sync with Splitwise',
        'error'
      )
    } finally {
      setIsSyncing(false)
    }
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
      <Navigation />

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
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Currency
                    </label>
                    <div className="inline-flex bg-gray-100 rounded-md p-1 flex-wrap">
                      {[
                        { value: 'CAD', label: 'CAD (C$)' },
                        { value: 'USD', label: 'USD ($)' },
                        { value: 'EUR', label: 'EUR (€)' },
                        { value: 'GBP', label: 'GBP (£)' },
                        { value: 'AUD', label: 'AUD (A$)' }
                      ].map(currency => (
                        <button
                          key={currency.value}
                          onClick={() => handleSettingChange('currency', currency.value)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm font-medium rounded transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                            preferences.currency === currency.value 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
                          }`}
                        >
                          {currency.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <div className="inline-flex bg-gray-100 rounded-md p-1 flex-wrap">
                      {[
                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                      ].map(format => (
                        <button
                          key={format.value}
                          onClick={() => handleSettingChange('dateFormat', format.value)}
                          disabled={loading}
                          className={`px-3 py-1 text-sm font-medium rounded transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                            preferences.dateFormat === format.value 
                              ? 'bg-white text-gray-900 shadow-sm' 
                              : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
                          }`}
                        >
                          {format.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Theme
                    </label>
                    <div className="inline-flex bg-gray-100 rounded-md p-1">
                      <button
                        onClick={() => handleSettingChange('theme', 'light')}
                        disabled={loading}
                        className={`px-3 py-1 text-sm font-medium rounded transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                          preferences.theme === 'light' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm hover:text-gray-900'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        disabled={true}
                        className="px-3 py-1 text-sm font-medium rounded transition-all duration-200 opacity-50 cursor-not-allowed text-gray-400"
                        title="Dark mode coming soon"
                      >
                        Dark (Coming Soon)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-start justify-between py-1">
                      <div className="flex-1 mr-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Enable Expense Splitting
                        </label>
                        <p className="text-sm text-gray-500">
                          Split expenses with others (e.g., groceries with your partner)
                        </p>
                      </div>
                      <div className="flex items-center pt-1">
                        <button
                          type="button"
                          onClick={() => handleSettingChange('enableExpenseSplitting', (!preferences.enableExpenseSplitting).toString())}
                          disabled={loading}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                            preferences.enableExpenseSplitting ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              preferences.enableExpenseSplitting ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Splitwise Integration */}
            <div className="bg-white shadow rounded-lg border border-green-200">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <LinkIcon className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">Splitwise Integration</h3>
                </div>
                <div className="space-y-4">
                  {/* Connection Status */}
                  {splitwiseConnection && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Connected to Splitwise
                          </p>
                          {splitwiseConnection.last_sync_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Last synced: {new Date(splitwiseConnection.last_sync_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={handleDisconnectSplitwise}
                          disabled={splitwiseLoading}
                          className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}

                  {/* API Key Input (only show if not connected) */}
                  {!splitwiseConnection && (
                    <div>
                      <label htmlFor="splitwise-api-key" className="block text-sm font-medium text-gray-700 mb-1">
                        Splitwise API Key
                      </label>
                      <form onSubmit={(e) => { e.preventDefault(); handleConnectSplitwise(); }} className="flex space-x-2">
                        <input
                          id="splitwise-api-key"
                          type="password"
                          value={splitwiseApiKey}
                          onChange={(e) => setSplitwiseApiKey(e.target.value)}
                          placeholder="Enter your API key"
                          autoComplete="off"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <button
                          type="submit"
                          disabled={splitwiseLoading || !splitwiseApiKey.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {splitwiseLoading ? 'Connecting...' : 'Connect'}
                        </button>
                      </form>
                      <p className="mt-1 text-xs text-gray-500">
                        Get your API key from{' '}
                        <a
                          href="https://secure.splitwise.com/apps"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Splitwise Settings
                        </a>
                      </p>
                    </div>
                  )}

                  {/* Sync Button (only show if connected) */}
                  {splitwiseConnection && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Sync Expenses</h4>
                          <p className="text-sm text-gray-500">
                            Import new expenses from Splitwise to Loggy
                          </p>
                          {splitwiseConnection.sync_start_date && (
                            <p className="text-xs text-gray-400 mt-1">
                              Syncing expenses from {new Date(splitwiseConnection.sync_start_date).toLocaleDateString()} onward
                            </p>
                          )}
                        </div>
                        <button
                          onClick={handleSyncSplitwise}
                          disabled={isSyncing}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <ArrowPathIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                        </button>
                      </div>
                    </div>
                  )}
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