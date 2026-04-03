import express from 'express';
import { getPublicQueueData } from '../controllers/publicController.js';
import { asyncHandler } from '../src/middleware/errorHandler.js';

const router = express.Router();

/**
 * Get public queue data for display (Now Serving + Up Next)
 * GET /api/public/display/:branchId/:departmentId
 */
router.get('/display/:branchId/:departmentId', asyncHandler(getPublicQueueData));

export default router;
