import express from 'express';
import { authenticate, requireAnyRole } from '../middleware/auth.js';
import { getTodayQueueStats, getTodayQueue } from '../src/controllers/staffController.js';

const router = express.Router();

// All routes require authentication and STAFF/ADMIN role
router.use(authenticate, requireAnyRole('STAFF', 'ADMIN'));

// Get today's queue statistics
router.get('/stats/today', getTodayQueueStats);

// Get today's operational queue
router.get('/queue/today', getTodayQueue);

export default router;
