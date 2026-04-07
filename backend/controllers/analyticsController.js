import Token from '../src/models/Token.js';
import QueueLog from '../src/models/QueueLog.js';
import User from '../src/models/User.js';
import logger from '../config/logger.js';

// @desc    Get analytics dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private (Admin)
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const { branchId, departmentId, dateRange } = req.query;
    
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = dateRange 
      ? new Date(dateRange) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build match query
    const matchQuery = {
      createdAt: { $gte: startDate, $lte: endDate }
    };
    
    if (branchId) matchQuery.branch = branchId;
    if (departmentId) matchQuery.department = departmentId;

    // Get token statistics
    const tokenStats = await Token.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 },
          avgWaitTime: { $avg: '$estimatedWaitTime' },
          avgServiceTime: { $avg: '$estimatedServiceTime' }
        }
      }
    ]);

    // Get daily statistics
    const dailyStats = await Token.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalTokens: { $sum: 1 },
          completedTokens: {
            $sum: { $cond: [{ $eq: ['$state', 'completed'] }, 1, 0] }
          },
          missedTokens: {
            $sum: { $cond: [{ $eq: ['$state', 'missed'] }, 1, 0] }
          },
          avgWaitTime: { $avg: '$estimatedWaitTime' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get hourly statistics
    const hourlyStats = await Token.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $hour: '$createdAt'
          },
          tokenCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get department statistics
    const departmentStats = await Token.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$department',
          totalTokens: { $sum: 1 },
          completedTokens: {
            $sum: { $cond: [{ $eq: ['$state', 'completed'] }, 1, 0] }
          },
          avgWaitTime: { $avg: '$estimatedWaitTime' }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      { $unwind: '$departmentInfo' },
      {
        $project: {
          departmentName: '$departmentInfo.name',
          totalTokens: 1,
          completedTokens: 1,
          avgWaitTime: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completedTokens', '$totalTokens'] },
              100
            ]
          }
        }
      }
    ]);

    // Calculate overall metrics
    const totalTokens = tokenStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedTokens = tokenStats.find(s => s._id === 'completed')?.count || 0;
    const missedTokens = tokenStats.find(s => s._id === 'missed')?.count || 0;
    const avgWaitTime = tokenStats.find(s => s._id === 'waiting')?.avgWaitTime || 0;
    const completionRate = totalTokens > 0 ? (completedTokens / totalTokens) * 100 : 0;
    const noShowRate = totalTokens > 0 ? (missedTokens / totalTokens) * 100 : 0;

    // Get busiest hour
    const busiestHour = hourlyStats.reduce((max, hour) => 
      hour.tokenCount > (max?.tokenCount || 0) ? hour : max, null);

    // Get busiest department
    const busiestDepartment = departmentStats.reduce((max, dept) => 
      dept.totalTokens > (max?.totalTokens || 0) ? dept : max, null);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalTokens,
          completedTokens,
          missedTokens,
          avgWaitTime: Math.round(avgWaitTime),
          completionRate: Math.round(completionRate * 100) / 100,
          noShowRate: Math.round(noShowRate * 100) / 100
        },
        dailyStats,
        hourlyStats,
        departmentStats,
        busiestHour: busiestHour?._id,
        busiestDepartment: busiestDepartment?.departmentName
      }
    });
  } catch (error) {
    logger.error('Get dashboard analytics error:', error);
    next(error);
  }
};

// @desc    Get queue performance metrics
// @route   GET /api/analytics/performance
// @access  Private (Admin)
export const getPerformanceMetrics = async (req, res, next) => {
  try {
    const { branchId, departmentId } = req.query;
    
    const matchQuery = {};
    if (branchId) matchQuery.branch = branchId;
    if (departmentId) matchQuery.department = departmentId;

    // Get service time metrics
    const serviceTimeMetrics = await Token.aggregate([
      { $match: { ...matchQuery, state: 'completed' } },
      {
        $group: {
          _id: '$department',
          avgServiceTime: { $avg: '$estimatedServiceTime' },
          minServiceTime: { $min: '$estimatedServiceTime' },
          maxServiceTime: { $max: '$estimatedServiceTime' },
          totalServed: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      { $unwind: '$departmentInfo' },
      {
        $project: {
          departmentName: '$departmentInfo.name',
          avgServiceTime: { $round: ['$avgServiceTime', 1] },
          minServiceTime: 1,
          maxServiceTime: 1,
          totalServed: 1
        }
      }
    ]);

    // Get wait time trends
    const waitTimeTrends = await Token.aggregate([
      { $match: { ...matchQuery, state: 'completed' } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          avgWaitTime: { $avg: '$estimatedWaitTime' },
          totalTokens: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get queue efficiency metrics
    const queueEfficiency = await QueueLog.aggregate([
      { $match: { action: { $in: ['COMPLETED', 'MISSED', 'SKIPPED'] } } },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          avgServiceDuration: { $avg: '$metadata.serviceDuration' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        serviceTimeMetrics,
        waitTimeTrends,
        queueEfficiency
      }
    });
  } catch (error) {
    logger.error('Get performance metrics error:', error);
    next(error);
  }
};

// @desc    Get user activity analytics
// @route   GET /api/analytics/users
// @access  Private (Admin)
export const getUserAnalytics = async (req, res, next) => {
  try {
    // Get user registration trends
    const registrationTrends = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get user role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get active users (users with tokens in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await Token.distinct('user', {
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get total users
    const totalUsers = await User.countDocuments();
    const activeUsersCount = activeUsers.length;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers: activeUsersCount,
        registrationTrends,
        roleDistribution
      }
    });
  } catch (error) {
    logger.error('Get user analytics error:', error);
    next(error);
  }
};

// @desc    Export ML training data as CSV
// @route   GET /api/analytics/ml-export
// @access  Private (Admin)
export const getMLExport = async (req, res, next) => {
  try {
    // Only fetch tokens that fully completed their lifecycle (clean ML data)
    // Exclude cancelled, missed, expired, or currently waiting/serving ones.
    const tokens = await Token.find({
      status: 'completed',
      actualWaitMinutes: { $ne: null },
      joinedAt: { $ne: null }
    }).lean();

    const headers = [
      'branchId', 'departmentId', 'serviceType', 'peopleAheadAtJoin',
      'availableStaffAtJoin', 'dayOfWeek', 'hourOfDay',
      'actualWaitMinutes', 'predictedWaitMinutesAtJoin'
    ];

    let csvContent = headers.join(',') + '\n';

    tokens.forEach(t => {
      const row = [
        t.branchId?.toString() || '',
        t.departmentId?.toString() || '',
        t.bookingType || 'walk-in',
        t.peopleAheadAtJoin || 0,
        t.availableStaffAtJoin || 0,
        t.dayOfWeek ?? '',
        t.hourOfDay ?? '',
        +(parseFloat(t.actualWaitMinutes) || 0).toFixed(2),
        +(parseFloat(t.estimatedWaitTime) || 0).toFixed(2)
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ml_training_data.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    logger.error('ML export error:', error);
    next(error);
  }
};
