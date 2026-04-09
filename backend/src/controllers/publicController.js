import Token from '../models/Token.js';
import Branch from '../models/Branch.js';
import Department from '../models/Department.js';
import { TOKEN_STATUS } from '../utils/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get public queue data for display (Now Serving + Up Next)
 * GET /api/public/display/:branchId/:departmentId
 */
export const getPublicQueueData = asyncHandler(async (req, res) => {
  const { branchId, departmentId } = req.params;

  const [branch, department] = await Promise.all([
    Branch.findById(branchId).select('name address city'),
    Department.findById(departmentId).select('name code')
  ]);

  if (!branch || !department) {
    return res.status(404).json({
      success: false,
      message: 'Branch or Department not found'
    });
  }

  // Get currently serving token
  const servingToken = await Token.findOne({
    branchId,
    departmentId,
    status: TOKEN_STATUS.SERVING
  })
  .populate('counterId', 'name number')
  .sort({ startedServiceAt: -1 });

  // Get next 5 waiting tokens
  const upNext = await Token.find({
    branchId,
    departmentId,
    status: TOKEN_STATUS.WAITING
  })
  .select('tokenNumber priority scheduledTime')
  .sort({ priority: -1, scheduledTime: 1 })
  .limit(5);

  res.status(200).json({
    success: true,
    data: {
      branch: {
        name: branch.name,
        location: `${branch.city}, ${branch.address}`
      },
      department: {
        name: department.name,
        code: department.code
      },
      serving: servingToken ? {
        tokenNumber: servingToken.tokenNumber,
        counter: servingToken.counterId ? (servingToken.counterId.name || `Counter ${servingToken.counterId.number}`) : 'Main Counter'
      } : null,
      upNext: upNext.map(t => ({
        tokenNumber: t.tokenNumber,
        priority: t.priority
      }))
    }
  });
});
