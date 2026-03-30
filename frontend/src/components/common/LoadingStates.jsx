import React from 'react'
import { Loader2 } from 'lucide-react'

// Full page loading spinner
export const FullPageLoader = ({ message = 'Loading...', size = 'large' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className={`animate-spin text-primary-600 mx-auto mb-4 ${sizeClasses[size]}`} />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Card loading skeleton
export const CardSkeleton = ({ lines = 3, showAvatar = false, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="animate-pulse">
        {showAvatar && (
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {[...Array(lines)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className={`h-4 bg-gray-200 rounded ${index === 0 ? 'w-3/4' : index === lines - 1 ? 'w-1/2' : 'w-full'}`}></div>
              {index === 0 && <div className="h-3 bg-gray-200 rounded w-full"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Table skeleton loader
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white shadow-sm rounded-lg border overflow-hidden ${className}`}>
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b last:border-b-0">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {[...Array(columns)].map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// List skeleton loader
export const ListSkeleton = ({ items = 5, showAvatar = false, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(items)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg border p-4 animate-pulse">
          <div className="flex items-center">
            {showAvatar && (
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
            )}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Button loading state
export const LoadingButton = ({ children, loading, disabled, className = '', ...props }) => {
  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="animate-spin h-4 w-4 mr-2" />
      )}
      {children}
    </button>
  )
}

// Inline loading spinner
export const InlineLoader = ({ size = 'small', message, className = '' }) => {
  const sizeClasses = {
    tiny: 'h-3 w-3',
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  }

  return (
    <div className={`flex items-center ${className}`}>
      <Loader2 className={`animate-spin text-primary-600 ${sizeClasses[size]}`} />
      {message && <span className="ml-2 text-sm text-gray-600">{message}</span>}
    </div>
  )
}

// Progress bar loader
export const ProgressBar = ({ progress = 0, showPercentage = true, className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-primary-700">
          Progress
        </span>
        {showPercentage && (
          <span className="text-xs font-medium text-primary-700">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
    </div>
  )
}

// Staggered loading animation for multiple items
export const StaggeredLoader = ({ items = [], renderItem, delay = 100 }) => {
  const [visibleItems, setVisibleItems] = React.useState(new Set())

  React.useEffect(() => {
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => new Set(prev).add(index))
      }, index * delay)
    })
  }, [items, delay])

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className={`transition-all duration-300 ${
            visibleItems.has(index)
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          {visibleItems.has(index) ? renderItem(item, index) : (
            <div className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Pulse loader for real-time updates
export const PulseLoader = ({ isActive = true, children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        </div>
      )}
    </div>
  )
}

// Skeleton for dashboard stats
export const DashboardStatsSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-12 h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Form skeleton loader
export const FormSkeleton = ({ fields = 3, showButton = true }) => {
  return (
    <div className="bg-white shadow-sm rounded-lg border p-6 animate-pulse">
      <div className="space-y-6">
        {[...Array(fields)].map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
        
        {showButton && (
          <div className="flex justify-end space-x-3">
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
        )}
      </div>
    </div>
  )
}

// Custom hook for loading states
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState)
  const [error, setError] = React.useState(null)

  const startLoading = React.useCallback(() => {
    setIsLoading(true)
    setError(null)
  }, [])

  const stopLoading = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const setLoadingError = React.useCallback((error) => {
    setError(error)
    setIsLoading(false)
  }, [])

  const reset = React.useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset
  }
}

// Loading context for global loading state
export const LoadingContext = React.createContext({
  isLoading: false,
  setLoading: () => {}
})

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = React.useState({})

  const setLoading = React.useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  const value = {
    isLoading: isAnyLoading,
    setLoadingStates,
    setLoading
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isAnyLoading && (
        <div className="fixed top-0 right-0 p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border p-3 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600 mr-2" />
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export default FullPageLoader
