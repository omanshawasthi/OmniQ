import User from '../models/User.js'
import Token from '../models/Token.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { AuthService } from '../services/authService.js'

// Get all users
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, isActive, branchId } = req.query

  const query = {}
  
  if (role) query.role = role
  if (isActive !== undefined) query.isActive = isActive === 'true'
  if (branchId) query.assignedBranch = branchId
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ]
  }

  const users = await User.find(query)
    .populate('assignedBranch', 'name')
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  const total = await User.countDocuments(query)

  res.status(200).json({
    success: true,
    data: {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    }
  })
})

// Get single user
export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await User.findById(id)
    .populate('assignedBranch', 'name address phone')
    .select('-password')

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  res.status(200).json({
    success: true,
    data: { user }
  })
})

// Create new user
export const createUser = asyncHandler(async (req, res) => {
  const userData = req.body
  
  const user = await AuthService.createUser(userData, req.user)

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user }
  })
})

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updateData = req.body
  
  // Remove sensitive fields that shouldn't be updated directly
  delete updateData.password
  delete updateData.role

  const user = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('assignedBranch', 'name')
   .select('-password')

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user }
  })
})

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await User.findById(id)

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  // Check if user has active tokens
  const activeTokens = await Token.countDocuments({
    userId: id,
    status: { $in: ['waiting', 'serving'] }
  })

  if (activeTokens > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete user with active tokens'
    })
  }

  await User.findByIdAndDelete(id)

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  })
})

// Get user statistics
export const getUserStats = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { startDate, endDate } = req.query

  const query = { userId: id }
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  const [
    totalTokens,
    completedTokens,
    missedTokens,
    avgWaitTime,
    avgServiceTime
  ] = await Promise.all([
    Token.countDocuments(query),
    Token.countDocuments({ ...query, status: 'completed' }),
    Token.countDocuments({ ...query, status: 'missed' }),
    Token.aggregate([
      { $match: query },
      { $group: { _id: null, avgWaitTime: { $avg: '$estimatedWaitTime' } } }
    ]),
    Token.aggregate([
      { $match: { ...query, status: 'completed' } },
      { $group: { _id: null, avgServiceTime: { $avg: '$actualServiceTime' } } }
    ])
  ])

  const stats = {
    totalTokens,
    completedTokens,
    missedTokens,
    completionRate: totalTokens > 0 ? (completedTokens / totalTokens) * 100 : 0,
    noShowRate: totalTokens > 0 ? (missedTokens / totalTokens) * 100 : 0,
    averageWaitTime: avgWaitTime[0]?.avgWaitTime || 0,
    averageServiceTime: avgServiceTime[0]?.avgServiceTime || 0
  }

  res.status(200).json({
    success: true,
    data: { stats }
  })
})

// Update user role
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { role, assignedBranch } = req.body

  const user = await AuthService.updateUserRole(id, {
    role,
    assignedBranch
  }, req.user)

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: { user }
  })
})
