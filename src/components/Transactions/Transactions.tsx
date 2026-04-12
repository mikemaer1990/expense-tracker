import { useState } from 'react'
import { ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Navigation from '../UI/Navigation'
import HistoryContent from './HistoryContent'
import RecurringContent from './RecurringContent'

type TabView = 'history' | 'recurring'

export default function Transactions() {
  const [activeTab, setActiveTab] = useState<TabView>('history')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <ClockIcon className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            </div>
            <p className="text-gray-600">View and manage your expenses and income</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ClockIcon className="h-4 w-4" />
                <span>History</span>
              </button>
              <button
                onClick={() => setActiveTab('recurring')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
                  activeTab === 'recurring'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowPathIcon className="h-4 w-4" />
                <span>Recurring</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'history' ? (
            <HistoryContent />
          ) : (
            <RecurringContent />
          )}
        </div>
      </main>
    </div>
  )
}
