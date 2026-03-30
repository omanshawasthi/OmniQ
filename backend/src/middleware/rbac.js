import { ROLES, ROLE_PERMISSIONS } from '../utils/constants.js'

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    if (allowedRoles.length === 0) {
      return next() // No role restriction
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || []
    
    if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' required`
      })
    }

    next()
  }
}

export const requireAnyRole = (...roles) => {
  return authorize(...roles)
}

export const requireAdmin = authorize(ROLES.ADMIN)
export const requireOperator = authorize(ROLES.OPERATOR)
export const requireStaff = authorize(ROLES.STAFF)
export const requireUser = authorize(ROLES.USER)

// Check if user can access specific resource
export const canAccessResource = (resourceType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    // Admin can access everything
    if (req.user.role === ROLES.ADMIN) {
      return next()
    }

    // Check resource-specific permissions
    switch (resourceType) {
      case 'own_profile':
        // Users can only access their own profile
        if (req.user.role === ROLES.USER && req.params.id !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Can only access own profile'
          })
        }
        break
        
      case 'branch_resources':
        // Staff and operators can only access their assigned branch
        if ((req.user.role === ROLES.STAFF || req.user.role === ROLES.OPERATOR) && 
            req.user.assignedBranch) {
          // This would be checked in the controller with the actual branch ID
        }
        break
        
      case 'counter_resources':
        // Operators can only access their assigned counter
        if (req.user.role === ROLES.OPERATOR && req.user.assignedCounter) {
          // This would be checked in the controller with the actual counter ID
        }
        break
        
      default:
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions for this resource'
        })
    }

    next()
  }
}
