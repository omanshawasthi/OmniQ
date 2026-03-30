import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

// Mock user data
const mockUsers = [
  {
    _id: '000000000000000000000001',
    name: 'Admin User',
    email: 'admin@queueless.com',
    password: 'admin123',
    phone: '1234567890',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '000000000000000000000002',
    name: 'Staff User',
    email: 'staff@queueless.com',
    password: 'staff123',
    phone: '1234567891',
    role: 'STAFF',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '000000000000000000000003',
    name: 'Operator User',
    email: 'operator@queueless.com',
    password: 'operator123',
    phone: '1234567892',
    role: 'OPERATOR',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '000000000000000000000004',
    name: 'Regular User',
    email: 'user@queueless.com',
    password: 'user123',
    phone: '1234567893',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret', {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// @desc    Register user (mock)
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = mockUsers.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user (in real app, would hash password)
    const newUser = {
      _id: String(mockUsers.length + 1),
      name,
      email,
      password, // In real app, this would be hashed
      phone,
      role: role || 'USER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockUsers.push(newUser);

    // Generate tokens
    const token = generateToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    // Remove password from response
    const { password: _, ...userResponse } = newUser;

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// @desc    Login user (mock)
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    const { password: _, ...userResponse } = user;

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// @desc    Refresh token (mock)
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
    
    // Find user
    const user = mockUsers.find(u => u._id === decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// @desc    Get current user (mock)
export const getMe = async (req, res, next) => {
  try {
    const user = mockUsers.find(u => u._id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    next(error);
  }
};
