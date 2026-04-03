import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createBranch,
  getBranches,
  getBranch,
  updateBranch,
  deleteBranch,
  getBranchStats,
  getBranchDepartments
} from '../src/controllers/branchController.js';

const router = express.Router();

// Allow authenticated users to fetch branches and their departments
router.get('/', authenticate, getBranches);
router.get('/:id', authenticate, getBranch);
router.get('/:id/departments', authenticate, getBranchDepartments);
router.get('/:id/stats', authenticate, authorize('ADMIN'), getBranchStats); // Stats maybe admin only

// Restrict creating, updating, deleting to ADMIN strictly
router.use(authenticate, authorize('ADMIN'));

router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;
