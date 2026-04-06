import { ROOM_TYPES } from '../utils/constants.js'

export class RoomManager {
  constructor(io) {
    this.io = io
  }

  // Get all rooms a user should be in
  getUserRooms(user) {
    const rooms = []

    if (!user) {
      // Anonymous user (public display)
      return rooms
    }

    // User-specific room
    rooms.push(ROOM_TYPES.USER + user._id)

    // Role-based room
    rooms.push(user.role)

    // Branch room (if assigned)
    if (user.assignedBranch) {
      rooms.push(ROOM_TYPES.BRANCH + user.assignedBranch)
    }

    return rooms
  }

  // Join user to their appropriate rooms
  joinUserToRooms(socket, user) {
    const rooms = this.getUserRooms(user)
    
    rooms.forEach(room => {
      socket.join(room)
    })

    return rooms
  }

  // Get room members count
  async getRoomMembersCount(room) {
    const sockets = await this.io.in(room).fetchSockets()
    return sockets.length
  }

  // Get all active rooms
  async getActiveRooms() {
    const adapter = this.io.of('/').adapter
    const rooms = await adapter.rooms
    return Array.from(rooms.keys())
  }

  // Get rooms by type
  async getRoomsByType(type) {
    const allRooms = await this.getActiveRooms()
    return allRooms.filter(room => room.startsWith(type))
  }

  // Broadcast to room with validation
  async broadcastToRoom(room, event, data, options = {}) {
    const { validateRoom = true } = options

    if (validateRoom) {
      const roomExists = await this.roomExists(room)
      if (!roomExists) {
        console.warn(`Room ${room} does not exist`)
        return false
      }
    }

    this.io.to(room).emit(event, data)
    return true
  }

  // Check if room exists
  async roomExists(room) {
    const adapter = this.io.of('/').adapter
    const rooms = await adapter.rooms
    return rooms.has(room)
  }

  // Get room statistics
  async getRoomStatistics() {
    const allRooms = await this.getActiveRooms()
    const stats = {
      totalRooms: allRooms.length,
      userRooms: 0,
      branchRooms: 0,
      departmentRooms: 0,
      publicDisplayRooms: 0,
      roleRooms: 0,
      roomDetails: []
    }

    for (const room of allRooms) {
      const memberCount = await this.getRoomMembersCount(room)
      
      const roomDetail = {
        name: room,
        memberCount,
        type: this.getRoomType(room)
      }
      
      stats.roomDetails.push(roomDetail)

      // Count by type
      switch (roomDetail.type) {
        case 'user':
          stats.userRooms++
          break
        case 'branch':
          stats.branchRooms++
          break
        case 'department':
          stats.departmentRooms++
          break
        case 'public_display':
          stats.publicDisplayRooms++
          break
        case 'role':
          stats.roleRooms++
          break
      }
    }

    return stats
  }

  // Get room type from room name
  getRoomType(room) {
    if (room.startsWith(ROOM_TYPES.USER)) return 'user'
    if (room.startsWith(ROOM_TYPES.BRANCH)) return 'branch'
    if (room.startsWith(ROOM_TYPES.DEPARTMENT)) return 'department'
    if (room.startsWith(ROOM_TYPES.PUBLIC_DISPLAY)) return 'public_display'
    if (['user', 'staff', 'admin'].includes(room)) return 'role'
    return 'unknown'
  }

  // Clean up empty rooms
  async cleanupEmptyRooms() {
    const allRooms = await this.getActiveRooms()
    const emptyRooms = []

    for (const room of allRooms) {
      const memberCount = await this.getRoomMembersCount(room)
      if (memberCount === 0) {
        emptyRooms.push(room)
      }
    }

    // Note: Socket.IO doesn't provide a direct way to delete rooms
    // Empty rooms are automatically cleaned up by Socket.IO
    console.log(`Found ${emptyRooms.length} empty rooms`)

    return emptyRooms
  }

  // Get users in a room
  async getUsersInRoom(room) {
    const sockets = await this.io.in(room).fetchSockets()
    return sockets.map(socket => ({
      socketId: socket.id,
      user: socket.user ? {
        id: socket.user._id,
        name: socket.user.name,
        email: socket.user.email,
        role: socket.user.role
      } : null,
      connectedAt: socket.handshake.time
    }))
  }

  // Send notification to specific user
  async sendNotificationToUser(userId, notification) {
    const userRoom = ROOM_TYPES.USER + userId
    return await this.broadcastToRoom(userRoom, 'notification', notification)
  }

  // Send queue update to branch
  async sendQueueUpdateToBranch(branchId, queueUpdate) {
    const branchRoom = ROOM_TYPES.BRANCH + branchId
    return await this.broadcastToRoom(branchRoom, 'queue_updated', queueUpdate)
  }

  // Send token update to department
  async sendTokenUpdateToDepartment(departmentId, tokenUpdate) {
    const departmentRoom = ROOM_TYPES.DEPARTMENT + departmentId
    return await this.broadcastToRoom(departmentRoom, 'token_status_changed', tokenUpdate)
  }

    // Send public display update
  async sendPublicDisplayUpdate(branchId, displayData) {
    const publicRoom = ROOM_TYPES.PUBLIC_DISPLAY + branchId
    return await this.broadcastToRoom(publicRoom, 'public_display_update', displayData)
  }
}

export default RoomManager
