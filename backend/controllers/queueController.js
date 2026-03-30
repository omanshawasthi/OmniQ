import Token from '../src/models/Token.js';
import Counter from '../src/models/Counter.js';
import QueueService from '../src/services/queueService.js';
import { TOKEN_STATES } from '../src/utils/constants.js';
import logger from '../config/logger.js';

// @desc    Call next token
// @route   POST /api/queue/call-next
// @access  Private (Staff/Operator)
export const callNextToken = async (req, res, next) => {
  try {
    const { branchId, departmentId, counterId } = req.body;

    // Get next token in queue
    const nextToken = await QueueService.getNextToken(branchId, departmentId, counterId);

    if (!nextToken) {
      return res.status(404).json({
        success: false,
        message: 'No tokens in queue'
      });
    }

    // Update counter's current token
    if (counterId) {
      await Counter.findByIdAndUpdate(counterId, {
        currentToken: nextToken._id,
        status: 'ACTIVE'
      });
    }

    // Change token state to serving
    await QueueService.changeTokenState(
      nextToken._id,
      TOKEN_STATES.SERVING,
      req.user.id,
      'Token called for service',
      { counterId }
    );

    // Recalculate queue
    await QueueService.recalculateQueue(branchId, departmentId);

    const updatedToken = await Token.findById(nextToken._id)
      .populate('user branch department counter');

    logger.info(`Next token called: ${updatedToken.tokenNumber}`);

    res.status(200).json({
      success: true,
      message: 'Next token called successfully',
      data: {
        token: updatedToken
      }
    });
  } catch (error) {
    logger.error('Call next token error:', error);
    next(error);
  }
};

// @desc    Mark token as serving
// @route   PUT /api/queue/:id/serve
// @access  Private (Staff/Operator)
export const serveToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { counterId } = req.body;

    const token = await Token.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if token is in correct state
    if (![TOKEN_STATES.WAITING, TOKEN_STATES.SKIPPED].includes(token.state)) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be served in current state'
      });
    }

    // Update counter's current token
    if (counterId) {
      await Counter.findByIdAndUpdate(counterId, {
        currentToken: token._id,
        status: 'ACTIVE'
      });
    }

    // Change token state to serving
    await QueueService.changeTokenState(
      token._id,
      TOKEN_STATES.SERVING,
      req.user.id,
      'Token marked as serving',
      { counterId }
    );

    // Update token counter
    await Token.findByIdAndUpdate(token._id, { counter: counterId });

    const updatedToken = await Token.findById(token._id)
      .populate('user branch department counter');

    logger.info(`Token marked as serving: ${updatedToken.tokenNumber}`);

    res.status(200).json({
      success: true,
      message: 'Token marked as serving successfully',
      data: {
        token: updatedToken
      }
    });
  } catch (error) {
    logger.error('Serve token error:', error);
    next(error);
  }
};

// @desc    Complete token
// @route   PUT /api/queue/:id/complete
// @access  Private (Staff/Operator)
export const completeToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const token = await Token.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if token is in correct state
    if (token.state !== TOKEN_STATES.SERVING) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be completed in current state'
      });
    }

    // Change token state to completed
    await QueueService.changeTokenState(
      token._id,
      TOKEN_STATES.COMPLETED,
      req.user.id,
      notes || 'Token completed successfully'
    );

    // Clear counter's current token
    if (token.counter) {
      await Counter.findByIdAndUpdate(token.counter, {
        currentToken: null,
        status: 'ACTIVE'
      });
    }

    // Recalculate queue
    await QueueService.recalculateQueue(token.branch, token.department);

    const updatedToken = await Token.findById(token._id)
      .populate('user branch department counter');

    logger.info(`Token completed: ${updatedToken.tokenNumber}`);

    res.status(200).json({
      success: true,
      message: 'Token completed successfully',
      data: {
        token: updatedToken
      }
    });
  } catch (error) {
    logger.error('Complete token error:', error);
    next(error);
  }
};

// @desc    Skip token
// @route   PUT /api/queue/:id/skip
// @access  Private (Staff/Operator)
export const skipToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const token = await Token.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if token can be skipped
    if (![TOKEN_STATES.SERVING, TOKEN_STATES.WAITING].includes(token.state)) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be skipped in current state'
      });
    }

    // Clear counter's current token if serving
    if (token.state === TOKEN_STATES.SERVING && token.counter) {
      await Counter.findByIdAndUpdate(token.counter, {
        currentToken: null,
        status: 'ACTIVE'
      });
    }

    // Change token state to skipped
    await QueueService.changeTokenState(
      token._id,
      TOKEN_STATES.SKIPPED,
      req.user.id,
      notes || 'Token skipped'
    );

    // Recalculate queue
    await QueueService.recalculateQueue(token.branch, token.department);

    const updatedToken = await Token.findById(token._id)
      .populate('user branch department counter');

    logger.info(`Token skipped: ${updatedToken.tokenNumber}`);

    res.status(200).json({
      success: true,
      message: 'Token skipped successfully',
      data: {
        token: updatedToken
      }
    });
  } catch (error) {
    logger.error('Skip token error:', error);
    next(error);
  }
};

// @desc    Hold token
// @route   PUT /api/queue/:id/hold
// @access  Private (Staff/Operator)
export const holdToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const token = await Token.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if token can be held
    if (![TOKEN_STATES.SERVING, TOKEN_STATES.WAITING].includes(token.state)) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be held in current state'
      });
    }

    // Change token state to held
    await QueueService.changeTokenState(
      token._id,
      TOKEN_STATES.HELD,
      req.user.id,
      notes || 'Token put on hold'
    );

    // Clear counter's current token if serving
    if (token.state === TOKEN_STATES.SERVING && token.counter) {
      await Counter.findByIdAndUpdate(token.counter, {
        currentToken: null,
        status: 'ACTIVE'
      });
    }

    // Recalculate queue
    await QueueService.recalculateQueue(token.branch, token.department);

    const updatedToken = await Token.findById(token._id)
      .populate('user branch department counter');

    logger.info(`Token put on hold: ${updatedToken.tokenNumber}`);

    res.status(200).json({
      success: true,
      message: 'Token put on hold successfully',
      data: {
        token: updatedToken
      }
    });
  } catch (error) {
    logger.error('Hold token error:', error);
    next(error);
  }
};

// @desc    Recall token
// @route   PUT /api/queue/:id/recall
// @access  Private (Staff/Operator)
export const recallToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { counterId } = req.body;

    const token = await Token.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if token can be recalled
    if (token.state !== TOKEN_STATES.SKIPPED) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be recalled in current state'
      });
    }

    // Check recall limit
    if (token.recallCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Token has been recalled too many times'
      });
    }

    // Update counter's current token
    if (counterId) {
      await Counter.findByIdAndUpdate(counterId, {
        currentToken: token._id,
        status: 'ACTIVE'
      });
    }

    // Change token state back to waiting (will be marked as recalled)
    await QueueService.changeTokenState(
      token._id,
      TOKEN_STATES.WAITING,
      req.user.id,
      'Token recalled',
      { counterId }
    );

    // Update token counter
    await Token.findByIdAndUpdate(token._id, { counter: counterId });

    // Recalculate queue
    await QueueService.recalculateQueue(token.branch, token.department);

    const updatedToken = await Token.findById(token._id)
      .populate('user branch department counter');

    logger.info(`Token recalled: ${updatedToken.tokenNumber}`);

    res.status(200).json({
      success: true,
      message: 'Token recalled successfully',
      data: {
        token: updatedToken
      }
    });
  } catch (error) {
    logger.error('Recall token error:', error);
    next(error);
  }
};

// @desc    Mark token as no-show
// @route   PUT /api/queue/:id/no-show
// @access  Private (Staff/Operator)
export const markNoShow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const token = await Token.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if token can be marked as no-show
    if (![TOKEN_STATES.WAITING, TOKEN_STATES.SKIPPED].includes(token.state)) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be marked as no-show in current state'
      });
    }

    // Change token state to missed
    await QueueService.changeTokenState(
      token._id,
      TOKEN_STATES.MISSED,
      req.user.id,
      notes || 'Token marked as no-show'
    );

    // Clear counter's current token if assigned
    if (token.counter) {
      await Counter.findByIdAndUpdate(token.counter, {
        currentToken: null,
        status: 'ACTIVE'
      });
    }

    // Recalculate queue
    await QueueService.recalculateQueue(token.branch, token.department);

    const updatedToken = await Token.findById(token._id)
      .populate('user branch department counter');

    logger.info(`Token marked as no-show: ${updatedToken.tokenNumber}`);

    res.status(200).json({
      success: true,
      message: 'Token marked as no-show successfully',
      data: {
        token: updatedToken
      }
    });
  } catch (error) {
    logger.error('Mark no-show error:', error);
    next(error);
  }
};

// @desc    Get current serving tokens for counter
// @route   GET /api/queue/current-serving/:counterId
// @access  Private (Staff/Operator)
export const getCurrentServing = async (req, res, next) => {
  try {
    const { counterId } = req.params;

    const counter = await Counter.findById(counterId).populate('currentToken');
    
    if (!counter) {
      return res.status(404).json({
        success: false,
        message: 'Counter not found'
      });
    }

    let currentToken = null;
    if (counter.currentToken) {
      currentToken = await Token.findById(counter.currentToken._id)
        .populate('user branch department');
    }

    res.status(200).json({
      success: true,
      data: {
        counter,
        currentToken
      }
    });
  } catch (error) {
    logger.error('Get current serving error:', error);
    next(error);
  }
};
