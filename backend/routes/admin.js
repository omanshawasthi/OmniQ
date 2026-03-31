import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getSystemOverview } from '../src/controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Dashboard overview
router.get('/overview', getSystemOverview);

export default router;
