import Token from '../models/Token.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import Department from '../models/Department.js';
import Counter from '../models/Counter.js';
import { TOKEN_STATUS, BOOKING_TYPE } from '../utils/constants.js';

export class AdminService {
  /**
   * Get system-wide metrics and aggregates for the admin dashboard.
   */
  static async getSystemOverview() {
    // Current day boundaries
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayFilter = {
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    // Parallel fetch for performance
    const [
      totalUsers,
      totalBranches,
      totalDepartments,
      totalCounters,
      todayTokensTotal,
      waitingTokens,
      servingTokens,
      completedTokens,
      missedTokens,
      skippedTokens,
      walkInTokens,
      onlineTokens
    ] = await Promise.all([
      User.countDocuments(),
      Branch.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Counter.countDocuments({ status: { $ne: 'offline' } }), // active/inactive
      
      // Tokens today
      Token.countDocuments(todayFilter),
      Token.countDocuments({ ...todayFilter, status: TOKEN_STATUS.WAITING }),
      Token.countDocuments({ ...todayFilter, status: TOKEN_STATUS.SERVING }),
      Token.countDocuments({ ...todayFilter, status: TOKEN_STATUS.COMPLETED }),
      Token.countDocuments({ ...todayFilter, status: TOKEN_STATUS.MISSED }),
      Token.countDocuments({ ...todayFilter, status: TOKEN_STATUS.SKIPPED }),
      Token.countDocuments({ ...todayFilter, bookingType: BOOKING_TYPE.WALK_IN }),
      Token.countDocuments({ ...todayFilter, bookingType: BOOKING_TYPE.ONLINE })
    ]);

    // Optional: get average wait time for today's tokens
    const avgWaitResult = await Token.aggregate([
      { $match: todayFilter },
      { $group: { _id: null, avgWait: { $avg: '$estimatedWaitTime' } } }
    ]);
    const avgWaitTime = avgWaitResult.length > 0 ? Math.round(avgWaitResult[0].avgWait) : 0;

    return {
      system: {
        totalUsers,
        totalBranches,
        totalDepartments,
        totalCounters
      },
      today: {
        totalTokens: todayTokensTotal,
        waitingTokens,
        servingTokens,
        completedTokens,
        missedTokens,
        skippedTokens,
        walkInTokens,
        onlineTokens,
        avgWaitTime
      }
    };
  }
}
