import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refreshToken,
  getMe
} from '../controllers/mockAuthController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register user
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required')
], register);

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], login);

// Refresh token
router.post('/refresh', refreshToken);

// Get current user (both /me and /profile point to same handler)
router.get('/me', authenticate, getMe);
router.get('/profile', authenticate, getMe);

export default router;
