import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalProps {
  title: string
  onClose: () => void
  accentColor?: 'blue' | 'green' | 'purple' | 'orange'
  children: ReactNode
  isLoading?: boolean
  loadingText?: string
  showEmptyState?: boolean
  emptyStateMessage?: string
  desktopWidth?: 'default' | 'comfortable' | 'wide' // default=384px, comfortable=800px, wide=1000px
}

const accentColorClasses = {
  blue: {
    gradient: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500',
    headerBg: 'bg-gradient-to-br from-blue-50 to-indigo-50'
  },
  green: {
    gradient: 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500',
    headerBg: 'bg-gradient-to-br from-green-50 to-emerald-50'
  },
  purple: {
    gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500',
    headerBg: 'bg-gradient-to-br from-purple-50 to-pink-50'
  },
  orange: {
    gradient: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500',
    headerBg: 'bg-gradient-to-br from-orange-50 to-amber-50'
  }
}

const desktopWidthClasses = {
  default: 'md:w-96',
  comfortable: 'md:w-[800px]',
  wide: 'md:w-[1000px]'
}

export default function Modal({
  title,
  onClose,
  accentColor = 'blue',
  children,
  isLoading = false,
  loadingText = 'Loading...',
  showEmptyState = false,
  emptyStateMessage = 'No data available',
  desktopWidth = 'default'
}: ModalProps) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const colors = accentColorClasses[accentColor]

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className={`relative mx-auto border shadow-lg bg-white
                        min-h-screen w-full p-4 pt-8 pb-8 rounded-none
                        md:top-20 ${desktopWidthClasses[desktopWidth]} md:min-h-0 md:p-5 md:rounded-md`}>
          <div className="mt-3 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">{loadingText}</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (showEmptyState) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className={`relative mx-auto border shadow-lg bg-white
                        min-h-screen w-full p-4 pt-8 pb-8 rounded-none
                        md:top-20 ${desktopWidthClasses[desktopWidth]} md:min-h-0 md:p-5 md:rounded-md`}>
          <div className="mt-3 text-center">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{emptyStateMessage}</p>
            <div className="mt-4">
              <button
                onClick={onClose}
                className="px-4 py-3 md:py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 min-h-[48px] font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={`relative mx-auto border shadow-lg bg-white
                      /* Mobile: Full screen */
                      min-h-screen w-full p-0 rounded-none
                      /* Desktop: Centered modal */
                      md:top-20 ${desktopWidthClasses[desktopWidth]} md:max-h-[80vh] md:min-h-0 md:rounded-md md:overflow-y-auto`}>
        {/* Close button - top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full transition-colors duration-200 z-20"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Modal Header */}
        <div className="relative">
          {/* Gradient accent bar */}
          <div className={`h-1 ${colors.gradient}`}></div>

          <div className={`${colors.headerBg} px-6 py-6 border-b border-gray-100`}>
            <h3 className="text-xl font-bold text-gray-900 text-center">
              {title}
            </h3>
          </div>
        </div>

        {/* Modal Content */}
        {children}
      </div>
    </div>
  )
}
