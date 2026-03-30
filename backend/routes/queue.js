import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getQueueStatus,
  callNextToken,
  skipToken,
  holdToken,
  completeToken,
  recallToken,
  checkInToken
} from '../src/controllers/queueController.js';
import { createWalkInToken } from '../src/controllers/tokenController.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Get queue status (accessible to all authenticated users)
router.get('/:branchId/:departmentId?', getQueueStatus);

// Staff and Operator permissions for queue control
router.use(authorize('STAFF', 'OPERATOR', 'ADMIN'));

// Create walk-in token
router.post('/walk-in', createWalkInToken);

// Call next token
router.post('/call-next', callNextToken);

// Skip token
router.put('/:id/skip', skipToken);

// Hold token
router.put('/:id/hold', holdToken);

// Complete token
router.put('/:id/complete', completeToken);

// Recall token
router.put('/:id/recall', recallToken);

// Check in token
router.put('/:id/checkin', checkInToken);

export default router;
