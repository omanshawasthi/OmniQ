import { io } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  connect() {
    const { token } = useAuthStore.getState()
    
    if (!token) {
      console.warn('Cannot connect socket: No authentication token')
      return
    }

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    this.setupEventListeners()
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected')
      this.connected = true
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      this.connected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🔌 Max reconnection attempts reached')
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔌 Socket reconnected after ${attemptNumber} attempts`)
    })

    // Custom event listeners
    this.socket.on('token_status_changed', (data) => {
      console.log('🎫 Token status changed:', data)
      this.handleTokenStatusChange(data)
    })

    this.socket.on('queue_updated', (data) => {
      console.log('📊 Queue updated:', data)
      this.handleQueueUpdate(data)
    })

    this.socket.on('token_called', (data) => {
      console.log('📢 Token called:', data)
      this.handleTokenCalled(data)
    })

    this.socket.on('notification', (data) => {
      console.log('🔔 Notification received:', data)
      this.handleNotification(data)
    })

    this.socket.on('public_display_update', (data) => {
      console.log('📺 Public display updated:', data)
      this.handlePublicDisplayUpdate(data)
    })

    this.socket.on('counter_status_changed', (data) => {
      console.log('🏢 Counter status changed:', data)
      this.handleCounterStatusChange(data)
    })

    this.socket.on('room_joined', (data) => {
      console.log('🏠 Joined room:', data)
    })

    this.socket.on('room_left', (data) => {
      console.log('🏠 Left room:', data)
    })

    this.socket.on('action_success', (data) => {
      console.log('✅ Action successful:', data)
      this.handleActionSuccess(data)
    })

    this.socket.on('error', (data) => {
      console.error('❌ Socket error:', data)
      this.handleSocketError(data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  joinRoom(room) {
    if (this.socket && this.connected) {
      this.socket.emit('join_room', { room })
    }
  }

  leaveRoom(room) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_room', { room })
    }
  }

  performQueueAction(action, tokenId, options = {}) {
    if (this.socket && this.connected) {
      this.socket.emit('queue_action', {
        action,
        tokenId,
        ...options
      })
    }
  }

  callNextToken(counterId) {
    this.performQueueAction('call_next', null, { counterId })
  }

  skipToken(tokenId, reason = '') {
    this.performQueueAction('skip', tokenId, { reason })
  }

  holdToken(tokenId, reason = '') {
    this.performQueueAction('hold', tokenId, { reason })
  }

  completeToken(tokenId, serviceTime) {
    this.performQueueAction('complete', tokenId, { serviceTime })
  }

  recallToken(tokenId) {
    this.performQueueAction('recall', tokenId)
  }

  checkInToken(tokenId) {
    this.performQueueAction('check_in', tokenId)
  }

  // Event handlers
  handleTokenStatusChange(data) {
    // Dispatch custom event or update store
    window.dispatchEvent(new CustomEvent('tokenStatusChanged', { detail: data }))
  }

  handleQueueUpdate(data) {
    window.dispatchEvent(new CustomEvent('queueUpdated', { detail: data }))
  }

  handleTokenCalled(data) {
    window.dispatchEvent(new CustomEvent('tokenCalled', { detail: data }))
  }

  handleNotification(data) {
    window.dispatchEvent(new CustomEvent('notification', { detail: data }))
  }

  handlePublicDisplayUpdate(data) {
    window.dispatchEvent(new CustomEvent('publicDisplayUpdate', { detail: data }))
  }

  handleCounterStatusChange(data) {
    window.dispatchEvent(new CustomEvent('counterStatusChanged', { detail: data }))
  }

  handleActionSuccess(data) {
    window.dispatchEvent(new CustomEvent('actionSuccess', { detail: data }))
  }

  handleSocketError(data) {
    window.dispatchEvent(new CustomEvent('socketError', { detail: data }))
  }

  // Utility methods
  isConnected() {
    return this.connected && this.socket?.connected
  }

  getSocketId() {
    return this.socket?.id
  }

  reconnect() {
    if (this.socket) {
      this.socket.connect()
    } else {
      this.connect()
    }
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService
