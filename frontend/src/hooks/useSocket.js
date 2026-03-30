import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import socketService from '../services/socketService'

export const useSocket = (autoConnect = true) => {
  const { token, isAuthenticated } = useAuthStore()
  const socketConnectedRef = useRef(false)

  // Connect to socket
  const connect = useCallback(() => {
    if (token && !socketService.isConnected()) {
      socketService.connect()
    }
  }, [token])

  // Disconnect from socket
  const disconnect = useCallback(() => {
    socketService.disconnect()
  }, [])

  // Join room
  const joinRoom = useCallback((room) => {
    socketService.joinRoom(room)
  }, [])

  // Leave room
  const leaveRoom = useCallback((room) => {
    socketService.leaveRoom(room)
  }, [])

  // Queue actions
  const callNextToken = useCallback((counterId) => {
    socketService.callNextToken(counterId)
  }, [])

  const skipToken = useCallback((tokenId, reason) => {
    socketService.skipToken(tokenId, reason)
  }, [])

  const holdToken = useCallback((tokenId, reason) => {
    socketService.holdToken(tokenId, reason)
  }, [])

  const completeToken = useCallback((tokenId, serviceTime) => {
    socketService.completeToken(tokenId, serviceTime)
  }, [])

  const recallToken = useCallback((tokenId) => {
    socketService.recallToken(tokenId)
  }, [])

  const checkInToken = useCallback((tokenId) => {
    socketService.checkInToken(tokenId)
  }, [])

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && token) {
      connect()
    }

    return () => {
      if (autoConnect) {
        disconnect()
      }
    }
  }, [autoConnect, isAuthenticated, token, connect, disconnect])

  // Handle connection status changes
  useEffect(() => {
    const handleConnect = () => {
      socketConnectedRef.current = true
    }

    const handleDisconnect = () => {
      socketConnectedRef.current = false
    }

    // Listen for connection events
    window.addEventListener('socketConnected', handleConnect)
    window.addEventListener('socketDisconnected', handleDisconnect)

    return () => {
      window.removeEventListener('socketConnected', handleConnect)
      window.removeEventListener('socketDisconnected', handleDisconnect)
    }
  }, [])

  return {
    isConnected: socketService.isConnected(),
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    callNextToken,
    skipToken,
    holdToken,
    completeToken,
    recallToken,
    checkInToken
  }
}

export const useSocketEvent = (eventName, handler, dependencies = []) => {
  useEffect(() => {
    const eventHandler = (event) => {
      handler(event.detail)
    }

    window.addEventListener(eventName, eventHandler)

    return () => {
      window.removeEventListener(eventName, eventHandler)
    }
  }, [eventName, handler, ...dependencies])
}

export const useTokenStatusChange = (handler) => {
  return useSocketEvent('tokenStatusChanged', handler)
}

export const useQueueUpdate = (handler) => {
  return useSocketEvent('queueUpdated', handler)
}

export const useTokenCalled = (handler) => {
  return useSocketEvent('tokenCalled', handler)
}

export const useNotification = (handler) => {
  return useSocketEvent('notification', handler)
}

export const usePublicDisplayUpdate = (handler) => {
  return useSocketEvent('publicDisplayUpdate', handler)
}

export const useCounterStatusChange = (handler) => {
  return useSocketEvent('counterStatusChanged', handler)
}

export const useActionSuccess = (handler) => {
  return useSocketEvent('actionSuccess', handler)
}

export const useSocketError = (handler) => {
  return useSocketEvent('socketError', handler)
}
