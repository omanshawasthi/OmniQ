import Branch from '../models/Branch.js'
import Department from '../models/Department.js'
import Token from '../models/Token.js'
import User from '../models/User.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Create new branch
export const createBranch = asyncHandler(async (req, res) => {
  const {
    name,
    address,
    phone,
    email,
    adminPassword,
    operatingHours,
    settings,
    isActive = true
  } = req.body

  const branch = new Branch({
    name,
    address,
    phone,
    email,
    operatingHours,
    settings,
    isActive
  })

  await branch.save()

  // Auto-create initial staff user if email and password are provided
  if (email && adminPassword) {
    const existingUser = await User.findOne({ email })
    if (!existingUser) {
      const user = new User({
        name: `${name} Admin`,
        email,
        phone, // Optionally use branch phone or leave null
        password: adminPassword,
        role: 'staff',
        assignedBranch: branch._id,
        isActive: true
      })
      await user.save()
    }
  }

  res.status(201).json({
    success: true,
    message: 'Branch created successfully',
    data: { branch }
  })
})

// Get all branches
export const getBranches = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, isActive } = req.query

  const query = {}
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true'
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ]
  }

  const p = Math.max(1, parseInt(page) || 1)
  const l = Math.max(1, parseInt(limit) || 20)

  const branches = await Branch.find(query)
    .populate('departments') // Simplified populate for virtual
    .sort({ createdAt: -1 })
    .limit(l)
    .skip((p - 1) * l)

  const total = await Branch.countDocuments(query)

  res.status(200).json({
    success: true,
    data: {
      branches,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    }
  })
})

// Get single branch
export const getBranch = asyncHandler(async (req, res) => {
  const { id } = req.params

  const branch = await Branch.findById(id)
    .populate('departments')

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found'
    })
  }

  res.status(200).json({
    success: true,
    data: { branch }
  })
})

// Update branch
export const updateBranch = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updateData = req.body

  const branch = await Branch.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('departments')

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found'
    })
  }

  res.status(200).json({
    success: true,
    message: 'Branch updated successfully',
    data: { branch }
  })
})

// Delete branch
export const deleteBranch = asyncHandler(async (req, res) => {
  const { id } = req.params

  const branch = await Branch.findById(id)

  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found'
    })
  }

  // Check if branch has active departments
  const activeDepartmentsCount = await Department.countDocuments({
    branchId: id,
    isActive: true
  })

  if (activeDepartmentsCount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete branch with active departments'
    })
  }

  await Branch.findByIdAndDelete(id)

  res.status(200).json({
    success: true,
    message: 'Branch deleted successfully'
  })
})

// Get all departments for a specific branch
export const getBranchDepartments = asyncHandler(async (req, res) => {
  const { id } = req.params

  const branch = await Branch.findById(id)
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found'
    })
  }

  const departments = await Department.find({ branchId: id })
    .sort({ sortOrder: 1, name: 1 })

  res.status(200).json({
    success: true,
    data: { departments }
  })
})

// Get branch statistics
export const getBranchStats = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { startDate, endDate } = req.query

  const query = { branchId: id }
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  const [
    totalTokens,
    completedTokens,
    activeDepartments,
    avgWaitTime
  ] = await Promise.all([
    Token.countDocuments(query),
    Token.countDocuments({ ...query, status: 'completed' }),
    Department.countDocuments({ branchId: id, isActive: true }),
    Token.aggregate([
      { $match: query },
      { $group: { _id: null, avgWaitTime: { $avg: '$estimatedWaitTime' } } }
    ])
  ])

  const stats = {
    totalTokens,
    completedTokens,
    completionRate: totalTokens > 0 ? (completedTokens / totalTokens) * 100 : 0,
    activeDepartments,
    averageWaitTime: avgWaitTime[0]?.avgWaitTime || 0
  }

  res.status(200).json({
    success: true,
    data: { stats }
  })
})
