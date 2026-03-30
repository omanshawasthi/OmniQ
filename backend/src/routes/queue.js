import express from 'express'
import { authenticate, authorize, requirePermission } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import {
  getQueueStatus,
  callNextToken,
  skipToken,
  holdToken,
  completeToken,
  recallToken,
  checkInToken
} from '../controllers/queueController.js'
import {
  queueActionSchema,
  queueStatusSchema
} from '../validators/tokenValidator.js'
import { validate, validateParams } from '../middleware/validation.js'
import { ROLES } from '../utils/constants.js'

const router = express.Router()

// Protected routes
router.use(authenticate)

// Get queue status (accessible to all authenticated users)
router.get('/status/:branchId', 
  validateParams(queueStatusSchema.keys({ branchId: 1 })), 
  asyncHandler(getQueueStatus)
)

router.get('/status/:branchId/:departmentId', 
  validateParams(queueStatusSchema), 
  asyncHandler(getQueueStatus)
)

// Queue operations (staff, operator, admin)
router.post('/call-next', 
  authorize(ROLES.STAFF, ROLES.OPERATOR, ROLES.ADMIN), 
  validate(queueActionSchema.keys({ action: 1, counterId: 1 })), 
  asyncHandler(callNextToken)
)

router.post('/skip/:id', 
  authorize(ROLES.STAFF, ROLES.OPERATOR, ROLES.ADMIN), 
  validate(queueActionSchema.keys({ action: 1, reason: 1 })), 
  asyncHandler(skipToken)
)

router.post('/hold/:id', 
  authorize(ROLES.STAFF, ROLES.OPERATOR, ROLES.ADMIN), 
  validate(queueActionSchema.keys({ action: 1, reason: 1 })), 
  asyncHandler(holdToken)
)

router.post('/complete/:id', 
  authorize(ROLES.OPERATOR, ROLES.ADMIN), 
  validate(queueActionSchema.keys({ action: 1, serviceTime: 1 })), 
  asyncHandler(completeToken)
)

router.post('/recall/:id', 
  authorize(ROLES.STAFF, ROLES.OPERATOR, ROLES.ADMIN), 
  validate(queueActionSchema.keys({ action: 1 })), 
  asyncHandler(recallToken)
)

router.post('/check-in/:id', 
  authorize(ROLES.STAFF, ROLES.OPERATOR, ROLES.ADMIN), 
  validate(queueActionSchema.keys({ action: 1 })), 
  asyncHandler(checkInToken)
)

export default router
