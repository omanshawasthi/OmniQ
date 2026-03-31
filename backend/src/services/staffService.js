import Token from '../models/Token.js';
import { TOKEN_STATUS, BOOKING_TYPE } from '../utils/constants.js';

export class StaffService {
  /**
   * Get queue statistics for today
   */
  static async getTodayStats(branchId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      createdAt: { $gte: today, $lt: tomorrow }
    };

    if (branchId) {
      query.branchId = branchId;
    }

    const tokens = await Token.find(query);

    const stats = {
      total: tokens.length,
      waiting: 0,
      serving: 0,
      completed: 0,
      missed: 0,
      skipped: 0,
      walkIn: 0,
      online: 0
    };

    tokens.forEach(token => {
      if (token.status === TOKEN_STATUS.WAITING) stats.waiting++;
      else if (token.status === TOKEN_STATUS.SERVING) stats.serving++;
      else if (token.status === TOKEN_STATUS.COMPLETED) stats.completed++;
      else if (token.status === TOKEN_STATUS.MISSED) stats.missed++;
      else if (token.status === TOKEN_STATUS.SKIPPED) stats.skipped++;

      if (token.bookingType === BOOKING_TYPE.WALK_IN) stats.walkIn++;
      else if (token.bookingType === BOOKING_TYPE.ONLINE) stats.online++;
    });

    return stats;
  }

  /**
   * Get today's queue list in an operational format
   */
  static async getTodayQueue(branchId, options = {}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // We fetch tokens created today or scheduled for today
    const query = {
      $or: [
        { createdAt: { $gte: today, $lt: tomorrow } },
        { scheduledTime: { $gte: today, $lt: tomorrow } }
      ]
    };

    if (branchId) {
      query.branchId = branchId;
    }
    
    // Optional filtering by department or status if requested
    if (options.departmentId) query.departmentId = options.departmentId;
    if (options.status) query.status = options.status;

    // Fetch tokens
    let tokens = await Token.find(query)
      .populate('userId', 'name email phone')
      .populate('branchId', 'name')
      .populate('departmentId', 'name')
      .populate('counterId', 'name')
      .lean();

    // Custom sorting: SERVING first, then HELD, then WAITING, then others
    const statusWeight = {
      [TOKEN_STATUS.SERVING]: 1,
      [TOKEN_STATUS.HELD]: 2,
      [TOKEN_STATUS.WAITING]: 3,
      [TOKEN_STATUS.COMPLETED]: 4,
      [TOKEN_STATUS.SKIPPED]: 5,
      [TOKEN_STATUS.MISSED]: 6,
      [TOKEN_STATUS.CANCELLED]: 7
    };

    const priorityWeight = {
      'urgent': 1,
      'high': 2,
      'normal': 3
    };

    tokens.sort((a, b) => {
      // 1. Sort by Status Weight
      const wA = statusWeight[a.status] || 99;
      const wB = statusWeight[b.status] || 99;
      if (wA !== wB) return wA - wB;

      // 2. Sort by Priority (Urgent > High > Normal)
      const pA = priorityWeight[a.priority] || 99;
      const pB = priorityWeight[b.priority] || 99;
      if (pA !== pB) return pA - pB;

      // 3. Sort by Scheduled/Created time
      return new Date(a.scheduledTime || a.createdAt) - new Date(b.scheduledTime || b.createdAt);
    });

    return tokens;
  }
}
