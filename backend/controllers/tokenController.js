import Token from '../src/models/Token.js';
import User from '../src/models/User.js';
import Branch from '../src/models/Branch.js';
import Department from '../src/models/Department.js';
import QueueService from '../src/services/queueService.js';
import { validateToken } from '../src/utils/validators.js';
import { TOKEN_STATES } from '../src/utils/constants.js';
import logger from '../config/logger.js';

// @desc    Create new token (booking)
// @route   POST /api/tokens
// @access  Private
export const createToken = async (req, res, next) => {
  try {
    // Validate input
    const { error } = validateToken(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { user, branch, department, serviceType, priority, notes } = req.body;

    // Verify user exists
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify branch exists and is active
    const branchExists = await Branch.findById(branch);
    if (!branchExists || !branchExists.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found or inactive'
      });
    }

    // Verify department exists and is active
    const departmentExists = await Department.findById(department);
    if (!departmentExists || !departmentExists.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Department not found or inactive'
      });
    }

    // Check if user already has an active token in this department
    const existingToken = await Token.findOne({
      user,
      department,
      state: { $in: [TOKEN_STATES.WAITING, TOKEN_STATES.SERVING, TOKEN_STATES.HELD] }
    });

    if (existingToken) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active token in this department'
      });
    }

    // Create token
    const token = await Token.create({
      user,
      branch,
      department,
      serviceType: serviceType || 'WALK_IN',
      priority: priority || 1,
      notes,
      estimatedServiceTime: departmentExists.estimatedServiceTime
    });

    // Calculate queue position
    await QueueService.calculateQueuePosition(token._id);

    // Recalculate entire queue
    await QueueService.recalculateQueue(branch, department);

    // Log the action
    await QueueService.changeTokenState(
      token._id,
      TOKEN_STATES.WAITING,
      req.user.id,
      'Token created',
      { serviceType, priority }
    );

    // Get populated token
    const populatedToken = await Token.findById(token._id)
      .populate('user branch department');

    logger.info(`Token created: ${populatedToken.tokenNumber}`);

    res.status(201).json({
      success: true,
      message: 'Token created successfully',
      data: {
        token: populatedToken
      }
    });
  } catch (error) {
    logger.error('Create token error:', error);
    next(error);
  }
};

// @desc    Get user's tokens
// @route   GET /api/tokens/my-tokens
// @access  Private
export const getMyTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find({ user: req.user.id })
      .populate('branch department')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        tokens
      }
    });
  } catch (error) {
    logger.error('Get my tokens error:', error);
    next(error);
  }
};

// @desc    Get token by ID
// @route   GET /api/tokens/:id
// @access  Private
export const getToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id)
      .populate('user branch department counter');

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if user has permission to view this token
    if (req.user.role === 'USER' && token.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this token'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        token
      }
    });
  } catch (error) {
    logger.error('Get token error:', error);
    next(error);
  }
};

// @desc    Cancel token
// @route   PUT /api/tokens/:id/cancel
// @access  Private
export const cancelToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if user has permission to cancel this token
    if (req.user.role === 'USER' && token.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this token'
      });
    }

    // Check if token can be cancelled
    if (![TOKEN_STATES.WAITING, TOKEN_STATES.HELD].includes(token.state)) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be cancelled in current state'
      });
    }

    // Change token state
    await QueueService.changeTokenState(
      token._id,
      TOKEN_STATES.CANCELLED,
      req.user.id,
      'Token cancelled by user'
    );

    // Recalculate queue
    await QueueService.recalculateQueue(token.branch, token.department);

    const updatedToken = await Token.findById(token._id)
      .populate('user branch department');

    logger.info(`Token cancelled: ${updatedToken.tokenNumber}`);

    res.status(200).json({
      success: true,
      message: 'Token cancelled successfully',
      data: {
        token: updatedToken
      }
    });
  } catch (error) {
    logger.error('Cancel token error:', error);
    next(error);
  }
};

// @desc    Get queue status for branch/department
// @route   GET /api/tokens/queue/:branchId/:departmentId?
// @access  Private
export const getQueueStatus = async (req, res, next) => {
  try {
    const { branchId, departmentId } = req.params;

    // Verify branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    let matchQuery = { branch: branchId };
    if (departmentId) {
      matchQuery.department = departmentId;
      
      // Verify department exists
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Get queue statistics
    const stats = await QueueService.getQueueStats(branchId, departmentId);

    // Get waiting tokens
    const waitingTokens = await Token.find({
      ...matchQuery,
      state: TOKEN_STATES.WAITING
    })
    .populate('user')
    .sort({ priority: -1, createdAt: 1 })
    .limit(20);

    // Get currently serving tokens
    const servingTokens = await Token.find({
      ...matchQuery,
      state: TOKEN_STATES.SERVING
    })
    .populate('user counter')
    .sort({ serviceStartTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        stats,
        waitingTokens,
        servingTokens
      }
    });
  } catch (error) {
    logger.error('Get queue status error:', error);
    next(error);
  }
};

// @desc    Check in token
// @route   PUT /api/tokens/:id/checkin
// @access  Private
export const checkInToken = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id);

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if token can be checked in
    if (token.state !== TOKEN_STATES.WAITING) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be checked in current state'
      });
    }

    // Update check-in time
    token.checkInTime = new Date();
    await token.save();

    // Log the action
    await QueueService.changeTokenState(
      token._id,
      TOKEN_STATES.WAITING,
      req.user.id,
      'Token checked in',
      { checkInTime: token.checkInTime }
    );

    const updatedToken = await Token.findById(token._id)
      .populate('user branch department');

    logger.info(`Token checked in: ${updatedToken.tokenNumber}`);

    res.status(200).json({
      success: true,
      message: 'Token checked in successfully',
      data: {
        token: updatedToken
      }
    });
  } catch (error) {
    logger.error('Check in token error:', error);
    next(error);
  }
};
