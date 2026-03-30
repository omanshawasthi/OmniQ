import { verifyAccessToken } from '../../config/jwt.js'
import User from '../../models/User.js'

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      // Allow anonymous connections for public display
      if (socket.handshake.query.type === 'public') {
        socket.user = null
        return next()
      }
      return next(new Error('Authentication token required'))
    }

    // Verify token
    const decoded = verifyAccessToken(token)
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user || !user.isActive) {
      return next(new Error('Invalid token or user not found'))
    }

    // Attach user to socket
    socket.user = user
    
    next()
  } catch (error) {
    console.error('Socket authentication error:', error)
    next(new Error('Authentication failed'))
  }
}
