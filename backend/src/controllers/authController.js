import User from '../models/User.js'
import { generateTokens, verifyRefreshToken } from '../config/jwt.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Register new user
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'user' } = req.body

  // Check if user already exists
  const query = { email }
  if (phone && phone.trim() !== '') {
    query.$or = [{ email }, { phone: phone.trim() }]
  }

  const existingUser = await User.findOne(phone && phone.trim() !== '' ? { 
    $or: [{ email }, { phone: phone.trim() }] 
  } : { email })

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
    })
  }

  // Create new user
  const user = new User({
    name,
    email,
    phone: phone && phone.trim() !== '' ? phone.trim() : null,
    password,
    role: role.toLowerCase()
  })

  await user.save()

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.role)

  // Update last login
  user.lastLogin = new Date()
  await user.save()

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    }
  })
})

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Find user with password
  const user = await User.findOne({ email }).select('+password')

  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    })
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password)

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    })
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id, user.role)

  // Update last login
  user.lastLogin = new Date()
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    }
  })
})

// Refresh access token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    })
  }

  try {
    const decoded = verifyRefreshToken(refreshToken)
    
    // Find user
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }

    // Generate new tokens
    const tokens = generateTokens(user._id, user.role)

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    })
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    })
  }
})

// Get user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('assignedBranch', 'name address phone')
    .populate('assignedCounter', 'name departmentId')

  res.status(200).json({
    success: true,
    data: {
      user: user.toSafeObject()
    }
  })
})

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, preferences } = req.body
  const userId = req.user._id

  // Check if email is being changed and if it's already taken
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      })
    }
  }

  // Check if phone is being changed and if it's already taken
  if (phone && phone !== req.user.phone) {
    const existingUser = await User.findOne({ 
      phone: phone !== '' ? phone : null, 
      _id: { $ne: userId } 
    })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      })
    }
  }

  // Update user
  const updateData = {}
  if (name) updateData.name = name
  if (email) updateData.email = email
  if (phone !== undefined) updateData.phone = phone !== '' ? phone : null
  if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences }

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).populate('assignedBranch', 'name address phone')
   .populate('assignedCounter', 'name departmentId')

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.toSafeObject()
    }
  })
})

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user._id

  // Get user with password
  const user = await User.findById(userId).select('+password')

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword)

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    })
  }

  // Update password
  user.password = newPassword
  await user.save()

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  })
})

// Logout user
export const logout = asyncHandler(async (req, res) => {
  // In a real implementation, you might want to invalidate the refresh token
  // by storing it in a blacklist or using a token version
  
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  })
})
