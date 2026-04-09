import mongoose from 'mongoose';
import Token from '../models/Token.js';
import Branch from '../models/Branch.js';
import Department from '../models/Department.js';
import { TOKEN_STATUS, BOOKING_TYPE } from '../utils/constants.js';

/**
 * Service for handling all analytics and reporting logic
 */
class AnalyticsService {
  /**
   * Get basic overview KPIs
   */
  async getOverviewStats(filters = {}) {
    const { branchId, departmentId, startDate, endDate } = filters;
    const matchStage = this._buildMatchStage(branchId, departmentId, startDate, endDate);

    const stats = await Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTokens: { $sum: 1 },
          completedTokens: {
            $sum: { $cond: [{ $eq: ['$status', TOKEN_STATUS.COMPLETED] }, 1, 0] }
          },
          waitingTokens: {
            $sum: { $cond: [{ $eq: ['$status', TOKEN_STATUS.WAITING] }, 1, 0] }
          },
          servingTokens: {
            $sum: { $cond: [{ $eq: ['$status', TOKEN_STATUS.SERVING] }, 1, 0] }
          },
          missedTokens: {
            $sum: { $cond: [{ $eq: ['$status', TOKEN_STATUS.MISSED] }, 1, 0] }
          },
          skippedTokens: {
            $sum: { $cond: [{ $eq: ['$status', TOKEN_STATUS.SKIPPED] }, 1, 0] }
          },
          cancelledTokens: {
            $sum: { $cond: [{ $eq: ['$status', TOKEN_STATUS.CANCELLED] }, 1, 0] }
          },
          walkInTokens: {
            $sum: { $cond: [{ $eq: ['$bookingType', BOOKING_TYPE.WALK_IN] }, 1, 0] }
          },
          onlineTokens: {
            $sum: { $cond: [{ $ne: ['$bookingType', BOOKING_TYPE.WALK_IN] }, 1, 0] }
          },
          // Calculate wait time only for those that started service
          totalWaitTime: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$startedServiceAt', null] }, { $gt: ['$createdAt', null] }] },
                { $subtract: ['$startedServiceAt', '$createdAt'] },
                0
              ]
            }
          },
          tokensWithWaitTime: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$startedServiceAt', null] }, { $gt: ['$createdAt', null] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalTokens: 0,
      completedTokens: 0,
      waitingTokens: 0,
      servingTokens: 0,
      missedTokens: 0,
      skippedTokens: 0,
      cancelledTokens: 0,
      walkInTokens: 0,
      onlineTokens: 0,
      totalWaitTime: 0,
      tokensWithWaitTime: 0
    };

    // Calculate rates
    const avgWaitTimeMs = result.tokensWithWaitTime > 0 
      ? result.totalWaitTime / result.tokensWithWaitTime 
      : 0;
    
    return {
      overview: {
        total: result.totalTokens,
        completed: result.completedTokens,
        waiting: result.waitingTokens,
        serving: result.servingTokens,
        missed: result.missedTokens,
        skipped: result.skippedTokens,
        cancelled: result.cancelledTokens,
        avgWaitTime: Math.round(avgWaitTimeMs / (1000 * 60)), // in minutes
        completionRate: result.totalTokens > 0 
          ? Math.round((result.completedTokens / result.totalTokens) * 100) 
          : 0,
        noShowRate: result.totalTokens > 0 
          ? Math.round((result.missedTokens / result.totalTokens) * 100) 
          : 0,
        walkInVsOnline: {
          walkIn: result.walkInTokens,
          online: result.onlineTokens,
          ratio: result.onlineTokens > 0 ? (result.walkInTokens / result.onlineTokens).toFixed(2) : result.walkInTokens
        }
      }
    };
  }

  /**
   * Get user registration and active distribution
   */
  async getUserAnalytics() {
    // Get user role distribution
    const roleDistribution = await mongoose.model('User').aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get active users (users with tokens in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await Token.distinct('userId', {
      createdAt: { $gte: thirtyDaysAgo }
    });

    const totalUsers = await mongoose.model('User').countDocuments();

    return {
      totalUsers,
      activeUsers: activeUsers.length,
      roleDistribution: roleDistribution.reduce((acc, r) => {
        acc[r._id] = r.count;
        return acc;
      }, {})
    };
  }

  /**
   * Export ML training data
   */
  async getMLExport() {
    // Only fetch tokens that fully completed their lifecycle (clean ML data)
    const tokens = await Token.find({
      status: TOKEN_STATUS.COMPLETED,
      actualWaitMinutes: { $ne: null },
      joinedAt: { $ne: null }
    }).lean();

    return tokens.map(t => ({
      branchId: t.branchId?.toString() || '',
      departmentId: t.departmentId?.toString() || '',
      serviceType: t.bookingType || 'walk-in',
      sameDepartmentPeopleAhead: t.sameDepartmentPeopleAhead || 0,
      branchStaffCountAtJoin: t.branchStaffCountAtJoin || 0,
      dayOfWeek: t.dayOfWeek,
      hourOfDay: t.hourOfDay,
      actualWaitMinutes: +(parseFloat(t.actualWaitMinutes) || 0).toFixed(2),
      predictedWaitMinutesAtJoin: +(parseFloat(t.predictedWaitMinutesAtJoin) || 0).toFixed(2)
    }));
  }

  /**
   * Get token volume trends over time
   */
  async getVolumeTrends(filters = {}) {
    const { branchId, departmentId, startDate, endDate, groupBy = 'hour' } = filters;
    const matchStage = this._buildMatchStage(branchId, departmentId, startDate, endDate);

    let dateAggregation;
    if (groupBy === 'hour') {
      dateAggregation = { $hour: '$createdAt' };
    } else {
      dateAggregation = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    }

    const trends = await Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: dateAggregation,
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', TOKEN_STATUS.COMPLETED] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return trends.map(t => ({
      label: groupBy === 'hour' ? `${t._id}:00` : t._id,
      tokens: t.count,
      completed: t.completed
    }));
  }

  /**
   * Get department performance rankings
   */
  async getDepartmentPerformance(filters = {}) {
    const { branchId, startDate, endDate } = filters;
    const matchStage = this._buildMatchStage(branchId, null, startDate, endDate);

    const deptStats = await Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$departmentId',
          totalTokens: { $sum: 1 },
          completedTokens: {
            $sum: { $cond: [{ $eq: ['$status', TOKEN_STATUS.COMPLETED] }, 1, 0] }
          },
          avgWaitTime: {
            $avg: {
              $cond: [
                { $and: [{ $gt: ['$startedServiceAt', null] }, { $gt: ['$createdAt', null] }] },
                { $subtract: ['$startedServiceAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'deptInfo'
        }
      },
      { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          name: '$deptInfo.name',
          total: '$totalTokens',
          completed: '$completedTokens',
          avgWaitTime: { $round: [{ $divide: ['$avgWaitTime', 60000] }, 0] } // ms to min
        }
      },
      { $sort: { total: -1 } }
    ]);

    return deptStats;
  }

  /**
   * Get branch performance rankings
   */
  async getBranchPerformance(filters = {}) {
    const { startDate, endDate } = filters;
    const matchStage = this._buildMatchStage(null, null, startDate, endDate);

    const branchStats = await Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$branchId',
          totalTokens: { $sum: 1 },
          completedTokens: {
            $sum: { $cond: [{ $eq: ['$status', TOKEN_STATUS.COMPLETED] }, 1, 0] }
          },
          avgWaitTime: {
            $avg: {
              $cond: [
                { $and: [{ $gt: ['$startedServiceAt', null] }, { $gt: ['$createdAt', null] }] },
                { $subtract: ['$startedServiceAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branchInfo'
        }
      },
      { $unwind: { path: '$branchInfo', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          name: '$branchInfo.name',
          total: '$totalTokens',
          completed: '$completedTokens',
          avgWaitTime: { $round: [{ $divide: ['$avgWaitTime', 60000] }, 0] } // ms to min
        }
      },
      { $sort: { total: -1 } }
    ]);

    return branchStats;
  }

  /**
   * Private helper to build MongoDB match stage based on common filters
   */
  _buildMatchStage(branchId, departmentId, startDate, endDate) {
    const match = {};

    if (branchId) match.branchId = this._toObjectId(branchId);
    if (departmentId) match.departmentId = this._toObjectId(departmentId);

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    } else {
      // Default to "Today" if no dates provided
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      match.createdAt = { $gte: today };
    }

    return match;
  }

  _toObjectId(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return id;
    return new mongoose.Types.ObjectId(id);
  }
}

export default new AnalyticsService();
