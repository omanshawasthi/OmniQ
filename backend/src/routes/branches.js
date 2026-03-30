import express from 'express'
import { authenticate, authorize, requirePermission } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch,
  getBranchStats
} from '../controllers/branchController.js'
import {
  createBranchSchema,
  updateBranchSchema,
  branchQuerySchema
} from '../validators/branchValidator.js'
import { validate, validateQuery } from '../middleware/validation.js'
import { ROLES } from '../utils/constants.js'

const router = express.Router()

// Public routes
router.get('/', validateQuery(branchQuerySchema), asyncHandler(getBranches))
router.get('/:id', asyncHandler(getBranch))

// Protected routes
router.use(authenticate)

// Admin only routes
router.post('/', 
  authorize(ROLES.ADMIN), 
  validate(createBranchSchema), 
  asyncHandler(createBranch)
)

router.put('/:id', 
  authorize(ROLES.ADMIN), 
  validate(updateBranchSchema), 
  asyncHandler(updateBranch)
)

router.delete('/:id', 
  authorize(ROLES.ADMIN), 
  asyncHandler(deleteBranch)
)

router.get('/:id/stats', 
  requirePermission('view_analytics'), 
  asyncHandler(getBranchStats)
)

export default router
