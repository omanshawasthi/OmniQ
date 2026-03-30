import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useSocket } from '../../hooks/useSocket'
import { useQuery } from '@tanstack/react-query'
import { 
  Clock, 
  Users, 
  Building, 
  Monitor, 
  TrendingUp,
  Volume2,
  Wifi,
  WifiOff
} from 'lucide-react'
import { tokenAPI } from '../../utils/api'

const EnhancedPublicDisplay = () => {
  const { branchId } = useParams()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { isConnected } = useSocket()

  // Get branch and queue data
  const { data: branchData, isLoading: branchLoading } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => apiClient.branches.getById(branchId),
    refetchInterval: 60000 // Refresh every minute
  })

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['queueStatus', branchId],
    queryFn: () => apiClient.queue.getStatus(branchId),
    refetchInterval: isConnected ? false : 10000 // Don't refresh if socket is connected
  })

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handleKeyPress = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  // Listen for real-time updates
  useSocketEvent('publicDisplayUpdate', (data) => {
    if (data.branchId === branchId) {
      // Queue data will be updated automatically by the query
    }
  })

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getWaitTimeColor = (minutes) => {
    if (minutes < 10) return 'text-green-600'
    if (minutes < 20) return 'text-yellow-600'
    if (minutes < 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const getWaitTimeBg = (minutes) => {
    if (minutes < 10) return 'bg-green-100'
    if (minutes < 20) return 'bg-yellow-100'
    if (minutes < 30) return 'bg-orange-100'
    return 'bg-red-100'
  }

  if (branchLoading || queueLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading display...</p>
        </div>
      </div>
    )
  }

  const queueStatus = queueData?.data?.queueStatus
  const branch = branchData?.data?.branch

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V-4h4V2h-4zM6 34v-4H4v4H2v-2H4v-4H6v4zm0-30V0h4v4h2V-4H4V2H6v4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black bg-opacity-30 backdrop-blur-sm border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Building className="h-10 w-10 mr-4" />
              <div>
                <h1 className="text-3xl font-bold">Queueless</h1>
                <p className="text-lg opacity-90">{branch?.name || 'Loading...'}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">{formatDate(currentTime)}</p>
              <p className="text-3xl font-bold">{formatTime(currentTime)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-medium">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Toggle */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen()
            } else {
              document.exitFullscreen()
            }
          }}
          className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full hover:bg-opacity-30 transition-colors"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Currently Serving */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">Now Serving</h2>
            <div className="w-32 h-1 bg-white mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {queueStatus?.serving?.slice(0, 6).map((token, index) => (
              <div 
                key={token._id} 
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white border-opacity-20 transform transition-all duration-300 hover:scale-105"
                style={{
                  animation: `fadeInUp ${0.3 + index * 0.1}s ease-out`
                }}
              >
                <div className="mb-6">
                  <Monitor className="h-16 w-16 mx-auto mb-4 text-white opacity-80" />
                  <p className="text-xl opacity-90 mb-2">Counter {token.counterId?.name || index + 1}</p>
                </div>
                <div className="text-6xl font-bold mb-3">{token.tokenNumber}</div>
                <p className="text-lg opacity-90">
                  {token.userId?.name || token.metadata?.walkInName || 'Customer'}
                </p>
                <div className="mt-4 flex justify-center">
                  <span className="px-4 py-2 bg-green-500 bg-opacity-20 border border-green-400 border-opacity-30 rounded-full text-sm">
                    Serving
                  </span>
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {[...Array(Math.max(0, 6 - (queueStatus?.serving?.length || 0)))].map((_, index) => (
              <div 
                key={`empty-${index}`}
                className="bg-white bg-opacity-5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white border-opacity-10"
              >
                <Monitor className="h-16 w-16 mx-auto mb-4 text-white opacity-30" />
                <p className="text-xl opacity-50 mb-2">Counter {queueStatus?.serving?.length + index + 1}</p>
                <div className="text-4xl font-bold mb-3 opacity-30">---</div>
                <p className="text-lg opacity-30">Available</p>
              </div>
            ))}
          </div>
        </div>

        {/* Next in Queue */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Next in Queue</h2>
            <div className="w-32 h-1 bg-white mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {queueStatus?.waiting?.slice(0, 8).map((token, index) => (
              <div 
                key={token._id}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center border border-white border-opacity-20 transform transition-all duration-300 hover:scale-105"
                style={{
                  animation: `fadeInUp ${0.4 + index * 0.1}s ease-out`
                }}
              >
                <div className="text-3xl font-bold mb-2">{token.tokenNumber}</div>
                <p className="text-lg opacity-90">
                  {token.userId?.name || token.metadata?.walkInName || 'Customer'}
                </p>
                <div className="mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWaitTimeBg(token.estimatedWaitTime || 0)}`}>
                    <span className={getWaitTimeColor(token.estimatedWaitTime || 0)}>
                      Wait: {Math.round(token.estimatedWaitTime || 0)} min
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Queue Statistics */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center border border-white border-opacity-20">
            <div className="flex items-center justify-center mb-4">
              <Users className="h-12 w-12 text-white opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-2">{queueStatus?.statistics?.totalWaiting || 0}</div>
            <h3 className="text-xl font-semibold mb-1">Waiting</h3>
            <p className="text-sm opacity-90">Currently in queue</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center border border-white border-opacity-20">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-12 w-12 text-white opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-2">
              {Math.round(queueStatus?.statistics?.averageWaitTime || 0)}
            </div>
            <h3 className="text-xl font-semibold mb-1">Avg Wait Time</h3>
            <p className="text-sm opacity-90">Minutes</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center border border-white border-opacity-20">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-12 w-12 text-white opacity-80" />
            </div>
            <div className="text-4xl font-bold mb-2">{queueStatus?.statistics?.totalServing || 0}</div>
            <h3 className="text-xl font-semibold mb-1">Active Counters</h3>
            <p className="text-sm opacity-90">Out of {queueStatus?.counters?.length || 0}</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-black bg-opacity-30 backdrop-blur-sm border-t border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium mb-1">Queueless Public Display</p>
              <p className="text-sm opacity-90">Real-time queue management system</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Press F for fullscreen</p>
              <p className="text-xs opacity-75">Last updated: {formatTime(currentTime)}</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default EnhancedPublicDisplay
