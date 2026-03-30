import express from 'express'
import { authenticate, authorize, requirePermission } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  updateUserRole
} from '../controllers/userController.js'
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema
} from '../validators/userValidator.js'
import { validate, validateQuery } from '../middleware/validation.js'
import { ROLES } from '../utils/constants.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get users (with filtering)
router.get('/', 
  validateQuery(userQuerySchema), 
  requirePermission('view_users'), 
  asyncHandler(getUsers)
)

// Get single user
router.get('/:id', asyncHandler(getUser))

// Create user (admin only)
router.post('/', 
  authorize(ROLES.ADMIN), 
  validate(createUserSchema), 
  asyncHandler(createUser)
)

// Update user
router.put('/:id', 
  validate(updateUserSchema), 
  asyncHandler(updateUser)
)

// Delete user (admin only)
router.delete('/:id', 
  authorize(ROLES.ADMIN), 
  asyncHandler(deleteUser)
)

// Get user statistics
router.get('/:id/stats', 
  requirePermission('view_analytics'), 
  asyncHandler(getUserStats)
)

// Update user role (admin only)
router.put('/:id/role', 
  authorize(ROLES.ADMIN), 
  asyncHandler(updateUserRole)
)

export default router
