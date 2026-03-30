import Joi from 'joi'

export const bookTokenSchema = Joi.object({
  branchId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid branch ID',
    'any.required': 'Branch ID is required'
  }),
  
  departmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid department ID',
    'any.required': 'Department ID is required'
  }),
  
  scheduledTime: Joi.date().min('now').required().messages({
    'date.min': 'Scheduled time must be in the future',
    'any.required': 'Scheduled time is required'
  }),
  
  priority: Joi.string().valid('normal', 'high').default('normal').messages({
    'any.only': 'Priority must be either normal or high'
  }),
  
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Notes cannot exceed 500 characters'
  })
})

export const walkInTokenSchema = Joi.object({
  branchId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid branch ID',
    'any.required': 'Branch ID is required'
  }),
  
  departmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid department ID',
    'any.required': 'Department ID is required'
  }),
  
  userId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'Invalid user ID'
  }),
  
  name: Joi.string().min(2).max(100).when('userId', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required()
  }).messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required for walk-in tokens without user ID'
  }),
  
  email: Joi.string().email().when('userId', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required()
  }).messages({
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required for walk-in tokens without user ID'
  }),
  
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }),
  
  priority: Joi.string().valid('normal', 'high').default('normal').messages({
    'any.only': 'Priority must be either normal or high'
  }),
  
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Notes cannot exceed 500 characters'
  })
})

export const updateTokenSchema = Joi.object({
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Notes cannot exceed 500 characters'
  }),
  
  priority: Joi.string().valid('normal', 'high').optional().messages({
    'any.only': 'Priority must be either normal or high'
  })
})

export const tokenQuerySchema = Joi.object({
  status: Joi.string().valid('waiting', 'serving', 'held', 'skipped', 'completed', 'missed', 'cancelled').optional(),
  branchId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  departmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  date: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

export const searchTokenSchema = Joi.object({
  query: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Search query must be at least 1 character',
    'string.max': 'Search query cannot exceed 100 characters',
    'any.required': 'Search query is required'
  }),
  
  branchId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  departmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  status: Joi.string().valid('waiting', 'serving', 'held', 'skipped', 'completed', 'missed', 'cancelled').optional(),
  date: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
})

export const queueActionSchema = Joi.object({
  action: Joi.string().valid('call', 'serve', 'complete', 'skip', 'hold', 'recall', 'check-in').required().messages({
    'any.only': 'Action must be one of: call, serve, complete, skip, hold, recall, check-in',
    'any.required': 'Action is required'
  }),
  
  counterId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'Invalid counter ID'
  }),
  
  reason: Joi.string().max(500).optional().messages({
    'string.max': 'Reason cannot exceed 500 characters'
  }),
  
  serviceTime: Joi.number().min(0).max(180).optional().messages({
    'number.min': 'Service time cannot be negative',
    'number.max': 'Service time cannot exceed 180 minutes'
  })
})

export const queueStatusSchema = Joi.object({
  branchId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'Invalid branch ID',
    'any.required': 'Branch ID is required'
  }),
  
  departmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'Invalid department ID'
  }),
  
  counterId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'Invalid counter ID'
  })
})
