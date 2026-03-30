import Joi from 'joi';

export const validateUser = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().min(10).max(15).required(),
    role: Joi.string().valid('USER', 'STAFF', 'OPERATOR', 'ADMIN').default('USER')
  });
  return schema.validate(data);
};

export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });
  return schema.validate(data);
};

export const validateBranch = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    address: Joi.string().min(5).max(200).required(),
    phone: Joi.string().min(10).max(15).required(),
    email: Joi.string().email().required(),
    isActive: Joi.boolean().default(true)
  });
  return schema.validate(data);
};

export const validateDepartment = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500),
    estimatedServiceTime: Joi.number().min(1).max(120).required(),
    isActive: Joi.boolean().default(true)
  });
  return schema.validate(data);
};

export const validateToken = (data) => {
  const schema = Joi.object({
    user: Joi.string().required(),
    branch: Joi.string().required(),
    department: Joi.string().required(),
    serviceType: Joi.string().valid('WALK_IN', 'ONLINE').default('WALK_IN'),
    priority: Joi.number().min(1).max(10).default(1),
    notes: Joi.string().max(500)
  });
  return schema.validate(data);
};
