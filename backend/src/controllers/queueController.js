import { QueueService } from '../services/queueService.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Get today's queue
export const getTodayQueue = asyncHandler(async (req, res) => {
  const { branchId, departmentId, status } = req.query;
  const todayQueue = await QueueService.getTodayQueue({
    branchId: branchId || req.user?.branchId,
    departmentId,
    status
  });

  res.status(200).json({
    success: true,
    data: todayQueue
  });
});

// Get queue status
export const getQueueStatus = asyncHandler(async (req, res) => {
  const { branchId, departmentId } = req.params
  
  const queueStatus = await QueueService.getQueueStatus(branchId, departmentId)

  res.status(200).json({
    success: true,
    data: { queueStatus }
  })
})

// Call next token
export const callNextToken = asyncHandler(async (req, res) => {
  const token = await QueueService.callNextToken(req.user._id)

  res.status(200).json({
    success: true,
    message: 'Next token called successfully',
    data: { token }
  })
})

// Skip token
export const skipToken = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { reason } = req.body
  
  const token = await QueueService.skipToken(id, req.user._id, reason)

  res.status(200).json({
    success: true,
    message: 'Token skipped successfully',
    data: { token }
  })
})

// Hold token
export const holdToken = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { reason } = req.body
  
  const token = await QueueService.holdToken(id, req.user._id, reason)

  res.status(200).json({
    success: true,
    message: 'Token held successfully',
    data: { token }
  })
})

// Complete token
export const completeToken = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { serviceTime } = req.body
  
  const token = await QueueService.completeToken(id, req.user._id, serviceTime)

  res.status(200).json({
    success: true,
    message: 'Token completed successfully',
    data: { token }
  })
})

// Recall token
export const recallToken = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const token = await QueueService.recallToken(id, req.user._id)

  res.status(200).json({
    success: true,
    message: 'Token recalled successfully',
    data: { token }
  })
})

// Check-in token
export const checkInToken = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const token = await QueueService.checkInToken(id, req.user._id)

  res.status(200).json({
    success: true,
    message: 'Token checked in successfully',
    data: { token }
  })
})
