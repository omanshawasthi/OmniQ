import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout
} from '../controllers/authController.js'
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  refreshTokenSchema
} from '../validators/authValidator.js'
import { validate } from '../middleware/validation.js'

const router = express.Router()

// Public routes
router.post('/register', validate(registerSchema), asyncHandler(register))
router.post('/login', validate(loginSchema), asyncHandler(login))
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(refreshToken))

// Protected routes
router.use(authenticate) // Apply authentication to all routes below

router.get('/profile', asyncHandler(getProfile))
router.put('/profile', validate(updateProfileSchema), asyncHandler(updateProfile))
router.put('/change-password', validate(changePasswordSchema), asyncHandler(changePassword))
router.post('/logout', asyncHandler(logout))

export default router
