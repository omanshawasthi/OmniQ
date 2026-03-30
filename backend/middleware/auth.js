import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

// Mock users matching mockAuthController (fallback for non-ObjectId IDs)
const MOCK_USERS = [
  { _id: '000000000000000000000001', id: '000000000000000000000001', name: 'Admin User',    email: 'admin@queueless.com',    role: 'ADMIN',    isActive: true },
  { _id: '000000000000000000000002', id: '000000000000000000000002', name: 'Staff User',    email: 'staff@queueless.com',    role: 'STAFF',    isActive: true },
  { _id: '000000000000000000000003', id: '000000000000000000000003', name: 'Operator User', email: 'operator@queueless.com', role: 'OPERATOR', isActive: true },
  { _id: '000000000000000000000004', id: '000000000000000000000004', name: 'Regular User',  email: 'user@queueless.com',     role: 'USER',     isActive: true },
];

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Check if it's one of our mock users first (since their IDs are now valid ObjectIds too)
    const mockUser = MOCK_USERS.find(u => u._id === userId);
    if (mockUser) {
      if (!mockUser.isActive) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
      }
      req.user = mockUser;
      return next();
    }

    // Otherwise query the real DB
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findById(userId).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
      }
      req.user = user;
      return next();
    }

    // Invalid token structure
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid.' 
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};
