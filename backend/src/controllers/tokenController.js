import { TokenService } from '../services/tokenService.js'
import { QueueService } from '../services/queueService.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Book online token
export const bookToken = asyncHandler(async (req, res) => {
  const token = await TokenService.bookToken(req.user._id, req.body)

  res.status(201).json({
    success: true,
    message: 'Token booked successfully',
    data: { token }
  })
})

// Create walk-in token
export const createWalkInToken = asyncHandler(async (req, res) => {
  const token = await TokenService.createWalkInToken(req.body, req.user)

  res.status(201).json({
    success: true,
    message: 'Walk-in token created successfully',
    data: { token }
  })
})

// Get user's tokens
export const getMyTokens = asyncHandler(async (req, res) => {
  const tokens = await TokenService.getUserTokens(req.user._id, req.query)

  res.status(200).json({
    success: true,
    data: tokens
  })
})

// Get token by ID
export const getToken = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  // Users can only access their own tokens
  const token = await TokenService.getTokenById(id, req.user.role === 'user' ? req.user._id : null)

  res.status(200).json({
    success: true,
    data: { token }
  })
})

// Cancel token
export const cancelToken = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const token = await TokenService.cancelToken(id, req.user._id)

  res.status(200).json({
    success: true,
    message: 'Token cancelled successfully',
    data: { token }
  })
})

// Get queue status
export const getQueueStatus = asyncHandler(async (req, res) => {
  const { branchId, departmentId } = req.params
  
  const queueStatus = await QueueService.getQueueStatus(branchId, departmentId)

  res.status(200).json({
    success: true,
    data: { queueStatus }
  })
})

// Check in token
export const checkInToken = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const token = await QueueService.checkInToken(id, req.user._id)

  res.status(200).json({
    success: true,
    message: 'Token checked in successfully',
    data: { token }
  })
})

// Search tokens
export const searchTokens = asyncHandler(async (req, res) => {
  const tokens = await TokenService.searchTokens(req.query.query, req.query)

  res.status(200).json({
    success: true,
    data: tokens
  })
})

// Get token statistics
export const getTokenStats = asyncHandler(async (req, res) => {
  const stats = await TokenService.getTokenStatistics(req.query)

  res.status(200).json({
    success: true,
    data: stats
  })
})

// Get live token status
export const getTokenLiveStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const liveStatus = await TokenService.getTokenLiveStatus(id, req.user.role === 'user' ? req.user._id : null)

  res.status(200).json({
    success: true,
    data: liveStatus
  })
})
