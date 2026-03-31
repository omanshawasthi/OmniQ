import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole
} from '../src/controllers/userController.js';
import { asyncHandler } from '../src/middleware/errorHandler.js';
import User from '../src/models/User.js';
import { AuthService } from '../src/services/authService.js';

const router = express.Router();

// All routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Core CRUD
router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Role management
router.put('/:id/role', updateUserRole);

// Activate / Deactivate user account
router.put('/:id/activate', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deactivation
  if (id === req.user._id?.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
  }

  const user = await AuthService.activateUser(id, req.user._id);
  res.status(200).json({ success: true, message: 'User activated successfully', data: { user } });
}));

router.put('/:id/deactivate', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deactivation
  if (id === req.user._id?.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
  }

  const user = await AuthService.deactivateUser(id, req.user._id);
  res.status(200).json({ success: true, message: 'User deactivated successfully', data: { user } });
}));

export default router;
