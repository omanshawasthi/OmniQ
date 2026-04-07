import Department from '../models/Department.js';
import Branch from '../models/Branch.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Create new department
export const createDepartment = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    branchId,
    averageServiceTime,
    isActive = true,
    prioritySupport = false,
    settings,
    operatingHours,
    color,
    icon,
    sortOrder
  } = req.body;

  // Authorization check for STAFF
  if (req.user && req.user.role === 'staff') {
    if (!req.user.assignedBranch || req.user.assignedBranch.toString() !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff can only create departments for their assigned branch.'
      });
    }
  }

  // Validate branch exists
  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res.status(404).json({
      success: false,
      message: 'Branch not found'
    });
  }

  const department = new Department({
    name,
    description,
    branchId,
    averageServiceTime,
    isActive,
    prioritySupport,
    settings,
    operatingHours: operatingHours || branch.operatingHours, // fallback to branch hours
    color,
    icon,
    sortOrder
  });

  await department.save();

  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: { department }
  });
});

// Get departments (optionally filtered by branchId)
export const getDepartments = asyncHandler(async (req, res) => {
  const { branchId, isActive } = req.query;

  const query = {};
  
  // Security check: If staff, they can ONLY see their own branch
  if (req.user && req.user.role === 'staff') {
    query.branchId = req.user.assignedBranch;
  } else if (branchId) {
    query.branchId = branchId;
  }
  
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const departments = await Department.find(query)
    .populate('branchId', 'name address')
    .sort({ sortOrder: 1, name: 1 });

  res.status(200).json({
    success: true,
    data: { departments }
  });
});

// Get single department
export const getDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findById(id).populate('branchId', 'name');

  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  res.status(200).json({
    success: true,
    data: { department }
  });
});

// Update department
export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (updateData.branchId) {
    const branch = await Branch.findById(updateData.branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
  }

  // Get department first to check its branchId for STAFF
  const existingDepartment = await Department.findById(id);
  if (!existingDepartment) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  if (req.user && req.user.role === 'staff') {
    if (!req.user.assignedBranch || req.user.assignedBranch.toString() !== existingDepartment.branchId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff can only update departments in their assigned branch.'
      });
    }
    // Also prevent staff from moving a department to another branch
    if (updateData.branchId && updateData.branchId.toString() !== req.user.assignedBranch.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cannot move department to another branch'
      });
    }
  }

  const department = await Department.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('branchId', 'name');

  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Department updated successfully',
    data: { department }
  });
});

// Delete department
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findById(id);

  if (!department) {
    return res.status(404).json({
      success: false,
      message: 'Department not found'
    });
  }

  if (req.user && req.user.role === 'staff') {
    if (!req.user.assignedBranch || req.user.assignedBranch.toString() !== department.branchId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Staff can only delete departments in their assigned branch.'
      });
    }
  }

  await Department.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Department deleted successfully'
  });
});
