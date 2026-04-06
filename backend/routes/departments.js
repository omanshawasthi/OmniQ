import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment
} from '../src/controllers/departmentController.js';

const router = express.Router();

// Allow authenticated users to fetch departments
router.get('/', authenticate, getDepartments);
router.get('/:id', authenticate, getDepartment);

// Restrict creating, updating, and deleting to ADMIN and STAFF
router.use(authenticate, authorize('ADMIN', 'STAFF'));

router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
