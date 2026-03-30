import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  bookToken,
  getMyTokens,
  getToken,
  cancelToken,
  getQueueStatus,
  checkInToken,
  createWalkInToken,
  searchTokens,
  getTokenStats
} from '../src/controllers/tokenController.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Book online token
router.post('/book', bookToken);

// Create walk-in token
router.post('/walk-in', createWalkInToken);

// Get user's tokens
router.get('/my-tokens', getMyTokens);

// Get queue status for branch/department
router.get('/queue/:branchId/:departmentId?', getQueueStatus);

// Get token by ID
router.get('/:id', getToken);

// Check in token
router.put('/:id/checkin', checkInToken);

// Cancel token
router.put('/:id/cancel', cancelToken);

// Search tokens
router.get('/search', searchTokens);

// Get token statistics
router.get('/stats', getTokenStats);

export default router;
