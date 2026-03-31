import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createCounter,
  getCounters,
  getCounter,
  updateCounter,
  deleteCounter,
  assignStaff
} from '../src/controllers/counterController.js';

const router = express.Router();

// Fetch counters (accessible to all authenticated users for queue viewing)
router.get('/', authenticate, getCounters);
router.get('/:id', authenticate, getCounter);

// Restrict CRUD and Assignments to ADMIN strictly
router.use(authenticate, authorize('ADMIN'));

router.post('/', createCounter);
router.put('/:id', updateCounter);
router.delete('/:id', deleteCounter);

// Assignment specialized route
router.post('/:id/assign', assignStaff);

export default router;
