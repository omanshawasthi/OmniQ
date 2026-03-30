import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Notification routes (placeholder)
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notifications endpoint - coming soon',
    data: []
  });
});

export default router;
