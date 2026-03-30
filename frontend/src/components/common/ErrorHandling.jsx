import React from 'react'
import { AlertCircle, RefreshCw, X } from 'lucide-react'

// Error boundary component for catching React errors
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console or error reporting service
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 text-center mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Try Again
              </button>
            </div>
            {import.meta.env.DEV && (
              <details className="mt-6 p-4 bg-gray-100 rounded-md">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Error alert component
export const ErrorAlert = ({ error, onDismiss, onRetry, className = '' }) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {typeof error === 'string' ? error : error?.message || 'An error occurred'}
          </h3>
          {error?.details && (
            <p className="mt-1 text-sm text-red-700">{error.details}</p>
          )}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 transition-colors mr-2"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Warning alert component
export const WarningAlert = ({ message, onDismiss, className = '' }) => {
  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">{message}</h3>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Success alert component
export const SuccessAlert = ({ message, onDismiss, className = '' }) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-green-800">{message}</h3>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Info alert component
export const InfoAlert = ({ message, onDismiss, className = '' }) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">{message}</h3>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 text-blue-500 hover:bg-blue-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 404 Error component
export const NotFoundError = ({ message = 'Page not found', onGoHome }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {message}
          </h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onGoHome || (() => window.location.href = '/')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Go Home
          </button>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

// Network error component
export const NetworkError = ({ onRetry }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-orange-100 rounded-full mb-4">
            <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-6">
            Unable to connect to the server. Please check your internet connection and try again.
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  )
}

// Custom error hook for handling API errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null)

  const handleError = React.useCallback((error) => {
    console.error('Error handled by hook:', error)
    
    // Normalize error object
    const normalizedError = {
      message: error?.response?.data?.message || error?.message || 'An unexpected error occurred',
      status: error?.response?.status || error?.status,
      details: error?.response?.data?.details || error?.details,
      code: error?.code
    }
    
    setError(normalizedError)
    
    // Auto-dismiss after 5 seconds for non-critical errors
    if (normalizedError.status < 500) {
      setTimeout(() => setError(null), 5000)
    }
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}

// Retry wrapper component
export const RetryWrapper = ({ 
  children, 
  error, 
  onRetry, 
  maxRetries = 3, 
  retryDelay = 1000 
}) => {
  const [retryCount, setRetryCount] = React.useState(0)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleRetry = React.useCallback(async () => {
    if (retryCount >= maxRetries) return

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryDelay))

    try {
      await onRetry()
      setRetryCount(0) // Reset on success
    } catch (err) {
      // Error will be handled by the calling component
      console.error('Retry failed:', err)
    } finally {
      setIsRetrying(false)
    }
  }, [retryCount, maxRetries, retryDelay, onRetry])

  if (error && retryCount >= maxRetries) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed after {maxRetries} attempts
        </h3>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={() => setRetryCount(0)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Reset and Try Again
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorAlert 
        error={error} 
        onRetry={handleRetry}
        onDismiss={() => setRetryCount(0)}
      />
    )
  }

  return (
    <>
      {isRetrying && (
        <div className="text-center py-4">
          <RefreshCw className="h-6 w-6 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Retrying... (Attempt {retryCount + 1}/{maxRetries})</p>
        </div>
      )}
      {children}
    </>
  )
}

export default ErrorBoundary
