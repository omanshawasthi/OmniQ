import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, Users, AlertTriangle, CheckCircle, Hourglass, QrCode } from 'lucide-react'
import { useQueueStatus } from '../../hooks/useQueue'
import { useSocket } from '../../hooks/useSocket'
import { tokenAPI } from '../../utils/api'

const QueueStatus = () => {
  const { branchId, departmentId } = useParams()
  const { isConnected } = useSocket()
  const [userToken, setUserToken] = useState(null)

  // Get queue status
  const { queueStatus, isLoading, error } = useQueueStatus(branchId, departmentId)

  // Get user's active tokens
  const { data: userTokens } = useQuery({
    queryKey: ['myTokens', { status: 'waiting' }],
    queryFn: () => apiClient.tokens.getMyTokens({ status: 'waiting' })
  })

  // Find user's token in current queue
  useEffect(() => {
    if (userTokens?.data?.tokens && queueStatus) {
      const userTokenInQueue = userTokens.data.tokens.find(
        token => token.branchId._id === branchId && 
                (!departmentId || token.departmentId._id === departmentId)
      )
      setUserToken(userTokenInQueue)
    }
  }, [userTokens, queueStatus, branchId, departmentId])

  // Listen for real-time updates
  useSocketEvent('queueUpdated', (data) => {
    // Queue status will be updated automatically by the hook
  })

  useSocketEvent('tokenStatusChanged', (data) => {
    if (userToken && data.token._id === userToken._id) {
      setUserToken(data.token)
    }
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting':
        return <Hourglass className="h-5 w-5 text-yellow-500" />
      case 'serving':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'missed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'text-yellow-600 bg-yellow-50'
      case 'serving':
        return 'text-blue-600 bg-blue-50'
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'missed':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <div className="text-red-700">
              <p className="font-medium">Error loading queue status</p>
              <p className="text-sm">Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Queue Status</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <p className="text-gray-600">
          Real-time queue information for {queueStatus?.waiting?.[0]?.branchId?.name || 'Selected Branch'}
        </p>
      </div>

      {/* User's Token Status */}
      {userToken && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary-900">Your Token</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(userToken.status)}`}>
              {userToken.status.charAt(0).toUpperCase() + userToken.status.slice(1)}
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center mb-4">
                {getStatusIcon(userToken.status)}
                <span className="ml-2 text-2xl font-bold text-primary-900">
                  {userToken.tokenNumber}
                </span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{userToken.departmentId?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scheduled Time</p>
                  <p className="font-medium">
                    {new Date(userToken.scheduledTime).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Queue Position</p>
                  <p className="text-2xl font-bold text-primary-900">
                    {queueStatus?.waiting?.findIndex(t => t._id === userToken._id) + 1 || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Wait Time</p>
                  <p className="text-xl font-semibold text-primary-900">
                    {userToken.estimatedWaitTime ? `${Math.round(userToken.estimatedWaitTime)} min` : 'Calculating...'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recommended Arrival</p>
                  <p className="font-medium">
                    {userToken.estimatedWaitTime ? 
                      new Date(Date.now() + (userToken.estimatedWaitTime * 60 * 1000) - (10 * 60 * 1000)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) :
                      'Calculating...'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {userToken.qrCode && (
            <div className="mt-4 pt-4 border-t border-primary-200">
              <div className="flex items-center">
                <QrCode className="h-5 w-5 text-primary-600 mr-2" />
                <span className="text-sm font-medium text-primary-900">
                  Show this QR code at the counter
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Current Queue */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Current Queue</h2>
          <p className="text-sm text-gray-600 mt-1">
            {queueStatus?.statistics?.totalWaiting || 0} people waiting
          </p>
        </div>
        
        <div className="p-6">
          {/* Currently Serving */}
          {queueStatus?.serving && queueStatus.serving.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Now Serving</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {queueStatus.serving.map((token) => (
                  <div key={token._id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-green-900">
                        {token.tokenNumber}
                      </span>
                      {getStatusIcon(token.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Counter: {token.counterId?.name || 'Assigned'}
                    </p>
                    {token.userId?.name && (
                      <p className="text-sm text-gray-600">
                        {token.userId.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waiting Queue */}
          {queueStatus?.waiting && queueStatus.waiting.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Waiting Queue</h3>
              <div className="space-y-2">
                {queueStatus.waiting.slice(0, 10).map((token, index) => (
                  <div
                    key={token._id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      userToken?._id === token._id 
                        ? 'bg-primary-50 border border-primary-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500 w-8">
                        #{index + 1}
                      </span>
                      <span className="font-medium">
                        {token.tokenNumber}
                      </span>
                      {token.userId?.name && (
                        <span className="text-sm text-gray-600">
                          {token.userId.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {token.estimatedWaitTime ? `${Math.round(token.estimatedWaitTime)} min` : 'Calculating...'}
                      </span>
                      {getStatusIcon(token.status)}
                    </div>
                  </div>
                ))}
              </div>
              
              {queueStatus.waiting.length > 10 && (
                <p className="text-sm text-gray-500 mt-3 text-center">
                  And {queueStatus.waiting.length - 10} more people...
                </p>
              )}
            </div>
          )}

          {/* Empty Queue */}
          {(!queueStatus?.waiting || queueStatus.waiting.length === 0) && 
           (!queueStatus?.serving || queueStatus.serving.length === 0) && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No one is currently in the queue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QueueStatus
