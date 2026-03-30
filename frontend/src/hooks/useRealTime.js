import { useEffect, useRef, useCallback } from 'react'
import { useState } from 'react'
import realTimeService from '../services/realTimeService.js'

// Hook for real-time token updates
export const useRealTimeToken = (tokenId) => {
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    if (!tokenId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Subscribe to token updates
    const unsubscribe = realTimeService.subscribe(tokenId, (tokenData) => {
      setToken(tokenData)
      setIsLoading(false)
      setError(null)
    })

    unsubscribeRef.current = unsubscribe

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [tokenId])

  return { token, isLoading, error }
}

// Hook for real-time queue status updates
export const useRealTimeQueueStatus = (branchId, departmentId) => {
  const [queueStatus, setQueueStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    if (!branchId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    // Subscribe to queue status updates
    const unsubscribe = realTimeService.subscribeQueueStatus(
      branchId, 
      departmentId, 
      (queueData) => {
        setQueueStatus(queueData)
        setIsLoading(false)
        setError(null)
      }
    )

    unsubscribeRef.current = unsubscribe

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [branchId, departmentId])

  return { queueStatus, isLoading, error }
}

// Hook for real-time active tokens
export const useRealTimeActiveTokens = () => {
  const [activeTokens, setActiveTokens] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const unsubscribeRefs = useRef(new Set())

  const refreshTokens = useCallback(async () => {
    try {
      // This would need to be implemented in the API
      // const tokensData = await tokenAPI.getMyTokens({ status: 'waiting,serving,held' })
      // setActiveTokens(tokensData || [])
      setIsLoading(false)
    } catch (err) {
      setError(err.message)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshTokens()

    // Set up periodic refresh
    const interval = setInterval(refreshTokens, 30000) // Refresh every 30 seconds

    return () => {
      clearInterval(interval)
      // Clean up all subscriptions
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe())
      unsubscribeRefs.current.clear()
    }
  }, [refreshTokens])

  return { activeTokens, isLoading, error, refreshTokens }
}

// Hook for WebSocket connection management
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Initialize WebSocket connection
    realTimeService.initWebSocket()

    // Check connection status periodically
    const checkConnection = () => {
      setIsConnected(realTimeService.websocket?.readyState === WebSocket.OPEN)
    }

    const interval = setInterval(checkConnection, 5000)

    return () => {
      clearInterval(interval)
      realTimeService.cleanup()
    }
  }, [])

  return { isConnected }
}

// Hook for real-time notifications
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      read: false,
      ...notification
    }

    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)

    // Auto-remove notification after 5 seconds if it's not an error
    if (notification.type !== 'error') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  }
}
