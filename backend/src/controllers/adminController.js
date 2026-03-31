import { AdminService } from '../services/adminService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Get system overview for admin dashboard
export const getSystemOverview = asyncHandler(async (req, res) => {
  const overview = await AdminService.getSystemOverview();

  res.status(200).json({
    success: true,
    data: overview
  });
});
