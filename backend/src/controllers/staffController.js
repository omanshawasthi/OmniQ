import { StaffService } from '../services/staffService.js';
import { TokenService } from '../services/tokenService.js';

export const getTodayQueueStats = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || req.user.branchId;
    const stats = await StaffService.getTodayStats(branchId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getTodayQueue = async (req, res, next) => {
  try {
    const branchId = req.query.branchId || req.user.branchId;
    const { departmentId, status, source, priority, search } = req.query;

    const queue = await StaffService.getTodayQueue(branchId, {
      departmentId,
      status,
      source,
      priority,
      search
    });

    res.status(200).json({ success: true, count: queue.length, data: queue });
  } catch (error) {
    next(error);
  }
};

export const createWalkInToken = async (req, res, next) => {
  try {
    const token = await TokenService.createWalkInToken(req.body, req.user);
    res.status(201).json({ success: true, data: token });
  } catch (error) {
    next(error);
  }
};

