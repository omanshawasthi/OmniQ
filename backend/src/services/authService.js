import User from '../models/User.js'
import { generateTokens } from '../config/jwt.js'
import { sendEmail, emailTemplates } from '../config/nodemailer.js'

export class AuthService {
  // Create user with role assignment
  static async createUser(userData, createdBy = null) {
    const { name, email, phone, password, role = 'user', assignedBranch, assignedCounter } = userData

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone: phone && phone !== '' ? phone : null }] 
    })

    if (existingUser) {
      throw new Error(existingUser.email === email ? 'Email already registered' : 'Phone number already registered')
    }

    // Validate role assignments
    if (role === 'staff' && !assignedBranch) {
      throw new Error('Staff users must be assigned to a branch')
    }

    if (role === 'operator' && (!assignedBranch || !assignedCounter)) {
      throw new Error('Operator users must be assigned to both branch and counter')
    }

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      password,
      role,
      assignedBranch: role === 'staff' || role === 'operator' ? assignedBranch : null,
      assignedCounter: role === 'operator' ? assignedCounter : null
    })

    await user.save()

    // Send welcome email for regular users
    if (role === 'user') {
      try {
        await sendEmail({
          to: email,
          subject: 'Welcome to Queueless',
          html: emailTemplates.welcome(name)
        })
      } catch (emailError) {
        console.error('Welcome email failed:', emailError)
        // Don't fail the registration if email fails
      }
    }

    return user.toSafeObject()
  }

  // Update user role and assignments
  static async updateUserRole(userId, roleData, updatedBy) {
    const { role, assignedBranch, assignedCounter } = roleData

    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Validate role assignments
    if (role === 'staff' && !assignedBranch) {
      throw new Error('Staff users must be assigned to a branch')
    }

    if (role === 'operator' && (!assignedBranch || !assignedCounter)) {
      throw new Error('Operator users must be assigned to both branch and counter')
    }

    // Update user
    user.role = role
    user.assignedBranch = (role === 'staff' || role === 'operator') ? assignedBranch : null
    user.assignedCounter = role === 'operator' ? assignedCounter : null

    await user.save()

    return user.toSafeObject()
  }

  // Deactivate user
  static async deactivateUser(userId, deactivatedBy) {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    user.isActive = false
    await user.save()

    return user.toSafeObject()
  }

  // Activate user
  static async activateUser(userId, activatedBy) {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    user.isActive = true
    await user.save()

    return user.toSafeObject()
  }

  // Get users by role
  static async getUsersByRole(role, branchId = null) {
    const query = { role }
    
    if (branchId) {
      query.assignedBranch = branchId
    }

    const users = await User.find(query)
      .populate('assignedBranch', 'name address')
      .populate('assignedCounter', 'name departmentId')
      .sort({ createdAt: -1 })

    return users.map(user => user.toSafeObject())
  }

  // Get user statistics
  static async getUserStatistics(branchId = null) {
    const matchStage = {}
    
    if (branchId) {
      matchStage.assignedBranch = branchId
    }

    const stats = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ])

    return stats.reduce((acc, stat) => {
      acc[stat._id] = {
        total: stat.count,
        active: stat.active
      }
      return acc
    }, {})
  }

  // Reset password
  static async resetPassword(email) {
    const user = await User.findOne({ email })
    
    if (!user) {
      throw new Error('User not found')
    }

    // Generate reset token (this would be implemented in JWT config)
    const resetToken = generateResetToken(user._id)
    
    // Save reset token to user
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    // Send reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset - Queueless',
        html: emailTemplates.passwordReset(resetToken)
      })
    } catch (emailError) {
      console.error('Password reset email failed:', emailError)
      throw new Error('Failed to send password reset email')
    }

    return { message: 'Password reset email sent' }
  }

  // Verify reset token
  static async verifyResetToken(token) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) {
      throw new Error('Invalid or expired reset token')
    }

    return user
  }

  // Set new password
  static async setNewPassword(token, newPassword) {
    const user = await this.verifyResetToken(token)

    user.password = newPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return { message: 'Password reset successful' }
  }

  // Update last login
  static async updateLastLogin(userId) {
    await User.findByIdAndUpdate(userId, {
      lastLogin: new Date()
    })
  }
}
