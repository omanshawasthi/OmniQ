import Token from '../models/Token.js'
import User from '../models/User.js'
import Branch from '../models/Branch.js'
import Department from '../models/Department.js'
import QueueLog from '../models/QueueLog.js'
import { NotificationService } from './notificationService.js'
import { BOOKING_TYPE, TOKEN_PRIORITY, TOKEN_STATUS, QUEUE_ACTIONS } from '../utils/constants.js'
import QRCode from 'qrcode'
import mongoose from 'mongoose'
import AppError from '../utils/AppError.js'
import { getStartOfToday, getDaysAgo } from '../utils/dateUtils.js'
import { QueueLifecycleService } from './queueLifecycleService.js'
import { emitToBranch, emitToUser } from '../config/socket.js'

export class TokenService {
  // Generate unique token number with concurrency safety
  static async generateTokenNumber(branchId, departmentId) {
    const today = new Date()
    const datestring = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
    today.setHours(0, 0, 0, 0)
    
    // Get department prefix (first 3 letters of name)
    const department = await Department.findById(departmentId)
    const prefix = department ? department.name.slice(0, 3).toUpperCase() : 'TK'
    
    // Use atomic counter for concurrency safety
    const counterKey = `${branchId}_${departmentId}_${today.getTime()}`
    
    const counterDoc = await mongoose.connection.db.collection('tokenCounters').findOneAndUpdate(
      { key: counterKey },
      { $inc: { sequence: 1 }, $setOnInsert: { key: counterKey, date: today } },
      { upsert: true, returnDocument: 'after' }
    )
    
    const counterResult = counterDoc?.value ?? counterDoc
    const sequence = counterResult?.sequence ?? 1
    
    // Format: DEPT-YYYYMMDD-SEQ (e.g. OPD-20260403-001)
    const tokenNumber = `${prefix}-${datestring}-${String(sequence).padStart(3, '0')}`
    
    return tokenNumber
  }

  // Generate QR code for token
  static async generateQRCode(tokenId) {
    try {
      const qrData = `${process.env.FRONTEND_URL}/token/${tokenId}`
      const qrCode = await QRCode.toDataURL(qrData)
      return qrCode
    } catch (error) {
      console.error('QR Code generation failed:', error)
      return null
    }
  }

  // Helper for computing ML readiness fields at JOIN
  static async _computeMLFields(branchId, departmentId) {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const hourOfDay = now.getHours()

    const sameDepartmentPeopleAhead = await Token.countDocuments({
      branchId,
      departmentId,
      status: TOKEN_STATUS.WAITING,
      isActiveQueue: true
    })

    return {
      joinedAt: now,
      dayOfWeek,
      hourOfDay,
      sameDepartmentPeopleAhead
    }
  }

  // Calls the Python FastAPI /predict endpoint and returns predicted wait minutes.
  // NEVER throws — token creation must succeed even if the ML API is down.
  static async _fetchMLPrediction(mlFields, branchId, departmentId, serviceType) {
    const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:8000'
    try {
      const payload = {
        branchId: branchId.toString(),
        departmentId: departmentId.toString(),
        serviceType,
        sameDepartmentPeopleAhead: mlFields.sameDepartmentPeopleAhead,
        dayOfWeek: mlFields.dayOfWeek,
        hourOfDay: mlFields.hourOfDay
      }

      // Use a 3-second timeout — never block token creation for ML
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(`${ML_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      clearTimeout(timeout)

      if (!response.ok) {
        console.warn(`[ML API] Non-200 response: ${response.status}`)
        return null
      }

      const json = await response.json()
      const predicted = parseFloat(json?.predictedWaitMinutes)
      return isNaN(predicted) ? null : predicted
    } catch (err) {
      // Silently log — never surface to caller
      console.warn(`[ML API] Prediction failed (will use fallback): ${err.message}`)
      return null
    }
  }

  // Book online token
  static async bookToken(userId, tokenData) {
    const { branchId, departmentId, scheduledTime, priority = TOKEN_PRIORITY.NORMAL, notes } = tokenData
    
    // Validate phone for online tokens if user profile is being used or updated
    // (Usually validated at user registration, but good to have here if needed)

    // Validate branch and department
    const branch = await Branch.findById(branchId)
    if (!branch || !branch.isActive) {
      throw new Error('Branch not found or inactive')
    }

    const department = await Department.findById(departmentId)
    if (!department || !department.isActive) {
      throw new Error('Department not found or inactive')
    }

    // Check if department allows online booking
    if (!department.settings.allowOnlineBooking) {
      throw new Error('Online booking not allowed for this department')
    }

    // Check if user has active token for same department
    const existingToken = await Token.findOne({
      userId,
      departmentId,
      status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.SERVING, TOKEN_STATUS.HELD] }
    })

    if (existingToken) {
      throw new AppError('You already have an active token for this department', 400)
    }

    // Generate unique ID and token number
    const tokenId = new mongoose.Types.ObjectId()
    const tokenNumber = await this.generateTokenNumber(branchId, departmentId)
    const qrCode = await this.generateQRCode(tokenId)

    const mlFields = await this._computeMLFields(branchId, departmentId)

    // Call ML prediction — fire and capture, never block token creation
    const predicted = await this._fetchMLPrediction(mlFields, branchId, departmentId, 'online')
    const predictedWaitMinutesAtJoin = predicted  // null if API unavailable
    const expectedTurnTime = (predicted != null && mlFields.joinedAt)
      ? new Date(mlFields.joinedAt.getTime() + predicted * 60 * 1000)
      : null

    // Create token
    const token = new Token({
      _id: tokenId,
      tokenNumber,
      userId,
      branchId,
      departmentId,
      bookingType: BOOKING_TYPE.ONLINE,
      priority,
      status: TOKEN_STATUS.WAITING,
      source: 'web',
      scheduledTime,
      notes,
      qrCode,
      estimatedWaitTime: predicted ?? 0,
      ...mlFields,
      predictedWaitMinutesAtJoin,
      expectedTurnTime
    })

    await token.save()

    // Log token creation
    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.CREATED,
      performedBy: userId,
      metadata: {
        bookingType: BOOKING_TYPE.ONLINE,
        scheduledTime,
        priority
      }
    })

    await token.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'branchId', select: 'name address phone' },
      { path: 'departmentId', select: 'name description' }
    ])

    // Send confirmation notification
    await NotificationService.sendBookingConfirmation({ _id: userId }, token)

    // Notify branch staff
    emitToBranch(branchId, 'queue_updated', {
      tokenId: token._id,
      action: 'created',
      tokenNumber: token.tokenNumber
    })

    return token
  }

  // Create walk-in token
  static async createWalkInToken(tokenData, createdBy) {
    const { branchId, departmentId, userId, name, email, phone, priority = TOKEN_PRIORITY.NORMAL, notes } = tokenData

    // Validate phone number (exactly 10 digits)
    if (phone) {
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        throw new AppError('Phone number must be exactly 10 digits', 400)
      }
    }

    const branch = await Branch.findById(branchId)
    if (!branch || !branch.isActive) {
      throw new Error('Branch not found or inactive')
    }

    const department = await Department.findById(departmentId)
    if (!department || !department.isActive) {
      throw new Error('Department not found or inactive')
    }

    if (!department.settings.allowWalkIn) {
      throw new Error('Walk-in not allowed for this department')
    }

    if (userId) {
      const user = await User.findById(userId)
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive')
      }

      const existingToken = await Token.findOne({
        userId,
        departmentId,
        status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.SERVING, TOKEN_STATUS.HELD] }
      })

      if (existingToken) {
        throw new Error('User already has an active token for this department')
      }
    }

    const tokenId = new mongoose.Types.ObjectId()
    const tokenNumber = await this.generateTokenNumber(branchId, departmentId)
    const qrCode = await this.generateQRCode(tokenId)

    const mlFields = await this._computeMLFields(branchId, departmentId)

    // Call ML prediction — fire and capture, never block token creation
    const predicted = await this._fetchMLPrediction(mlFields, branchId, departmentId, 'walk-in')
    const predictedWaitMinutesAtJoin = predicted
    const expectedTurnTime = (predicted != null && mlFields.joinedAt)
      ? new Date(mlFields.joinedAt.getTime() + predicted * 60 * 1000)
      : null

    const token = new Token({
      _id: tokenId,
      tokenNumber,
      userId: userId || null,
      branchId,
      departmentId,
      bookingType: BOOKING_TYPE.WALK_IN,
      priority,
      status: TOKEN_STATUS.WAITING,
      source: 'walk-in',
      scheduledTime: new Date(),
      notes,
      qrCode,
      estimatedWaitTime: predicted ?? 0,
      ...mlFields,
      predictedWaitMinutesAtJoin,
      expectedTurnTime
    })

    if (!userId) {
      token.metadata = {
        ...token.metadata,
        walkInName: name,
        walkInEmail: email,
        walkInPhone: phone
      }
    }

    await token.save()

    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.CREATED,
      performedBy: createdBy._id,
      metadata: {
        bookingType: BOOKING_TYPE.WALK_IN,
        priority,
        walkInName: name,
        walkInEmail: email
      }
    })

    await token.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'branchId', select: 'name address phone' },
      { path: 'departmentId', select: 'name description' }
    ])

    // Notify branch staff
    emitToBranch(branchId, 'queue_updated', {
      tokenId: token._id,
      action: 'created',
      tokenNumber: token.tokenNumber
    })

    return token
  }

  // Get user's tokens with historical range and auto-expiry
  static async getUserTokens(userId, options = {}) {
    // 1. Run lazy cleanup before returning history
    if (typeof QueueLifecycleService !== 'undefined' && QueueLifecycleService.expireOldTokens) {
      await QueueLifecycleService.expireOldTokens()
    }

    const { status, branchId, departmentId, date, dateRange = '30days', page = 1, limit = 50 } = options
    const query = { userId }

    if (status) {
      if (typeof status === 'string' && status.includes(',')) {
        query.status = { $in: status.split(',').map(s => s.trim().toLowerCase()) }
      } else {
        query.status = typeof status === 'string' ? status.toLowerCase() : status
      }
    }

    if (branchId) query.branchId = branchId
    if (departmentId) query.departmentId = departmentId

    // Date filtering logic
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      query.$or = [
        { queueDate: startOfDay },
        { 
          queueDate: { $exists: false },
          scheduledTime: { 
            $gte: startOfDay, 
            $lt: new Date(new Date(startOfDay).setDate(startOfDay.getDate() + 1)) 
          }
        }
      ]
    } else if (dateRange) {
      switch (dateRange) {
        case 'today':
          const today = getStartOfToday()
          query.$or = [
            { queueDate: today },
            { 
              queueDate: { $exists: false },
              scheduledTime: { $gte: today }
            }
          ]
          break;
        case '7days':
          const sevenDaysAgo = getDaysAgo(7)
          query.$or = [
            { queueDate: { $gte: sevenDaysAgo } },
            { 
              queueDate: { $exists: false },
              createdAt: { $gte: sevenDaysAgo }
            }
          ]
          break;
        case '30days':
          const thirtyDaysAgo = getDaysAgo(30)
          query.$or = [
            { queueDate: { $gte: thirtyDaysAgo } },
            { 
              queueDate: { $exists: false },
              createdAt: { $gte: thirtyDaysAgo }
            }
          ]
          break;
      }
    }

    const tokens = await Token.find(query)
      .populate('branchId', 'name address phone')
      .populate('departmentId', 'name description')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Token.countDocuments(query)

    return {
      tokens,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    }
  }

  // Get token by ID
  static async getTokenById(tokenId, userId = null) {
    const query = { _id: tokenId }
    if (userId) query.userId = userId

    const token = await Token.findOne(query)
      .populate('userId', 'name email phone')
      .populate('branchId', 'name address phone operatingHours')
      .populate('departmentId', 'name description averageServiceTime')

    if (!token) {
      throw new AppError('Token not found', 404)
    }

    return token
  }

  // Cancel token
  static async cancelToken(tokenId, userId) {
    const token = await Token.findOne({ _id: tokenId, userId })

    if (!token) {
      throw new AppError('Token not found or unauthorized access', 404)
    }

    if (!token.canBeCancelled()) {
      throw new AppError('Token cannot be cancelled at this time', 400)
    }

    const statusUpdate = token.updateStatus(TOKEN_STATUS.CANCELLED, userId)
    await token.save()

    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.CANCELLED,
      performedBy: userId,
      metadata: statusUpdate.metadata
    })

    return token
  }

  // Reschedule token
  static async rescheduleToken(tokenId, userId, newScheduledTime) {
    const token = await Token.findOne({ _id: tokenId, userId })

    if (!token) {
      throw new AppError('Token not found or unauthorized access', 404)
    }

    if (![TOKEN_STATUS.WAITING, TOKEN_STATUS.HELD].includes(token.status)) {
      throw new AppError(`Token in ${token.status} status cannot be rescheduled`, 400)
    }

    const scheduledDate = new Date(newScheduledTime)
    if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      throw new AppError('Invalid reschedule time. Must be a valid date in the future.', 400)
    }

    const oldTime = token.scheduledTime
    token.scheduledTime = scheduledDate
    
    await token.save()

    await QueueLog.logAction({
      tokenId: token._id,
      action: QUEUE_ACTIONS.RESCHEDULED,
      performedBy: userId,
      metadata: {
        oldScheduledTime: oldTime,
        newScheduledTime: scheduledDate
      }
    })

    return token
  }

  // Search tokens
  static async searchTokens(searchQuery, options = {}) {
    const { query, branchId, departmentId, status, date, page = 1, limit = 20 } = options
    const searchRegex = new RegExp(query || searchQuery, 'i')
    const mongoQuery = {
      $or: [
        { tokenNumber: { $regex: searchRegex } },
        { 'metadata.walkInName': { $regex: searchRegex } },
        { 'metadata.walkInEmail': { $regex: searchRegex } }
      ]
    }

    if (branchId) mongoQuery.branchId = branchId
    if (departmentId) mongoQuery.departmentId = departmentId
    if (status) mongoQuery.status = status

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      mongoQuery.scheduledTime = { $gte: startOfDay, $lte: endOfDay }
    }

    const tokens = await Token.find(mongoQuery)
      .populate('userId', 'name email phone')
      .populate('branchId', 'name address')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Token.countDocuments(mongoQuery)

    return {
      tokens,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    }
  }

  // Get token statistics
  static async getTokenStatistics(filters = {}) {
    const { branchId, departmentId, date } = filters
    const matchStage = {}

    if (branchId) matchStage.branchId = branchId
    if (departmentId) matchStage.departmentId = departmentId

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      matchStage.scheduledTime = { $gte: startOfDay, $lte: endOfDay }
    }

    const stats = await Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgWaitTime: { $avg: '$estimatedWaitTime' },
          avgServiceTime: { $avg: '$actualServiceTime' }
        }
      }
    ])

    const bookingTypeStats = await Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$bookingType',
          count: { $sum: 1 }
        }
      }
    ])

    return {
      statusStats: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgWaitTime: stat.avgWaitTime || 0,
          avgServiceTime: stat.avgServiceTime || 0
        }
        return acc
      }, {}),
      bookingTypeStats: bookingTypeStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count
        return acc
      }, {})
    }
  }

  // Get live queue status for a specific token
  static async getTokenLiveStatus(tokenId, userId = null) {
    const token = await this.getTokenById(tokenId, userId)
    
    if (!token) {
      throw new AppError('Token not found', 404)
    }

    const { branchId, departmentId, status, priority, scheduledTime, createdAt } = token
    let position = 0
    let peopleAhead = 0

    if (status === TOKEN_STATUS.WAITING) {
      const aheadCount = await Token.countDocuments({
        branchId,
        departmentId,
        status: TOKEN_STATUS.WAITING,
        _id: { $ne: tokenId },
        $or: [
          { priority: TOKEN_PRIORITY.HIGH, priority: { $ne: priority } },
          { 
            priority, 
            $or: [
              { scheduledTime: { $lt: scheduledTime } },
              { scheduledTime, createdAt: { $lt: createdAt } }
            ] 
          }
        ]
      })
      position = aheadCount + 1
      peopleAhead = aheadCount
    } else if (status === TOKEN_STATUS.SERVING) {
      position = 0
      peopleAhead = 0
    }

    // Get currently serving tokens for this department
    const servingTokens = await Token.find({
      branchId,
      departmentId,
      status: TOKEN_STATUS.SERVING
    }).sort({ startedServiceAt: -1 })

    const currentlyServing = servingTokens.length > 0 ? servingTokens[0] : null
    
    // Manual check for queue status since counters are gone
    // We can assume if there are staff assigned, it's active
    const assignedStaffCount = await User.countDocuments({
      assignedBranch: branchId,
      role: 'staff',
      isActive: true
    })

    let queueStatus = assignedStaffCount > 0 ? 'active' : 'inactive'
    if (servingTokens.length > 0) queueStatus = 'active'

    return {
      token,
      position,
      peopleAhead,
      currentlyServing,
      queueStatus,
      estimatedWaitTime: token.estimatedWaitTime || 0,
      refreshInterval: 30000
    }
  }
}
