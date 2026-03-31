import express from 'express';
import { authenticate, requireAnyRole } from '../middleware/auth.js';
import { getTodayQueueStats, getTodayQueue, createWalkInToken } from '../src/controllers/staffController.js';
import {
  callNext,
  serveToken,
  completeToken,
  skipToken,
  holdToken,
  recallToken,
  markMissed,
  checkIn
} from '../src/controllers/queueActionController.js';

const router = express.Router();

// All routes require authentication and STAFF/ADMIN role
router.use(authenticate, requireAnyRole('STAFF', 'ADMIN'));

// ─── Dashboard & Queue View ───────────────────────────────────────────────────
router.get('/stats/today',  getTodayQueueStats);
router.get('/queue/today',  getTodayQueue);

// ─── Walk-in Creation ─────────────────────────────────────────────────────────
router.post('/walk-in', createWalkInToken);

// ─── Queue Lifecycle Actions ──────────────────────────────────────────────────
router.post('/queue/call-next',          callNext);
router.post('/queue/:tokenId/serve',     serveToken);
router.post('/queue/:tokenId/complete',  completeToken);
router.post('/queue/:tokenId/skip',      skipToken);
router.post('/queue/:tokenId/hold',      holdToken);
router.post('/queue/:tokenId/recall',    recallToken);
router.post('/queue/:tokenId/missed',    markMissed);
router.post('/queue/:tokenId/check-in',  checkIn);

export default router;
