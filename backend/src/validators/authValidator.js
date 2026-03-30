import Joi from 'joi'

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
  
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required'
  }),
  
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow('').optional().messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }),
  
  password: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required'
  }),
  
  role: Joi.string().lowercase().valid('user', 'staff', 'operator', 'admin').optional().messages({
    'any.only': 'Role must be one of: user, staff, operator, admin'
  })
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required'
  }),
  
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
})

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters'
  }),
  
  email: Joi.string().email().optional().messages({
    'string.email': 'Please enter a valid email address'
  }),
  
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).allow('').optional().messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }),
  
  preferences: Joi.object({
    emailNotifications: Joi.boolean().optional(),
    smsNotifications: Joi.boolean().optional()
  }).optional()
})

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required'
  }),
  
  newPassword: Joi.string().min(6).max(128).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 6 characters',
    'string.max': 'New password cannot exceed 128 characters',
    'any.required': 'New password is required'
  })
})

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required',
    'any.required': 'Refresh token is required'
  })
})
