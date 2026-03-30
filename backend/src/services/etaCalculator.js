import Token from '../models/Token.js'
import Department from '../models/Department.js'
import { TOKEN_STATUS } from '../utils/constants.js'

export class ETACalculator {
  // Calculate estimated wait time for a specific token
  static async calculateWaitTime(tokenId) {
    const token = await Token.findById(tokenId).populate('departmentId')
    
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
    await Token.findByIdAndUpdate(tokenId, {
      estimatedWaitTime
    })

    return {
      tokensAhead,
      estimatedWaitTime,
      avgServiceTime,
      calculationTime: new Date()
    }
  }

  // Calculate ETA for all tokens in a department
  static async calculateDepartmentETA(branchId, departmentId) {
    const tokens = await Token.find({
      branchId,
      departmentId,
      status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.SERVING] }
    })
    .populate('departmentId')
    .sort([
      { priority: -1 }, // High priority first
      { scheduledTime: 1 }, // Earlier scheduled time first
      { createdAt: 1 } // Earlier creation first
    ])

    const department = await Department.findById(departmentId)
    const avgServiceTime = department?.averageServiceTime || 15

    const results = []
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      const tokensAhead = i
      const estimatedWaitTime = tokensAhead * avgServiceTime
      
      // Calculate recommended arrival time
      const now = new Date()
      const recommendedArrival = new Date(now.getTime() + (estimatedWaitTime * 60 * 1000))
      recommendedArrival.setMinutes(recommendedArrival.getMinutes() - 10) // 10 minutes before

      results.push({
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        position: i + 1,
        tokensAhead,
        estimatedWaitTime,
        recommendedArrival,
        calculationTime: new Date()
      })

      // Update token in database
      await Token.findByIdAndUpdate(token._id, {
        estimatedWaitTime,
        queuePosition: i + 1
      })
    }

    return results
  }

  // Calculate real-time ETA based on current queue performance
  static async calculateRealTimeETA(branchId, departmentId) {
    // Get current serving tokens to measure actual service times
    const servingTokens = await Token.find({
      branchId,
      departmentId,
      status: TOKEN_STATUS.SERVING
    })

    // Calculate current average service time based on recent completed tokens
    const recentCompleted = await Token.find({
      branchId,
      departmentId,
      status: TOKEN_STATUS.COMPLETED,
      completedAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
    })

    let dynamicServiceTime = 15 // Default
    
    if (recentCompleted.length > 0) {
      const totalServiceTime = recentCompleted.reduce((sum, token) => {
        return sum + (token.actualServiceTime || 0)
      }, 0)
      dynamicServiceTime = totalServiceTime / recentCompleted.length
    }

    // Get waiting tokens
    const waitingTokens = await Token.find({
      branchId,
      departmentId,
      status: TOKEN_STATUS.WAITING
    })
    .sort([
      { priority: -1 },
      { scheduledTime: 1 },
      { createdAt: 1 }
    ])

    const results = []
    let cumulativeWaitTime = 0

    // Add time for currently serving tokens
    for (const servingToken of servingTokens) {
      if (servingToken.startedServiceAt) {
        const elapsed = (Date.now() - servingToken.startedServiceAt.getTime()) / (1000 * 60)
        const remaining = Math.max(0, dynamicServiceTime - elapsed)
        cumulativeWaitTime += remaining
      }
    }

    // Calculate for each waiting token
    for (let i = 0; i < waitingTokens.length; i++) {
      const token = waitingTokens[i]
      const estimatedWaitTime = cumulativeWaitTime + (i * dynamicServiceTime)
      
      const now = new Date()
      const recommendedArrival = new Date(now.getTime() + (estimatedWaitTime * 60 * 1000))
      recommendedArrival.setMinutes(recommendedArrival.getMinutes() - 10)

      results.push({
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        position: i + 1,
        tokensAhead: i + servingTokens.length,
        estimatedWaitTime,
        recommendedArrival,
        dynamicServiceTime,
        calculationTime: new Date()
      })

      // Update token
      await Token.findByIdAndUpdate(token._id, {
        estimatedWaitTime,
        queuePosition: i + 1
      })
    }

    return {
      results,
      dynamicServiceTime,
      servingTokens: servingTokens.length,
      waitingTokens: waitingTokens.length,
      calculationTime: new Date()
    }
  }

  // Predict wait time for new booking
  static async predictWaitTime(branchId, departmentId, scheduledTime) {
    const department = await Department.findById(departmentId)
    const avgServiceTime = department?.averageServiceTime || 15

    // Get tokens scheduled before this time
    const tokensBefore = await Token.countDocuments({
      branchId,
      departmentId,
      status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.SERVING] },
      scheduledTime: { $lt: scheduledTime }
    })

    // Get current queue length
    const currentQueue = await Token.countDocuments({
      branchId,
      departmentId,
      status: TOKEN_STATUS.WAITING
    })

    // Estimate wait time
    const estimatedWaitTime = (tokensBefore + currentQueue) * avgServiceTime

    return {
      estimatedWaitTime,
      queuePosition: tokensBefore + currentQueue + 1,
      avgServiceTime,
      predictionTime: new Date()
    }
  }

  // Update ETA for all tokens in branch
  static async updateBranchETA(branchId) {
    const departments = await Department.find({ branchId })
    const results = {}

    for (const department of departments) {
      try {
        const departmentETA = await this.calculateRealTimeETA(branchId, department._id)
        results[department._id] = departmentETA
      } catch (error) {
        console.error(`Error calculating ETA for department ${department._id}:`, error)
        results[department._id] = { error: error.message }
      }
    }

    return {
      branchId,
      results,
      updateTime: new Date()
    }
  }

  // Get ETA statistics for a department
  static async getETAStatistics(branchId, departmentId, startDate, endDate) {
    const tokens = await Token.find({
      branchId,
      departmentId,
      createdAt: { $gte: startDate, $lte: endDate }
    })

    const statistics = {
      totalTokens: tokens.length,
      avgWaitTime: 0,
      avgServiceTime: 0,
      accuracy: 0,
      waitTimeDistribution: {},
      serviceTimeDistribution: {}
    }

    if (tokens.length === 0) {
      return statistics
    }

    // Calculate averages
    const waitTimes = tokens
      .filter(t => t.estimatedWaitTime !== undefined)
      .map(t => t.estimatedWaitTime)

    const serviceTimes = tokens
      .filter(t => t.actualServiceTime !== undefined)
      .map(t => t.actualServiceTime)

    statistics.avgWaitTime = waitTimes.length > 0 ? 
      waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length : 0

    statistics.avgServiceTime = serviceTimes.length > 0 ? 
      serviceTimes.reduce((sum, time) => sum + time, 0) / serviceTimes.length : 0

    // Calculate accuracy (how close were estimates to actuals)
    const completedTokens = tokens.filter(t => 
      t.estimatedWaitTime !== undefined && 
      t.actualServiceTime !== undefined
    )

    if (completedTokens.length > 0) {
      const errors = completedTokens.map(token => 
        Math.abs(token.estimatedWaitTime - token.actualServiceTime)
      )
      statistics.accuracy = 100 - (errors.reduce((sum, error) => sum + error, 0) / errors.length)
    }

    // Create distribution buckets
    const waitTimeBuckets = [0, 5, 10, 15, 30, 60, Infinity]
    const serviceTimeBuckets = [0, 5, 10, 15, 30, 60, Infinity]

    waitTimes.forEach(time => {
      const bucket = waitTimeBuckets.findIndex((limit, index) => 
        time >= limit && time < waitTimeBuckets[index + 1]
      )
      const bucketLabel = bucket === -1 ? '60+' : `${waitTimeBuckets[bucket]}-${waitTimeBuckets[bucket + 1]}`
      statistics.waitTimeDistribution[bucketLabel] = (statistics.waitTimeDistribution[bucketLabel] || 0) + 1
    })

    serviceTimes.forEach(time => {
      const bucket = serviceTimeBuckets.findIndex((limit, index) => 
        time >= limit && time < serviceTimeBuckets[index + 1]
      )
      const bucketLabel = bucket === -1 ? '60+' : `${serviceTimeBuckets[bucket]}-${serviceTimeBuckets[bucket + 1]}`
      statistics.serviceTimeDistribution[bucketLabel] = (statistics.serviceTimeDistribution[bucketLabel] || 0) + 1
    })

    return statistics
  }
}

export default ETACalculator
