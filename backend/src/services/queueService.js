import Token from '../models/Token.js'
import QueueLog from '../models/QueueLog.js'
import Department from '../models/Department.js'
import { TOKEN_STATUS, QUEUE_ACTIONS, SOCKET_EVENTS } from '../utils/constants.js'
import { getStartOfToday, getEndOfToday } from '../utils/dateUtils.js'
import { QueueLifecycleService } from './queueLifecycleService.js'

export class QueueService {
  // Calculate estimated wait time for a token
  static async calculateWaitTime(tokenId) {
    const token = await Token.findById(tokenId)
      .populate('departmentId', 'averageServiceTime')

    if (!token) {
      throw new Error('Token not found')
    }

    // Get tokens ahead in queue
    const tokensAhead = await Token.countDocuments({
      branchId: token.branchId,
      departmentId: token.departmentId,
      status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.SERVING] },
      priority: token.priority === 'high' ? { $gte: 'high' } : 'normal',
      scheduledTime: { $lte: token.scheduledTime },
      _id: { $ne: tokenId }
    })

    const avgServiceTime = token.departmentId?.averageServiceTime || 15
    const estimatedWaitTime = tokensAhead * avgServiceTime

    // Update token with calculated wait time
    token.estimatedWaitTime = estimatedWaitTime
    await token.save()

    return estimatedWaitTime
  }

  // Get today's active queue
  static async getTodayQueue({ branchId, departmentId, status }) {
    // 1. Expire stale tokens first to ensure the queue is clean
    await QueueLifecycleService.expireOldTokens()

    const today = getStartOfToday()
    const query = {
      branchId,
      isActiveQueue: true,
      $or: [
        { queueDate: today },
        { 
          queueDate: { $exists: false },
          createdAt: { $gte: today } 
        }
      ]
    }

    if (departmentId) query.departmentId = departmentId
    if (status) query.status = status

    // Optional sorts: urgent first, then tokenNumber
    const priorityOrder = { urgent: 3, high: 2, normal: 1 };
    
    // Using simple sort array based on priority strings might require aggregate for perfect sort if text,
    // but we can sort by 'priority' (-1) and 'tokenNumber' (1) as requested.
    const tokens = await Token.find(query)
      .populate('userId', 'name phone')
      .populate('departmentId', 'name')
      .sort([
        { priority: -1 },
        { tokenNumber: 1 }
      ])

    return {
      tokens,
      isTodayQueue: true
    }
  }

  // Get queue status for a branch/department
  static async getQueueStatus(branchId, departmentId = null) {
    const query = { branchId }
    
    if (departmentId) {
      query.departmentId = departmentId
    }

    // Get current queue
    const waitingTokens = await Token.find({
      ...query,
      status: TOKEN_STATUS.WAITING
    })
    .populate('userId', 'name phone')
    .populate('departmentId', 'name')
    .sort([
      { priority: -1 }, // High priority first
      { scheduledTime: 1 }, // Earlier scheduled time first
      { createdAt: 1 } // Earlier creation first
    ])

    const servingTokens = await Token.find({
      ...query,
      status: TOKEN_STATUS.SERVING
    })
    .populate('userId', 'name phone')
    .populate('departmentId', 'name')

    const heldTokens = await Token.find({
      ...query,
      status: TOKEN_STATUS.HELD
    })
    .populate('userId', 'name phone')
    .populate('departmentId', 'name')

    return {
      waiting: waitingTokens,
      serving: servingTokens,
      held: heldTokens,
      statistics: {
        totalWaiting: waitingTokens.length,
        totalServing: servingTokens.length,
        totalHeld: heldTokens.length,
        averageWaitTime: waitingTokens.reduce((sum, token) => sum + token.estimatedWaitTime, 0) / (waitingTokens.length || 1)
      }
    }
  }

  // Call next token - obsolete but retaining safe version
  static async callNextToken(branchId, departmentId, performedBy) {
    // Get next token in queue
    const nextToken = await Token.findOne({
      branchId,
      departmentId,
      status: TOKEN_STATUS.WAITING
    })
    .populate('userId', 'name phone')
    .sort([
      { priority: -1 },
      { scheduledTime: 1 },
      { createdAt: 1 }
    ])

    if (!nextToken) {
      throw new Error('No tokens in queue')
    }

    // Update token status
    const statusUpdate = nextToken.updateStatus(TOKEN_STATUS.SERVING, performedBy)
    nextToken.startedServiceAt = new Date()
    await nextToken.save()

    // Log action
    await QueueLog.logAction({
      tokenId: nextToken._id,
      action: QUEUE_ACTIONS.CALLED,
      performedBy,
      metadata: statusUpdate.metadata
    })

    // Update wait times for remaining tokens
    await this.updateQueueWaitTimes(branchId, departmentId)

    // Emit socket event for real-time updates
    this._emitQueueUpdate(branchId, departmentId)

    return nextToken
  }

  // Skip token
  static async skipToken(tokenId, performedBy, reason = '') {
    const token = await Token.findById(tokenId)

    if (!token) {
      throw new Error('Token not found')
    }

    if (token.status !== TOKEN_STATUS.SERVING && token.status !== TOKEN_STATUS.WAITING) {
      throw new Error('Token cannot be skipped in current status')
    }

    // Update token status
    const statusUpdate = token.updateStatus(TOKEN_STATUS.SKIPPED, performedBy, reason)
    await token.save()

    // Log action
    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.SKIPPED,
      performedBy,
      metadata: {
        ...statusUpdate.metadata,
        reason
      }
    })

    // Emit socket event for real-time updates
    this._emitQueueUpdate(token.branchId, token.departmentId)

    return token
  }

  // Hold token
  static async holdToken(tokenId, performedBy, reason = '') {
    const token = await Token.findById(tokenId)

    if (!token) {
      throw new Error('Token not found')
    }

    if (token.status !== TOKEN_STATUS.SERVING) {
      throw new Error('Only serving tokens can be held')
    }

    // Update token status
    const statusUpdate = token.updateStatus(TOKEN_STATUS.HELD, performedBy, reason)
    await token.save()

    // Log action
    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.HELD,
      performedBy,
      metadata: {
        ...statusUpdate.metadata,
        reason
      }
    })

    // Emit socket event for real-time updates
    this._emitQueueUpdate(token.branchId, token.departmentId)

    return token
  }

  // Complete token
  static async completeToken(tokenId, performedBy, serviceTime = null) {
    const token = await Token.findById(tokenId)

    if (!token) {
      throw new Error('Token not found')
    }

    if (token.status !== TOKEN_STATUS.SERVING) {
      throw new Error('Only serving tokens can be completed')
    }

    // Calculate actual service time if not provided
    let actualServiceTime = serviceTime
    if (!actualServiceTime && token.startedServiceAt) {
      actualServiceTime = (Date.now() - token.startedServiceAt) / (1000 * 60) // Convert to minutes
    }

    // Update token status
    const statusUpdate = token.updateStatus(TOKEN_STATUS.COMPLETED, performedBy)
    token.actualServiceTime = actualServiceTime
    await token.save()

    // Log action
    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.COMPLETED,
      performedBy,
      metadata: {
        ...statusUpdate.metadata,
        serviceTime: actualServiceTime
      }
    })

    // Emit socket event for real-time updates
    this._emitQueueUpdate(token.branchId, token.departmentId)

    return token
  }

  // Recall skipped token
  static async recallToken(tokenId, performedBy) {
    const token = await Token.findById(tokenId)

    if (!token) {
      throw new Error('Token not found')
    }

    if (token.status !== TOKEN_STATUS.SKIPPED) {
      throw new Error('Only skipped tokens can be recalled')
    }

    // Update token status
    const statusUpdate = token.updateStatus(TOKEN_STATUS.WAITING, performedBy)
    await token.save()

    // Log action
    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.RECALLED,
      performedBy,
      metadata: statusUpdate.metadata
    })

    // Emit socket event for real-time updates
    this._emitQueueUpdate(token.branchId, token.departmentId)

    return token
  }

  // Check-in token
  static async checkInToken(tokenId, performedBy) {
    const token = await Token.findById(tokenId)

    if (!token) {
      throw new Error('Token not found')
    }

    if (token.status !== TOKEN_STATUS.WAITING) {
      throw new Error('Only waiting tokens can be checked in')
    }

    if (token.checkedInAt) {
      throw new Error('Token already checked in')
    }

    // Update check-in time
    token.checkedInAt = new Date()
    await token.save()

    // Log action
    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.CHECK_IN,
      performedBy,
      metadata: {
        checkedInAt: token.checkedInAt
      }
    })

    // Emit socket event for real-time updates
    this._emitQueueUpdate(token.branchId, token.departmentId)

    return token
  }

  /**
   * Helper to emit queue updates via Socket.IO
   */
  static _emitQueueUpdate(branchId, departmentId) {
    if (global.io) {
      const room = departmentId ? `${branchId}-${departmentId}` : branchId.toString();
      global.io.to(room).emit(SOCKET_EVENTS.QUEUE_UPDATED, {
        branchId,
        departmentId,
        timestamp: new Date()
      });
    }
  }

  // Update wait times for all tokens in queue
  static async updateQueueWaitTimes(branchId, departmentId) {
    const tokens = await Token.find({
      branchId,
      departmentId,
      status: TOKEN_STATUS.WAITING
    })
    .populate('departmentId', 'averageServiceTime')
    .sort([
      { priority: -1 },
      { scheduledTime: 1 },
      { createdAt: 1 }
    ])

    const avgServiceTime = tokens.length > 0 ? tokens[0].departmentId?.averageServiceTime || 15 : 15

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      const estimatedWaitTime = i * avgServiceTime
      
      if (token.estimatedWaitTime !== estimatedWaitTime) {
        token.estimatedWaitTime = estimatedWaitTime
        await token.save()
      }
    }
  }

  // Get queue analytics
  static async getQueueAnalytics(branchId, departmentId = null, startDate, endDate) {
    const matchStage = {
      branchId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }

    if (departmentId) {
      matchStage.departmentId = departmentId
    }

    const analytics = await Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            status: '$status',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 },
          avgWaitTime: { $avg: '$estimatedWaitTime' },
          avgServiceTime: { $avg: '$actualServiceTime' }
        }
      },
      {
        $group: {
          _id: '$_id.status',
          dailyStats: {
            $push: {
              date: '$_id.date',
              count: '$count',
              avgWaitTime: '$avgWaitTime',
              avgServiceTime: '$avgServiceTime'
            }
          },
          totalCount: { $sum: '$count' },
          avgWaitTime: { $avg: '$avgWaitTime' },
          avgServiceTime: { $avg: '$avgServiceTime' }
        }
      }
    ])

    return analytics.reduce((acc, stat) => {
      acc[stat._id] = {
        totalCount: stat.totalCount,
        avgWaitTime: stat.avgWaitTime || 0,
        avgServiceTime: stat.avgServiceTime || 0,
        dailyStats: stat.dailyStats
      }
      return acc
    }, {})
  }
}
