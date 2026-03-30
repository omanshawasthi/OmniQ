import Token from '../models/Token.js';
import QueueLog from '../models/QueueLog.js';
import Department from '../models/Department.js';
import { TOKEN_STATES, VALID_TRANSITIONS, QUEUE_SETTINGS } from '../utils/constants.js';
import logger from '../config/logger.js';

class QueueService {
  // Calculate queue position and wait time for a token
  static async calculateQueuePosition(tokenId) {
    try {
      const token = await Token.findById(tokenId)
        .populate('branch department')
        .populate('user');

      if (!token) {
        throw new Error('Token not found');
      }

      // Count waiting tokens ahead of this one
      const waitingTokens = await Token.find({
        branch: token.branch._id,
        department: token.department._id,
        state: TOKEN_STATES.WAITING,
        createdAt: { $lt: token.createdAt }
      }).sort({ createdAt: 1 });

      const position = waitingTokens.length + 1;
      const peopleAhead = waitingTokens.length;

      // Calculate estimated wait time
      let estimatedWaitTime = 0;
      if (peopleAhead > 0) {
        const avgServiceTime = token.department.estimatedServiceTime || 15;
        estimatedWaitTime = peopleAhead * avgServiceTime;
      }

      // Update token with calculated values
      token.position = position;
      token.peopleAhead = peopleAhead;
      token.estimatedWaitTime = estimatedWaitTime;
      await token.save();

      return {
        position,
        peopleAhead,
        estimatedWaitTime
      };
    } catch (error) {
      logger.error('Error calculating queue position:', error);
      throw error;
    }
  }

  // Recalculate entire queue for a department
  static async recalculateQueue(branchId, departmentId) {
    try {
      const waitingTokens = await Token.find({
        branch: branchId,
        department: departmentId,
        state: TOKEN_STATES.WAITING
      }).sort({ createdAt: 1, priority: -1 });

      const department = await Department.findById(departmentId);
      const avgServiceTime = department?.estimatedServiceTime || 15;

      for (let i = 0; i < waitingTokens.length; i++) {
        const token = waitingTokens[i];
        const position = i + 1;
        const peopleAhead = i;
        const estimatedWaitTime = peopleAhead * avgServiceTime;

        await Token.findByIdAndUpdate(token._id, {
          position,
          peopleAhead,
          estimatedWaitTime
        });
      }

      logger.info(`Queue recalculated for branch ${branchId}, department ${departmentId}`);
      return waitingTokens.length;
    } catch (error) {
      logger.error('Error recalculating queue:', error);
      throw error;
    }
  }

  // Validate state transition
  static validateStateTransition(currentState, newState) {
    const validTransitions = VALID_TRANSITIONS[currentState] || [];
    return validTransitions.includes(newState);
  }

  // Change token state with validation and logging
  static async changeTokenState(tokenId, newState, performedBy, notes = '', metadata = {}) {
    try {
      const token = await Token.findById(tokenId);
      if (!token) {
        throw new Error('Token not found');
      }

      const previousState = token.state;

      // Validate state transition
      if (!this.validateStateTransition(previousState, newState)) {
        throw new Error(`Invalid state transition from ${previousState} to ${newState}`);
      }

      // Update token state
      const updateData = {
        state: newState,
        lastUpdated: new Date()
      };

      // Add timestamps based on state
      switch (newState) {
        case TOKEN_STATES.SERVING:
          updateData.serviceStartTime = new Date();
          updateData.isRecalled = false;
          break;
        case TOKEN_STATES.COMPLETED:
          updateData.serviceEndTime = new Date();
          break;
        case TOKEN_STATES.WAITING:
          if (previousState === TOKEN_STATES.SKIPPED) {
            updateData.recallCount = token.recallCount + 1;
            updateData.isRecalled = true;
          }
          break;
      }

      await Token.findByIdAndUpdate(tokenId, updateData);

      // Create queue log
      await QueueLog.create({
        token: tokenId,
        action: this.getActionFromStateChange(newState),
        performedBy,
        previousState,
        newState,
        notes,
        metadata: {
          ...metadata,
          serviceDuration: previousState === TOKEN_STATES.SERVING && newState === TOKEN_STATES.COMPLETED 
            ? Math.round((new Date() - token.serviceStartTime) / 60000) 
            : undefined,
          waitTime: token.serviceStartTime 
            ? Math.round((token.serviceStartTime - token.createdAt) / 60000) 
            : undefined,
          queuePosition: token.position,
          peopleAhead: token.peopleAhead
        }
      });

      logger.info(`Token ${token.tokenNumber} state changed from ${previousState} to ${newState}`);

      return await Token.findById(tokenId).populate('user department branch');
    } catch (error) {
      logger.error('Error changing token state:', error);
      throw error;
    }
  }

  // Get action name from state change
  static getActionFromStateChange(newState) {
    const actionMap = {
      [TOKEN_STATES.SERVING]: 'SERVING_STARTED',
      [TOKEN_STATES.COMPLETED]: 'COMPLETED',
      [TOKEN_STATES.SKIPPED]: 'SKIPPED',
      [TOKEN_STATES.HELD]: 'HELD',
      [TOKEN_STATES.WAITING]: 'RECALLED',
      [TOKEN_STATES.CANCELLED]: 'CANCELLED',
      [TOKEN_STATES.MISSED]: 'MISSED',
      [TOKEN_STATES.EXPIRED]: 'EXPIRED'
    };
    return actionMap[newState] || 'STATE_CHANGED';
  }

  // Get next token in queue
  static async getNextToken(branchId, departmentId, counterId = null) {
    try {
      const nextToken = await Token.findOne({
        branch: branchId,
        department: departmentId,
        state: TOKEN_STATES.WAITING,
        isRecalled: { $ne: true }
      })
      .sort({ priority: -1, createdAt: 1 })
      .populate('user department branch');

      if (nextToken && counterId) {
        await Token.findByIdAndUpdate(nextToken._id, { counter: counterId });
      }

      return nextToken;
    } catch (error) {
      logger.error('Error getting next token:', error);
      throw error;
    }
  }

  // Check for expired tokens
  static async checkExpiredTokens() {
    try {
      const expiredTokens = await Token.find({
        state: TOKEN_STATES.WAITING,
        expiryTime: { $lt: new Date() }
      });

      for (const token of expiredTokens) {
        await this.changeTokenState(
          token._id,
          TOKEN_STATES.EXPIRED,
          null, // System action
          'Token expired automatically',
          { originalExpiryTime: token.expiryTime }
        );
      }

      logger.info(`Processed ${expiredTokens.length} expired tokens`);
      return expiredTokens.length;
    } catch (error) {
      logger.error('Error checking expired tokens:', error);
      throw error;
    }
  }

  // Get queue statistics
  static async getQueueStats(branchId, departmentId = null) {
    try {
      const matchQuery = {
        branch: branchId,
        ...(departmentId && { department: departmentId })
      };

      const stats = await Token.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$state',
            count: { $sum: 1 },
            avgWaitTime: { $avg: '$estimatedWaitTime' }
          }
        }
      ]);

      const result = {
        total: 0,
        waiting: 0,
        serving: 0,
        completed: 0,
        skipped: 0,
        missed: 0,
        cancelled: 0,
        avgWaitTime: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
        result.total += stat.count;
      });

      // Calculate overall average wait time
      const waitingStats = stats.find(s => s._id === TOKEN_STATES.WAITING);
      result.avgWaitTime = waitingStats?.avgWaitTime || 0;

      return result;
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      throw error;
    }
  }
}

export default QueueService;
