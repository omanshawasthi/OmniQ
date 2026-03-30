import express from 'express'
import { authenticate, authorize, requirePermission } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import {
  bookToken,
  createWalkInToken,
  getMyTokens,
  getToken,
  cancelToken,
  searchTokens,
  getTokenStats
} from '../controllers/tokenController.js'
import {
  bookTokenSchema,
  walkInTokenSchema,
  tokenQuerySchema,
  searchTokenSchema
} from '../validators/tokenValidator.js'
import { validate, validateQuery } from '../middleware/validation.js'
import { ROLES } from '../utils/constants.js'

const router = express.Router()

// Public routes would go here if any

// Protected routes
router.use(authenticate)

// User routes
router.post('/book', validate(bookTokenSchema), asyncHandler(bookToken))
router.get('/my-tokens', validateQuery(tokenQuerySchema), asyncHandler(getMyTokens))
router.get('/search', validateQuery(searchTokenSchema), asyncHandler(searchTokens))
router.get('/stats', requirePermission('view_queue_status'), asyncHandler(getTokenStats))

// Token specific routes
router.get('/:id', asyncHandler(getToken))
router.put('/:id/cancel', asyncHandler(cancelToken))

// Staff/Admin routes
router.post('/walk-in', 
  authorize(ROLES.STAFF, ROLES.ADMIN), 
  validate(walkInTokenSchema), 
  asyncHandler(createWalkInToken)
)

export default router
