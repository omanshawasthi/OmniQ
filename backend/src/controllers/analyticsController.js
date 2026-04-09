import analyticsService from '../services/analyticsService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get unified dashboard analytics
 * GET /api/analytics/dashboard
 */
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { branchId, departmentId, startDate, endDate } = req.query;

  const [overview, trends, departments, branches] = await Promise.all([
    analyticsService.getOverviewStats({ branchId, departmentId, startDate, endDate }),
    analyticsService.getVolumeTrends({ branchId, departmentId, startDate, endDate }),
    analyticsService.getDepartmentPerformance({ branchId, startDate, endDate }),
    analyticsService.getBranchPerformance({ startDate, endDate })
  ]);

  res.status(200).json({
    success: true,
    data: {
      ...overview,
      trends,
      topDepartments: departments,
      topBranches: branches
    }
  });
});

/**
 * Get token specific analytics
 * GET /api/analytics/tokens
 */
export const getTokenAnalytics = asyncHandler(async (req, res) => {
  const { branchId, departmentId, startDate, endDate, groupBy } = req.query;

  const trends = await analyticsService.getVolumeTrends({ 
    branchId, 
    departmentId, 
    startDate, 
    endDate, 
    groupBy 
  });

  res.status(200).json({
    success: true,
    data: { trends }
  });
});

/**
 * Get department performance
 * GET /api/analytics/departments
 */
export const getDepartmentAnalytics = asyncHandler(async (req, res) => {
  const { branchId, startDate, endDate } = req.query;

  const stats = await analyticsService.getDepartmentPerformance({ 
    branchId, 
    startDate, 
    endDate 
  });

  res.status(200).json({
    success: true,
    data: { departmentStats: stats }
  });
});

/**
 * Get branch performance
 * GET /api/analytics/branches
 */
export const getBranchAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await analyticsService.getBranchPerformance({ startDate, endDate });

  res.status(200).json({
    success: true,
    data: { branchStats: stats }
  });
});

/**
 * Get performance metrics
 * GET /api/analytics/performance
 */
export const getPerformanceAnalytics = asyncHandler(async (req, res) => {
  const { branchId, departmentId, startDate, endDate } = req.query;

  const stats = await analyticsService.getOverviewStats({ 
    branchId, 
    departmentId, 
    startDate, 
    endDate 
  });

  res.status(200).json({
    success: true,
    data: { performance: stats.overview }
  });
});

/**
 * Get user analytics
 * GET /api/analytics/users
 */
export const getUserAnalytics = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getUserAnalytics();
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * Get performance metrics (alias for performance analytics)
 * GET /api/analytics/performance
 */
export const getPerformanceMetrics = asyncHandler(async (req, res) => {
  const { branchId, departmentId, startDate, endDate } = req.query;
  const stats = await analyticsService.getOverviewStats({ 
    branchId, 
    departmentId, 
    startDate, 
    endDate 
  });

  res.status(200).json({
    success: true,
    data: { performance: stats.overview }
  });
});

/**
 * Export ML training data
 * GET /api/analytics/ml-export
 */
export const getMLExport = asyncHandler(async (req, res) => {
  const data = await analyticsService.getMLExport();
  
  const headers = [
    'branchId', 'departmentId', 'serviceType', 'peopleAheadAtJoin',
    'availableStaffAtJoin', 'dayOfWeek', 'hourOfDay',
    'actualWaitMinutes', 'predictedWaitMinutesAtJoin'
  ];

  let csvContent = headers.join(',') + '\n';
  data.forEach(row => {
    csvContent += [
      row.branchId, row.departmentId, row.serviceType, 
      row.peopleAheadAtJoin, row.availableStaffAtJoin, 
      row.dayOfWeek ?? '', row.hourOfDay ?? '',
      row.actualWaitMinutes, row.predictedWaitMinutesAtJoin
    ].join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ml_training_data.csv"');
  res.status(200).send(csvContent);
});
