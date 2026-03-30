import SocketHandler from '../sockets/socketHandler.js'
import RoomManager from '../sockets/roomManager.js'

let socketHandler = null
let roomManager = null

export const initializeSocket = (io) => {
  socketHandler = new SocketHandler(io)
  roomManager = new RoomManager(io)
  
  console.log('🔌 Socket.IO initialized')
  
  // Log room statistics every 5 minutes
  setInterval(async () => {
    if (roomManager) {
      const stats = await roomManager.getRoomStatistics()
      console.log(`📊 Active rooms: ${stats.totalRooms} (Users: ${stats.userRooms}, Branches: ${stats.branchRooms}, Departments: ${stats.departmentRooms})`)
    }
  }, 5 * 60 * 1000)
  
  return socketHandler
}

export const getSocketHandler = () => {
  if (!socketHandler) {
    throw new Error('Socket handler not initialized. Call initializeSocket first.')
  }
  return socketHandler
}

export const getRoomManager = () => {
  if (!roomManager) {
    throw new Error('Room manager not initialized. Call initializeSocket first.')
  }
  return roomManager
}

// Utility functions for external use
export const emitToUser = (userId, event, data) => {
  const handler = getSocketHandler()
  return handler.emitToUser(userId, event, data)
}

export const emitToBranch = (branchId, event, data) => {
  const handler = getSocketHandler()
  return handler.emitToBranch(branchId, event, data)
}

export const emitToDepartment = (departmentId, event, data) => {
  const handler = getSocketHandler()
  return handler.emitToDepartment(departmentId, event, data)
}

export const emitToCounter = (counterId, event, data) => {
  const handler = getSocketHandler()
  return handler.emitToCounter(counterId, event, data)
}

export const emitToRole = (role, event, data) => {
  const handler = getSocketHandler()
  return handler.emitToRole(role, event, data)
}

export const emitToPublicDisplay = (branchId, event, data) => {
  const handler = getSocketHandler()
  return handler.emitToPublicDisplay(branchId, event, data)
}
