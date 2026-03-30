import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, CheckCircle, AlertCircle, RefreshCw, X, QrCode } from 'lucide-react'
import { tokenAPI } from '../../utils/api'

const ActiveTokenPage = () => {
  const [activeToken, setActiveToken] = useState(null)
  const [queueStatus, setQueueStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    loadActiveToken()
    // Set up polling for real-time updates
    const interval = setInterval(loadActiveToken, 15000) // Poll every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const loadActiveToken = async () => {
    try {
      // Load user's active tokens
      const response = await tokenAPI.getMyTokens({ status: 'waiting,serving,held' })
      const tokens = response.data.data.tokens || []
      
      if (tokens.length > 0) {
        const token = tokens[0] // Get the most recent active token
        setActiveToken(token)
        
        // Load queue status for this token's branch/department
        if (token.branchId && token.departmentId) {
          const queueResponse = await tokenAPI.getQueueStatus(
            token.branchId._id || token.branchId,
            token.departmentId._id || token.departmentId
          )
          setQueueStatus(queueResponse.data.data.queueStatus)
        }
      } else {
        setActiveToken(null)
        setQueueStatus(null)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading active token:', error)
      setError('Failed to load active token')
      setIsLoading(false)
    }
  }

  const handleCancelToken = async () => {
    if (!activeToken) return
    
    try {
      await tokenAPI.cancelToken(activeToken._id)
      setActiveToken(null)
      setQueueStatus(null)
    } catch (error) {
      console.error('Error cancelling token:', error)
      setError(error.response?.data?.message || 'Failed to cancel token')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-6 w-6 text-blue-500" />
      case 'serving':
        return <RefreshCw className="h-6 w-6 text-orange-500 animate-spin" />
      case 'held':
        return <AlertCircle className="h-6 w-6 text-yellow-500" />
      default:
        return <Clock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      waiting: 'bg-blue-100 text-blue-800',
      serving: 'bg-orange-100 text-orange-800',
      held: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getQueuePosition = () => {
    if (!queueStatus || !activeToken) return 0
    
    const waitingTokens = queueStatus.waiting || []
    return waitingTokens.findIndex(token => token._id === activeToken._id) + 1
  }

  const getCurrentServingToken = () => {
    if (!queueStatus || !queueStatus.serving || queueStatus.serving.length === 0) {
      return null
    }
    return queueStatus.serving[0]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/user" className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Active Token</h1>
            </div>
            <button
              onClick={loadActiveToken}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {activeToken ? (
          <div className="space-y-6">
            {/* Token Card */}
            <div className="bg-white shadow-sm rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getStatusIcon(activeToken.status)}
                  <h2 className="ml-3 text-2xl font-bold text-gray-900">
                    {activeToken.tokenNumber}
                  </h2>
                  {getStatusBadge(activeToken.status)}
                </div>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                >
                  <QrCode className="h-5 w-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Branch</p>
                  <p className="font-medium text-gray-900">
                    {activeToken.branchId?.name || 'Unknown Branch'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">
                    {activeToken.departmentId?.name || 'Unknown Department'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Booked Time</p>
                  <p className="font-medium text-gray-900">
                    {new Date(activeToken.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Wait</p>
                  <p className="font-medium text-gray-900">
                    {activeToken.estimatedWaitTime ? 
                      `~${activeToken.estimatedWaitTime} minutes` : 
                      'Calculating...'
                    }
                  </p>
                </div>
              </div>

              {activeToken.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium text-gray-900">{activeToken.notes}</p>
                </div>
              )}

              {/* Cancel Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCancelToken}
                  className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel Token
                </button>
              </div>
            </div>

            {/* QR Code Modal */}
            {showQR && (
              <div className="bg-white shadow-sm rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Token QR Code</h3>
                  <button
                    onClick={() => setShowQR(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-center">
                  {activeToken.qrCode ? (
                    <img 
                      src={activeToken.qrCode} 
                      alt="Token QR Code" 
                      className="mx-auto max-w-xs"
                    />
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-8">
                      <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">QR Code not available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Queue Status */}
            {queueStatus && (
              <div className="bg-white shadow-sm rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Queue Status</h3>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Your Position</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {getQueuePosition()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">People Ahead</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Math.max(0, getQueuePosition() - 1)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Waiting</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {queueStatus.statistics?.totalWaiting || 0}
                    </p>
                  </div>
                </div>

                {/* Currently Serving */}
                {getCurrentServingToken() && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">Currently Serving</p>
                    <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <RefreshCw className="h-5 w-5 text-orange-500 mr-2 animate-spin" />
                        <span className="font-medium text-orange-900">
                          {getCurrentServingToken().tokenNumber}
                        </span>
                      </div>
                      <span className="text-sm text-orange-700">
                        Counter {getCurrentServingToken().counterId?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* No Active Token */
          <div className="bg-white shadow-sm rounded-lg border p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Token</h3>
            <p className="text-gray-600 mb-4">You don't have any active tokens at the moment.</p>
            <div className="space-y-3">
              <Link
                to="/user/book-token"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Book a Token
              </Link>
              <Link
                to="/user/history"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View History
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ActiveTokenPage
