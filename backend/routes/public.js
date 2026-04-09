import express from 'express';
import { getPublicQueueData } from '../src/controllers/publicController.js';
import { getBranches } from '../src/controllers/branchController.js';
import { asyncHandler } from '../src/middleware/errorHandler.js';

const router = express.Router();

/**
 * Get all active branches (Public/Guest access)
 * GET /api/public/branches
 */
router.get('/branches', asyncHandler(getBranches));

/**
 * Get public queue data for display (Now Serving + Up Next)
 * GET /api/public/display/:branchId/:departmentId
 */
router.get('/display/:branchId/:departmentId', asyncHandler(getPublicQueueData));

export default router;
