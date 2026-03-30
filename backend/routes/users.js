import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// User management routes (placeholder)
router.get('/', authorize('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Users endpoint - coming soon',
    data: []
  });
});

export default router;
