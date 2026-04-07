import Token from '../models/Token.js';
import User from '../models/User.js';
import { TOKEN_STATUS, BOOKING_TYPE, ROLES } from '../utils/constants.js';
import { QueueLifecycleService } from './queueLifecycleService.js';
import { getStartOfToday } from '../utils/dateUtils.js';

export class StaffService {
  /**
   * Get all staff members for a specific branch
   */
  static async getBranchStaff(branchId) {
    return await User.find({
      assignedBranch: branchId,
      role: ROLES.STAFF, // Use constant to ensure lowercase 'staff' match
      isActive: true
    }).select('name email phone createdAt');
  }

  /**
   * Get queue statistics for today
   */
  static async getTodayStats(branchId) {
    // Ensure stale tokens are expired before fetching stats
    await QueueLifecycleService.expireOldTokens();

    const today = getStartOfToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      branchId,
      isActiveQueue: true,
      $or: [
        { queueDate: today },
        { 
          queueDate: { $exists: false },
          createdAt: { $gte: today } 
        }
      ]
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
   * Get today's queue list with search, status, source and priority filtering
   */
  static async getTodayQueue(branchId, options = {}) {
    // Ensure stale tokens are expired before fetching queue
    await QueueLifecycleService.expireOldTokens();

    const { 
      dateRange = 'today', 
      status, 
      source, 
      priority, 
      departmentId, 
      search 
    } = options;

    const today = getStartOfToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {};

    // Date Range logic
    if (dateRange === 'today') {
      // For Today, we show all tokens created for today (active and completed)
      query.$or = [
        { queueDate: today },
        { 
          queueDate: { $exists: false },
          createdAt: { $gte: today } 
        }
      ];
    } else {
      // Historical range
      switch (dateRange) {
        case 'today':
          query.queueDate = today;
          break;
        case '7days':
          const sevenDaysAgo = getDaysAgo(7);
          query.$or = [
            { queueDate: { $gte: sevenDaysAgo } },
            { 
              queueDate: { $exists: false },
              createdAt: { $gte: sevenDaysAgo } 
            }
          ];
          break;
        case '30days':
          const thirtyDaysAgo = getDaysAgo(30);
          query.$or = [
            { queueDate: { $gte: thirtyDaysAgo } },
            { 
              queueDate: { $exists: false },
              createdAt: { $gte: thirtyDaysAgo } 
            }
          ];
          break;
        case 'all':
          // No date filter
          break;
      }
    }

    if (branchId) query.branchId = branchId;
    if (departmentId) query.departmentId = departmentId;

    // Status filter (supports comma-separated multiple statuses)
    if (status) {
      const statuses = status.split(',').map(s => s.trim().toLowerCase());
      query.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    // Source / bookingType filter
    if (source) {
      query.bookingType = source === 'walk-in' ? BOOKING_TYPE.WALK_IN : BOOKING_TYPE.ONLINE;
    }

    // Priority filter
    if (priority) {
      query.priority = priority.toLowerCase();
    }

    let tokens = await Token.find(query)
      .populate('userId', 'name email phone')
      .populate('branchId', 'name')
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Frontend search: filter by token number, guest name, user name, or phone
    if (search) {
      const term = search.toLowerCase().trim();
      tokens = tokens.filter(t => {
        const tokenNum = (t.tokenNumber || '').toLowerCase();
        const userName = (t.userId?.name || '').toLowerCase();
        const guestName = (t.metadata?.walkInName || '').toLowerCase();
        const guestPhone = (t.metadata?.walkInPhone || '').toLowerCase();
        return (
          tokenNum.includes(term) ||
          userName.includes(term) ||
          guestName.includes(term) ||
          guestPhone.includes(term)
        );
      });
    }

    // Operational sort logic (Serving first) is only applied for Today
    if (dateRange === 'today') {
      const statusWeight = {
        [TOKEN_STATUS.SERVING]: 1,
        [TOKEN_STATUS.HELD]: 2,
        [TOKEN_STATUS.WAITING]: 3,
        [TOKEN_STATUS.COMPLETED]: 4,
        [TOKEN_STATUS.SKIPPED]: 5,
        [TOKEN_STATUS.MISSED]: 6,
        [TOKEN_STATUS.CANCELLED]: 7
      };

      const priorityWeight = { urgent: 1, high: 2, normal: 3 };

      tokens.sort((a, b) => {
        const wA = statusWeight[a.status] || 99;
        const wB = statusWeight[b.status] || 99;
        if (wA !== wB) return wA - wB;

        const pA = priorityWeight[a.priority] || 99;
        const pB = priorityWeight[b.priority] || 99;
        if (pA !== pB) return pA - pB;

        return new Date(a.scheduledTime || a.createdAt) - new Date(b.scheduledTime || b.createdAt);
      });
    }

    return tokens;
  }
}
