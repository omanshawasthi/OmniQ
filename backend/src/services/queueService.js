import Token from '../models/Token.js'
import Counter from '../models/Counter.js'
import QueueLog from '../models/QueueLog.js'
import Department from '../models/Department.js'
import { TOKEN_STATUS, QUEUE_ACTIONS } from '../utils/constants.js'

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

  // Get queue status for a branch/department
  static async getQueueStatus(branchId, departmentId = null, counterId = null) {
    const query = { branchId }
    
    if (departmentId) {
      query.departmentId = departmentId
    }
    
    if (counterId) {
      query.counterId = counterId
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
    .populate('counterId', 'name')
    .populate('departmentId', 'name')

    const heldTokens = await Token.find({
      ...query,
      status: TOKEN_STATUS.HELD
    })
    .populate('userId', 'name phone')
    .populate('departmentId', 'name')

    // Get counter status
    const counters = await Counter.find({
      branchId,
      ...(departmentId && { departmentId })
    })
    .populate('assignedOperator', 'name')
    .populate('currentToken', 'tokenNumber')

    return {
      waiting: waitingTokens,
      serving: servingTokens,
      held: heldTokens,
      counters,
      statistics: {
        totalWaiting: waitingTokens.length,
        totalServing: servingTokens.length,
        totalHeld: heldTokens.length,
        averageWaitTime: waitingTokens.reduce((sum, token) => sum + token.estimatedWaitTime, 0) / (waitingTokens.length || 1)
      }
    }
  }

  // Call next token for a counter
  static async callNextToken(counterId, performedBy) {
    const counter = await Counter.findById(counterId).populate('departmentId')
    
    if (!counter) {
      throw new Error('Counter not found')
    }

    if (counter.status !== 'active') {
      throw new Error('Counter is not active')
    }

    // Get next token in queue
    const nextToken = await Token.findOne({
      branchId: counter.branchId,
      departmentId: counter.departmentId,
      status: TOKEN_STATUS.WAITING,
      counterId: { $in: [null, counterId] }
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

    // Mark current token as completed if exists
    if (counter.currentToken) {
      await this.completeToken(counter.currentToken.toString(), performedBy, 0)
    }

    // Update token status
    const statusUpdate = nextToken.updateStatus(TOKEN_STATUS.SERVING, performedBy)
    nextToken.counterId = counterId
    nextToken.startedServiceAt = new Date()
    await nextToken.save()

    // Update counter
    counter.currentToken = nextToken._id
    counter.lastActivity = new Date()
    await counter.save()

    // Log action
    await QueueLog.logAction({
      tokenId: nextToken._id,
      action: QUEUE_ACTIONS.CALLED,
      performedBy,
      counterId,
      metadata: statusUpdate.metadata
    })

    // Update wait times for remaining tokens
    await this.updateQueueWaitTimes(counter.branchId, counter.departmentId)

    return nextToken
  }

  // Skip token
  static async skipToken(tokenId, performedBy, reason = '') {
    const token = await Token.findById(tokenId).populate('counterId')

    if (!token) {
      throw new Error('Token not found')
    }

    if (token.status !== TOKEN_STATUS.SERVING && token.status !== TOKEN_STATUS.WAITING) {
      throw new Error('Token cannot be skipped in current status')
    }

    // Update token status
    const statusUpdate = token.updateStatus(TOKEN_STATUS.SKIPPED, performedBy, reason)
    await token.save()

    // Clear counter if token was serving
    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, {
        currentToken: null,
        lastActivity: new Date()
      })
    }

    // Log action
    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.SKIPPED,
      performedBy,
      counterId: token.counterId,
      metadata: {
        ...statusUpdate.metadata,
        reason
      }
    })

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

    // Clear counter
    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, {
        currentToken: null,
        lastActivity: new Date()
      })
    }

    // Log action
    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.HELD,
      performedBy,
      counterId: token.counterId,
      metadata: {
        ...statusUpdate.metadata,
        reason
      }
    })

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

    // Update counter statistics
    if (token.counterId) {
      await Counter.findByIdAndUpdate(token.counterId, {
        currentToken: null,
        totalServedToday: { $inc: 1 },
        lastActivity: new Date()
      })
    }

    // Log action
    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.COMPLETED,
      performedBy,
      counterId: token.counterId,
      metadata: {
        ...statusUpdate.metadata,
        serviceTime: actualServiceTime
      }
    })

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
      action: QUEUE_ACTIONS.CHECKED_IN,
      performedBy,
      metadata: {
        checkedInAt: token.checkedInAt
      }
    })

    return token
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
