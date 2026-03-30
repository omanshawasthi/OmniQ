import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { ROLE_PERMISSIONS } from '../utils/constants.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ success: false, message: 'Invalid token structure.' });
    }

    // Query the real DB
    const user = await User.findById(userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token or user not found.' });
    }
    
    req.user = user;
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid or expired.' 
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const allowedRoles = roles.map(r => r.toUpperCase());

    if (roles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    if (!permissions.includes('*') && !permissions.includes(permission)) {
      return res.status(403).json({ 
        success: false, 
        message: `Permission '${permission}' required.` 
      });
    }

    next();
  };
};

export const requireAnyRole = (...roles) => authorize(...roles);
