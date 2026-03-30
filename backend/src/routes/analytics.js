import express from 'express'
import { authenticate, requirePermission } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import {
  getDashboardAnalytics,
  getTokenAnalytics,
  getDepartmentAnalytics,
  getBranchAnalytics,
  getPerformanceAnalytics,
  exportAnalytics
} from '../controllers/analyticsController.js'
import { validateQuery } from '../middleware/validation.js'

const router = express.Router()

// All routes require authentication and analytics permission
router.use(authenticate)
router.use(requirePermission('view_analytics'))

// Dashboard analytics
router.get('/dashboard', validateQuery(), asyncHandler(getDashboardAnalytics))

// Token analytics
router.get('/tokens', validateQuery(), asyncHandler(getTokenAnalytics))

// Department analytics
router.get('/departments', validateQuery(), asyncHandler(getDepartmentAnalytics))

// Branch analytics
router.get('/branches', validateQuery(), asyncHandler(getBranchAnalytics))

// Performance analytics
router.get('/performance', validateQuery(), asyncHandler(getPerformanceAnalytics))

// Export analytics
router.get('/export', validateQuery(), asyncHandler(exportAnalytics))

export default router
