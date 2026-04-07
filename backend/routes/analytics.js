import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getDashboardAnalytics,
  getPerformanceMetrics,
  getUserAnalytics,
  getMLExport
} from '../controllers/analyticsController.js';

const router = express.Router();

// All routes are protected and require admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get dashboard analytics
router.get('/dashboard', getDashboardAnalytics);

// Get performance metrics
router.get('/performance', getPerformanceMetrics);

// Get user analytics
router.get('/users', getUserAnalytics);

// Export ML data
router.get('/ml-export', getMLExport);

export default router;
