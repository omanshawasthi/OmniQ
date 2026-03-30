import { verifyAccessToken } from '../config/jwt.js'
import User from '../models/User.js'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      })
    }

    const token = authHeader.split(' ')[1]
    
    try {
      const decoded = verifyAccessToken(token)
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password')
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or user not found'
        })
      }

      req.user = user
      next()
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      })
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    })
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null
      return next()
    }

    const token = authHeader.split(' ')[1]
    
    try {
      const decoded = verifyAccessToken(token)
      const user = await User.findById(decoded.userId).select('-password')
      
      if (user && user.isActive) {
        req.user = user
      } else {
        req.user = null
      }
    } catch (jwtError) {
      req.user = null
    }
    
    next()
  } catch (error) {
    console.error('Optional authentication error:', error)
    req.user = null
    next()
  }
}
