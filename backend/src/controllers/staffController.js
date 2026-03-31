import { StaffService } from '../services/staffService.js';
import AppError from '../utils/AppError.js';

export const getTodayQueueStats = async (req, res, next) => {
  try {
    // If user is STAFF and tied to a branch, we might use req.user.branchId
    // For now, allow optional branchId query param or fallback
    const branchId = req.query.branchId || req.user.branchId; 
    
    const stats = await StaffService.getTodayStats(branchId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayQueue = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || req.user.branchId;
    const { departmentId, status } = req.query;

    const queue = await StaffService.getTodayQueue(branchId, {
      departmentId,
      status
    });

    res.status(200).json({
      success: true,
      count: queue.length,
      data: queue
    });
  } catch (error) {
    next(error);
  }
};
