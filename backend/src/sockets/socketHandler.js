import { SOCKET_EVENTS, ROOM_TYPES } from '../utils/constants.js'
import { authenticateSocket } from './middleware/socketAuth.js'
import { QueueService } from '../services/queueService.js'
import Token from '../models/Token.js'

class SocketHandler {
  constructor(io) {
    this.io = io
    this.connectedUsers = new Map() // userId -> socket.id
    this.userSockets = new Map() // socket.id -> userId
    this.setupMiddleware()
    this.setupEventHandlers()
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(authenticateSocket)
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user?.name || 'Anonymous'} (${socket.id})`)
      
      // Store user connection
      if (socket.user) {
        this.connectedUsers.set(socket.user._id.toString(), socket.id)
        this.userSockets.set(socket.id, socket.user._id.toString())
        
        // Join user-specific room
        socket.join(ROOM_TYPES.USER + socket.user._id)
        
        // Join role-based rooms
        socket.join(socket.user.role)
        
        // Join branch/department rooms if staff/operator
        if (socket.user.assignedBranch) {
          socket.join(ROOM_TYPES.BRANCH + socket.user.assignedBranch)
        }
        
        if (socket.user.assignedCounter) {
          socket.join(ROOM_TYPES.COUNTER + socket.user.assignedCounter)
        }
      }

      // Handle room joining
      socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
        this.handleJoinRoom(socket, data)
      })

      // Handle room leaving
      socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data) => {
        this.handleLeaveRoom(socket, data)
      })

      // Handle queue actions
      socket.on(SOCKET_EVENTS.QUEUE_ACTION, async (data) => {
        await this.handleQueueAction(socket, data)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })
    })
  }

  async handleJoinRoom(socket, data) {
    try {
      const { room } = data
      
      if (!room) {
        socket.emit('error', { message: 'Room name is required' })
        return
      }

      // Validate room access
      if (!this.canAccessRoom(socket.user, room)) {
        socket.emit('error', { message: 'Access denied to room' })
        return
      }

      socket.join(room)
      socket.emit('room_joined', { room })
      
      console.log(`User ${socket.user?.name} joined room: ${room}`)
    } catch (error) {
      console.error('Error joining room:', error)
      socket.emit('error', { message: 'Failed to join room' })
    }
  }

  async handleLeaveRoom(socket, data) {
    try {
      const { room } = data
      
      if (!room) {
        socket.emit('error', { message: 'Room name is required' })
        return
      }

      socket.leave(room)
      socket.emit('room_left', { room })
      
      console.log(`User ${socket.user?.name} left room: ${room}`)
    } catch (error) {
      console.error('Error leaving room:', error)
      socket.emit('error', { message: 'Failed to leave room' })
    }
  }

  async handleQueueAction(socket, data) {
    try {
      const { action, tokenId, counterId, reason, serviceTime } = data
      
      if (!action || !tokenId) {
        socket.emit('error', { message: 'Action and token ID are required' })
        return
      }

      // Validate permissions
      if (!this.canPerformQueueAction(socket.user, action)) {
        socket.emit('error', { message: 'Insufficient permissions' })
        return
      }

      let result
      const performedBy = socket.user._id

      switch (action) {
        case 'call_next':
          if (!counterId) {
            socket.emit('error', { message: 'Counter ID is required for call_next' })
            return
          }
          result = await QueueService.callNextToken(counterId, performedBy)
          break

        case 'skip':
          result = await QueueService.skipToken(tokenId, performedBy, reason)
          break

        case 'hold':
          result = await QueueService.holdToken(tokenId, performedBy, reason)
          break

        case 'complete':
          result = await QueueService.completeToken(tokenId, performedBy, serviceTime)
          break

        case 'recall':
          result = await QueueService.recallToken(tokenId, performedBy)
          break

        case 'check_in':
          result = await QueueService.checkInToken(tokenId, performedBy)
          break

        default:
          socket.emit('error', { message: 'Invalid queue action' })
          return
      }

      // Emit real-time updates
      await this.emitQueueUpdate(result, action, socket.user)

      // Send success response to the performer
      socket.emit('action_success', {
        action,
        token: result,
        message: `${action} completed successfully`
      })

    } catch (error) {
      console.error('Error handling queue action:', error)
      socket.emit('error', { message: error.message })
    }
  }

  async emitQueueUpdate(token, action, performedBy) {
    try {
      // Get populated token data
      const populatedToken = await Token.findById(token._id)
        .populate('userId', 'name email')
        .populate('branchId', 'name')
        .populate('departmentId', 'name')
        .populate('counterId', 'name')

      // Prepare event data
      const eventData = {
        token: populatedToken,
        action,
        performedBy: {
          _id: performedBy._id,
          name: performedBy.name,
          role: performedBy.role
        },
        timestamp: new Date()
      }

      // Emit to different rooms based on action
      const rooms = []

      // Always emit to branch and department rooms
      rooms.push(ROOM_TYPES.BRANCH + token.branchId)
      rooms.push(ROOM_TYPES.DEPARTMENT + token.departmentId)

      // Emit to counter room if assigned
      if (token.counterId) {
        rooms.push(ROOM_TYPES.COUNTER + token.counterId)
      }

      // Emit to user room if token has user
      if (token.userId) {
        rooms.push(ROOM_TYPES.USER + token.userId)
      }

      // Emit to public display room
      rooms.push(ROOM_TYPES.PUBLIC_DISPLAY + token.branchId)

      // Emit to staff and operators
      rooms.push('staff')
      rooms.push('operator')

      // Emit the appropriate event
      switch (action) {
        case 'call_next':
        case 'called':
          this.io.to(rooms).emit(SOCKET_EVENTS.TOKEN_CALLED, eventData)
          break

        case 'complete':
          this.io.to(rooms).emit(SOCKET_EVENTS.TOKEN_STATUS_CHANGED, {
            ...eventData,
            status: 'completed'
          })
          break

        case 'skip':
          this.io.to(rooms).emit(SOCKET_EVENTS.TOKEN_STATUS_CHANGED, {
            ...eventData,
            status: 'skipped'
          })
          break

        case 'hold':
          this.io.to(rooms).emit(SOCKET_EVENTS.TOKEN_STATUS_CHANGED, {
            ...eventData,
            status: 'held'
          })
          break

        case 'recall':
          this.io.to(rooms).emit(SOCKET_EVENTS.TOKEN_STATUS_CHANGED, {
            ...eventData,
            status: 'waiting'
          })
          break

        case 'check_in':
          this.io.to(rooms).emit(SOCKET_EVENTS.TOKEN_STATUS_CHANGED, {
            ...eventData,
            status: 'checked_in'
          })
          break
      }

      // Emit general queue update
      const queueStatus = await QueueService.getQueueStatus(
        token.branchId,
        token.departmentId
      )
      
      this.io.to(rooms).emit(SOCKET_EVENTS.QUEUE_UPDATED, {
        branchId: token.branchId,
        departmentId: token.departmentId,
        queueStatus,
        timestamp: new Date()
      })

      // Emit public display update
      this.io.to(ROOM_TYPES.PUBLIC_DISPLAY + token.branchId).emit(
        SOCKET_EVENTS.PUBLIC_DISPLAY_UPDATE,
        {
          branchId: token.branchId,
          currentToken: populatedToken,
          queueStats: queueStatus.statistics,
          timestamp: new Date()
        }
      )

    } catch (error) {
      console.error('Error emitting queue update:', error)
    }
  }

  canAccessRoom(user, room) {
    if (!user) return false

    // Admin can access any room
    if (user.role === 'admin') return true

    // User-specific rooms
    if (room.startsWith(ROOM_TYPES.USER)) {
      const userId = room.replace(ROOM_TYPES.USER, '')
      return user._id.toString() === userId
    }

    // Branch rooms
    if (room.startsWith(ROOM_TYPES.BRANCH)) {
      const branchId = room.replace(ROOM_TYPES.BRANCH, '')
      return user.assignedBranch?.toString() === branchId || user.role === 'staff'
    }

    // Department rooms (staff and operators can access their assigned departments)
    if (room.startsWith(ROOM_TYPES.DEPARTMENT)) {
      return user.role === 'staff' || user.role === 'operator'
    }

    // Counter rooms
    if (room.startsWith(ROOM_TYPES.COUNTER)) {
      const counterId = room.replace(ROOM_TYPES.COUNTER, '')
      return user.assignedCounter?.toString() === counterId || user.role === 'staff'
    }

    // Public display rooms (anyone can access)
    if (room.startsWith(ROOM_TYPES.PUBLIC_DISPLAY)) {
      return true
    }

    // Role-based rooms
    if (['user', 'staff', 'operator', 'admin'].includes(room)) {
      return user.role === room
    }

    return false
  }

  canPerformQueueAction(user, action) {
    if (!user) return false

    // Admin can perform any action
    if (user.role === 'admin') return true

    // Staff permissions
    if (user.role === 'staff') {
      return ['call_next', 'skip', 'hold', 'recall', 'check_in'].includes(action)
    }

    // Operator permissions
    if (user.role === 'operator') {
      return ['complete', 'hold', 'check_in'].includes(action)
    }

    // Users cannot perform queue actions
    return false
  }

  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.user?.name || 'Anonymous'} (${socket.id})`)
    
    // Clean up user connections
    if (socket.user) {
      this.connectedUsers.delete(socket.user._id.toString())
      this.userSockets.delete(socket.id)
    }
  }

  // Utility methods for external use
  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId.toString())
    if (socketId) {
      this.io.to(socketId).emit(event, data)
    }
  }

  emitToBranch(branchId, event, data) {
    this.io.to(ROOM_TYPES.BRANCH + branchId).emit(event, data)
  }

  emitToDepartment(departmentId, event, data) {
    this.io.to(ROOM_TYPES.DEPARTMENT + departmentId).emit(event, data)
  }

  emitToCounter(counterId, event, data) {
    this.io.to(ROOM_TYPES.COUNTER + counterId).emit(event, data)
  }

  emitToRole(role, event, data) {
    this.io.to(role).emit(event, data)
  }

  emitToPublicDisplay(branchId, event, data) {
    this.io.to(ROOM_TYPES.PUBLIC_DISPLAY + branchId).emit(event, data)
  }
}

export default SocketHandler
