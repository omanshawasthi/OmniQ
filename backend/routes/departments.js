import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Department management routes (placeholder)
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Departments endpoint - coming soon',
    data: []
  });
});

export default router;
