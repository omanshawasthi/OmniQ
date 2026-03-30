import Token from '../models/Token.js'
import User from '../models/User.js'
import Branch from '../models/Branch.js'
import Department from '../models/Department.js'
import Counter from '../models/Counter.js'
import QueueLog from '../models/QueueLog.js'
import { BOOKING_TYPE, TOKEN_PRIORITY, TOKEN_STATUS } from '../utils/constants.js'
import QRCode from 'qrcode'
import mongoose from 'mongoose'
import AppError from '../utils/AppError.js'

export class TokenService {
  // Generate unique token number with concurrency safety
  static async generateTokenNumber(branchId, departmentId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get department prefix (first letter of department name)
    const department = await Department.findById(departmentId)
    const prefix = department ? department.name.charAt(0).toUpperCase() : 'A'
    
    // Use atomic counter for concurrency safety
    const counterKey = `${branchId}_${departmentId}_${today.getTime()}`
    
    // Use findOneAndUpdate with upsert for atomic counter increment
    // MongoDB driver v5+ returns document directly (not wrapped in .value)
    const counterDoc = await mongoose.connection.db.collection('tokenCounters').findOneAndUpdate(
      { key: counterKey },
      { $inc: { sequence: 1 }, $setOnInsert: { key: counterKey, date: today } },
      { upsert: true, returnDocument: 'after' }
    )
    
    // Handle both driver versions: v5+ returns doc directly, older returns { value: doc }
    const counterResult = counterDoc?.value ?? counterDoc
    const sequence = counterResult?.sequence ?? 1
    const tokenNumber = `${prefix}${String(sequence).padStart(3, '0')}`
    
    // Double-check uniqueness (rare but possible)
    const existingToken = await Token.findOne({ tokenNumber })
    if (existingToken) {
      // If collision occurs, increment again
      const retryDoc = await mongoose.connection.db.collection('tokenCounters').findOneAndUpdate(
        { key: counterKey },
        { $inc: { sequence: 1 } },
        { returnDocument: 'after' }
      )
      const retryResult = retryDoc?.value ?? retryDoc
      const retrySequence = retryResult?.sequence ?? sequence + 1
      return `${prefix}${String(retrySequence).padStart(3, '0')}`
    }
    
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

  // Book online token
  static async bookToken(userId, tokenData) {
    const { branchId, departmentId, scheduledTime, priority = TOKEN_PRIORITY.NORMAL, notes } = tokenData

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

    // Generate token number and QR code
    const tokenNumber = await this.generateTokenNumber(branchId, departmentId)
    const qrCode = await this.generateQRCode('temp') // Will be updated after token creation

    // Create token
    const token = new Token({
      tokenNumber,
      userId,
      branchId,
      departmentId,
      bookingType: BOOKING_TYPE.ONLINE,
      priority,
      status: TOKEN_STATUS.WAITING,
      scheduledTime,
      notes,
      qrCode,
      estimatedWaitTime: 0 // Will be calculated by queue service
    })

    await token.save()

    // Update QR code with actual token ID
    token.qrCode = await this.generateQRCode(token._id)
    await token.save()

    // Log token creation
    await QueueLog.logAction({
      tokenId: token._id,
      action: 'created',
      performedBy: userId,
      metadata: {
        bookingType: BOOKING_TYPE.ONLINE,
        scheduledTime,
        priority
      }
    })

    // Populate related data
    await token.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'branchId', select: 'name address phone' },
      { path: 'departmentId', select: 'name description' }
    ])

    return token
  }

  // Create walk-in token
  static async createWalkInToken(tokenData, createdBy) {
    const { branchId, departmentId, userId, name, email, phone, priority = TOKEN_PRIORITY.NORMAL, notes } = tokenData

    // Validate branch and department
    const branch = await Branch.findById(branchId)
    if (!branch || !branch.isActive) {
      throw new Error('Branch not found or inactive')
    }

    const department = await Department.findById(departmentId)
    if (!department || !department.isActive) {
      throw new Error('Department not found or inactive')
    }

    // Check if department allows walk-in
    if (!department.settings.allowWalkIn) {
      throw new Error('Walk-in not allowed for this department')
    }

    let user = null

    // If userId provided, validate user
    if (userId) {
      user = await User.findById(userId)
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive')
      }

      // Check for existing active token
      const existingToken = await Token.findOne({
        userId,
        departmentId,
        status: { $in: [TOKEN_STATUS.WAITING, TOKEN_STATUS.SERVING, TOKEN_STATUS.HELD] }
      })

      if (existingToken) {
        throw new Error('User already has an active token for this department')
      }
    }

    // Generate token number and QR code
    const tokenNumber = await this.generateTokenNumber(branchId, departmentId)
    const qrCode = await this.generateQRCode('temp') // Will be updated after token creation

    // Create token
    const token = new Token({
      tokenNumber,
      userId: userId || null,
      branchId,
      departmentId,
      bookingType: BOOKING_TYPE.WALK_IN,
      priority,
      status: TOKEN_STATUS.WAITING,
      scheduledTime: new Date(),
      notes,
      qrCode,
      estimatedWaitTime: 0 // Will be calculated by queue service
    })

    // Add metadata for walk-in without user
    if (!userId) {
      token.metadata = {
        ...token.metadata,
        walkInName: name,
        walkInEmail: email,
        walkInPhone: phone
      }
    }

    await token.save()

    // Update QR code with actual token ID
    token.qrCode = await this.generateQRCode(token._id)
    await token.save()

    // Log token creation
    await QueueLog.logAction({
      tokenId: token._id,
      action: 'created',
      performedBy: createdBy._id,
      metadata: {
        bookingType: BOOKING_TYPE.WALK_IN,
        priority,
        walkInName: name,
        walkInEmail: email
      }
    })

    // Populate related data
    await token.populate([
      { path: 'userId', select: 'name email phone' },
      { path: 'branchId', select: 'name address phone' },
      { path: 'departmentId', select: 'name description' }
    ])

    return token
  }

  // Get user's tokens
  static async getUserTokens(userId, options = {}) {
    const { status, branchId, departmentId, date, page = 1, limit = 20 } = options

    const query = { userId }

    if (status) {
      // Handle comma-separated status strings from frontend ('WAITING,SERVING')
      if (typeof status === 'string' && status.includes(',')) {
        query.status = { $in: status.split(',').map(s => s.trim().toUpperCase()) }
      } else {
        query.status = typeof status === 'string' ? status.toUpperCase() : status
      }
    }

    if (branchId) {
      query.branchId = branchId
    }

    if (departmentId) {
      query.departmentId = departmentId
    }

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      query.scheduledTime = { $gte: startOfDay, $lte: endOfDay }
    }

    const tokens = await Token.find(query)
      .populate('branchId', 'name address phone')
      .populate('departmentId', 'name description')
      .populate('counterId', 'name')
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

    // If userId provided, ensure user owns the token
    if (userId) {
      query.userId = userId
    }

    const token = await Token.findOne(query)
      .populate('userId', 'name email phone')
      .populate('branchId', 'name address phone operatingHours')
      .populate('departmentId', 'name description averageServiceTime')
      .populate('counterId', 'name')

    if (!token) {
      throw new Error('Token not found')
    }

    return token
  }

  // Cancel token
  static async cancelToken(tokenId, userId) {
    const token = await Token.findOne({ _id: tokenId, userId })

    if (!token) {
      throw new Error('Token not found')
    }

    if (!token.canBeCancelled()) {
      throw new Error('Token cannot be cancelled')
    }

    const statusUpdate = token.updateStatus(TOKEN_STATUS.CANCELLED, userId)
    await token.save()

    // Log cancellation
    await QueueLog.logAction({
      tokenId: token._id,
      action: 'cancelled',
      performedBy: userId,
      metadata: statusUpdate.metadata
    })

    return token
  }

  // Search tokens
  static async searchTokens(searchQuery, options = {}) {
    const { query, branchId, departmentId, status, date, page = 1, limit = 20 } = options

    // Build search query
    const searchRegex = new RegExp(query, 'i')
    const mongoQuery = {
      $or: [
        { tokenNumber: { $regex: searchRegex } },
        { 'metadata.walkInName': { $regex: searchRegex } },
        { 'metadata.walkInEmail': { $regex: searchRegex } }
      ]
    }

    if (branchId) {
      mongoQuery.branchId = branchId
    }

    if (departmentId) {
      mongoQuery.departmentId = departmentId
    }

    if (status) {
      mongoQuery.status = status
    }

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
      .populate('counterId', 'name')
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

    if (branchId) {
      matchStage.branchId = branchId
    }

    if (departmentId) {
      matchStage.departmentId = departmentId
    }

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
}
