import { tokenAPI } from '../utils/api.js'

class RealTimeService {
  constructor() {
    this.subscribers = new Map()
    this.pollingIntervals = new Map()
    this.websocket = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  // Subscribe to token updates
  subscribe(tokenId, callback) {
    if (!this.subscribers.has(tokenId)) {
      this.subscribers.set(tokenId, new Set())
    }
    this.subscribers.get(tokenId).add(callback)

    // Start polling for this token if not already polling
    if (!this.pollingIntervals.has(tokenId)) {
      this.startPolling(tokenId)
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(tokenId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.stopPolling(tokenId)
          this.subscribers.delete(tokenId)
        }
      }
    }
  }

  // Start polling for token updates
  startPolling(tokenId) {
    const pollInterval = 10000 // Poll every 10 seconds

    const poll = async () => {
      try {
        const tokenData = await tokenAPI.getToken(tokenId)
        this.notifySubscribers(tokenId, tokenData)
      } catch (error) {
        console.error(`Error polling token ${tokenId}:`, error)
        // Don't stop polling on error, just log it
      }
    }

    // Initial poll
    poll()

    // Set up interval
    const intervalId = setInterval(poll, pollInterval)
    this.pollingIntervals.set(tokenId, intervalId)
  }

  // Stop polling for token updates
  stopPolling(tokenId) {
    const intervalId = this.pollingIntervals.get(tokenId)
    if (intervalId) {
      clearInterval(intervalId)
      this.pollingIntervals.delete(tokenId)
    }
  }

  // Notify all subscribers of a token update
  notifySubscribers(tokenId, tokenData) {
    const callbacks = this.subscribers.get(tokenId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(tokenData)
        } catch (error) {
          console.error('Error in subscriber callback:', error)
        }
      })
    }
  }

  // Subscribe to queue status updates
  subscribeQueueStatus(branchId, departmentId, callback) {
    const key = `queue-${branchId}-${departmentId}`
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    this.subscribers.get(key).add(callback)

    // Start polling for queue status if not already polling
    if (!this.pollingIntervals.has(key)) {
      this.startQueuePolling(branchId, departmentId)
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.stopQueuePolling(branchId, departmentId)
          this.subscribers.delete(key)
        }
      }
    }
  }

  // Start polling for queue status
  startQueuePolling(branchId, departmentId) {
    const pollInterval = 15000 // Poll every 15 seconds

    const poll = async () => {
      try {
        const queueData = await tokenAPI.getQueueStatus(branchId, departmentId)
        const key = `queue-${branchId}-${departmentId}`
        this.notifySubscribers(key, queueData)
      } catch (error) {
        console.error(`Error polling queue status:`, error)
      }
    }

    // Initial poll
    poll()

    // Set up interval
    const intervalId = setInterval(poll, pollInterval)
    const key = `queue-${branchId}-${departmentId}`
    this.pollingIntervals.set(key, intervalId)
  }

  // Stop polling for queue status
  stopQueuePolling(branchId, departmentId) {
    const key = `queue-${branchId}-${departmentId}`
    const intervalId = this.pollingIntervals.get(key)
    if (intervalId) {
      clearInterval(intervalId)
      this.pollingIntervals.delete(key)
    }
  }

  // Initialize WebSocket connection (optional enhancement)
  initWebSocket() {
    if (this.websocket) {
      return
    }

    try {
      const wsUrl = import.meta.env?.VITE_WS_URL || 'ws://localhost:5001'
      this.websocket = new WebSocket(wsUrl)

      this.websocket.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
      }

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected')
        this.websocket = null
        this.attemptReconnect()
      }

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
    }
  }

  // Handle WebSocket messages
  handleWebSocketMessage(data) {
    const { type, payload } = data

    switch (type) {
      case 'TOKEN_UPDATE':
        this.notifySubscribers(payload.tokenId, payload.tokenData)
        break
      case 'QUEUE_UPDATE':
        const key = `queue-${payload.branchId}-${payload.departmentId}`
        this.notifySubscribers(key, payload.queueData)
        break
      default:
        console.log('Unknown WebSocket message type:', type)
    }
  }

  // Attempt to reconnect WebSocket
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.initWebSocket()
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  // Cleanup all subscriptions and connections
  cleanup() {
    // Clear all polling intervals
    this.pollingIntervals.forEach((intervalId) => {
      clearInterval(intervalId)
    })
    this.pollingIntervals.clear()

    // Clear all subscribers
    this.subscribers.clear()

    // Close WebSocket connection
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
  }
}

// Create singleton instance
const realTimeService = new RealTimeService()

export default realTimeService
