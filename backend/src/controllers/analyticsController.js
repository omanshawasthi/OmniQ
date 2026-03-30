import Token from '../models/Token.js'
import User from '../models/User.js'
import Branch from '../models/Branch.js'
import Department from '../models/Department.js'
import QueueLog from '../models/QueueLog.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Get dashboard analytics
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { branchId, departmentId, startDate, endDate } = req.query

  const dateFilter = {}
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  const matchStage = {}
  if (branchId) matchStage.branchId = branchId
  if (departmentId) matchStage.departmentId = departmentId
  if (Object.keys(dateFilter).length > 0) {
    matchStage.$and = [dateFilter]
  }

  const [
    totalTokens,
    completedTokens,
    waitingTokens,
    servingTokens,
    avgWaitTime,
    completionRate,
    branchStats,
    departmentStats
  ] = await Promise.all([
    Token.countDocuments(matchStage),
    Token.countDocuments({ ...matchStage, status: 'completed' }),
    Token.countDocuments({ ...matchStage, status: 'waiting' }),
    Token.countDocuments({ ...matchStage, status: 'serving' }),
    Token.aggregate([
      { $match: matchStage },
      { $group: { _id: null, avgWaitTime: { $avg: '$estimatedWaitTime' } } }
    ]),
    Token.aggregate([
      { $match: { ...matchStage, status: 'completed' } },
      { $group: { _id: null, avgServiceTime: { $avg: '$actualServiceTime' } } }
    ]),
    Branch.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    Department.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ])

  const analytics = {
    overview: {
      totalTokens,
      completedTokens,
      waitingTokens,
      servingTokens,
      completionRate: totalTokens > 0 ? (completedTokens / totalTokens) * 100 : 0,
      averageWaitTime: avgWaitTime[0]?.avgWaitTime || 0
    },
    topBranches: branchStats,
    topDepartments: departmentStats,
    trends: await getTrends(matchStage)
  }

  res.status(200).json({
    success: true,
    data: { analytics }
  })
})

// Get token analytics
export const getTokenAnalytics = asyncHandler(async (req, res) => {
  const { branchId, departmentId, startDate, endDate, groupBy = 'day' } = req.query

  const matchStage = {}
  if (branchId) matchStage.branchId = branchId
  if (departmentId) matchStage.departmentId = departmentId
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  let groupFormat
  switch (groupBy) {
    case 'hour':
      groupFormat = { $dateToString: { format: '%Y-%m-%d-%H', date: '$createdAt' } }
      break
    case 'day':
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
      break
    case 'week':
      groupFormat = { $dateToString: { format: '%Y-%U', date: '$createdAt' } }
      break
    case 'month':
      groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
      break
    default:
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
  }

  const tokenStats = await Token.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: groupFormat,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        missed: {
          $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
        },
        avgWaitTime: { $avg: '$estimatedWaitTime' },
        avgServiceTime: { $avg: '$actualServiceTime' }
      }
    },
    { $sort: { _id: 1 } }
  ])

  res.status(200).json({
    success: true,
    data: { tokenStats }
  })
})

// Get department analytics
export const getDepartmentAnalytics = asyncHandler(async (req, res) => {
  const { branchId, startDate, endDate } = req.query

  const matchStage = {}
  if (branchId) matchStage.branchId = branchId
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  const departmentStats = await Token.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$departmentId',
        totalTokens: { $sum: 1 },
        completedTokens: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avgWaitTime: { $avg: '$estimatedWaitTime' },
        avgServiceTime: { $avg: '$actualServiceTime' }
      }
    },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'department'
      }
    },
    { $unwind: '$department' },
    { $sort: { totalTokens: -1 } }
  ])

  res.status(200).json({
    success: true,
    data: { departmentStats }
  })
})

// Get branch analytics
export const getBranchAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query

  const matchStage = {}
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  const branchStats = await Token.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$branchId',
        totalTokens: { $sum: 1 },
        completedTokens: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avgWaitTime: { $avg: '$estimatedWaitTime' },
        avgServiceTime: { $avg: '$actualServiceTime' }
      }
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branch'
      }
    },
    { $unwind: '$branch' },
    { $sort: { totalTokens: -1 } }
  ])

  res.status(200).json({
    success: true,
    data: { branchStats }
  })
})

// Get performance analytics
export const getPerformanceAnalytics = asyncHandler(async (req, res) => {
  const { branchId, departmentId, startDate, endDate } = req.query

  const matchStage = {}
  if (branchId) matchStage.branchId = branchId
  if (departmentId) matchStage.departmentId = departmentId
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  const [
    serviceTimeDistribution,
    waitTimeDistribution,
    peakHours,
    completionRates,
    noShowRates
  ] = await Promise.all([
    Token.aggregate([
      { $match: { ...matchStage, status: 'completed' } },
      {
        $bucket: {
          groupBy: '$actualServiceTime',
          boundaries: [5, 10, 15, 30, 60],
          output: {
            range: '0-5',
            count: { $sum: 1 }
          }
        }
      }
    ]),
    Token.aggregate([
      { $match: matchStage },
      {
        $bucket: {
          groupBy: '$estimatedWaitTime',
          boundaries: [5, 10, 15, 30, 60],
          output: {
            range: '0-5',
            count: { $sum: 1 }
          }
        }
      }
    ]),
    Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]),
    Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$departmentId',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionRate: { $avg: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] } } }
        }
      }
    ]),
    Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          total: { $sum: 1 },
          missed: {
            $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
          }
        }
      },
      {
        $group: {
          _id: null,
          avgNoShowRate: { $avg: { $multiply: [{ $divide: ['$missed', '$total'] }, 100] } } }
        }
      }
    ])
  ])

  const performance = {
    serviceTimeDistribution,
    waitTimeDistribution,
    peakHours,
    averageCompletionRate: completionRates[0]?.avgCompletionRate || 0,
    averageNoShowRate: noShowRates[0]?.avgNoShowRate || 0
  }

  res.status(200).json({
    success: true,
    data: { performance }
  })
})

// Export analytics
export const exportAnalytics = asyncHandler(async (req, res) => {
  const { type, format = 'csv', branchId, departmentId, startDate, endDate } = req.query

  const matchStage = {}
  if (branchId) matchStage.branchId = branchId
  if (departmentId) matchStage.departmentId = departmentId
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }

  let data
  switch (type) {
    case 'tokens':
      data = await Token.find(matchStage)
        .populate('userId', 'name email')
        .populate('branchId', 'name')
        .populate('departmentId', 'name')
        .sort({ createdAt: -1 })
      break
    case 'users':
      data = await User.find(matchStage)
        .populate('assignedBranch', 'name')
        .select('-password')
        .sort({ createdAt: -1 })
      break
    default:
      data = await Token.find(matchStage).sort({ createdAt: -1 })
  }

  if (format === 'csv') {
    // Convert to CSV and send
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${Date.now()}.csv`)
    
    // Simple CSV conversion (would use a proper CSV library in production)
    const csv = convertToCSV(data)
    res.send(csv)
  } else {
    res.status(200).json({
      success: true,
      data: { analytics: data }
    })
  }
})

// Helper function to get trends
async function getTrends(matchStage) {
  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)

  const trends = await Token.aggregate([
    { $match: { ...matchStage, createdAt: { $gte: last7Days } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ])

  return trends
}

// Simple CSV conversion helper
function convertToCSV(data) {
  if (!data || data.length === 0) return ''
  
  const headers = Object.keys(data[0].toObject())
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(item => {
    const obj = item.toObject ? item.toObject() : item
    return headers.map(header => {
      const value = obj[header]
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
    }).join(',')
  }).join('\n')
  
  return csvHeaders + '\n' + csvRows
}
