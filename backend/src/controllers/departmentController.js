import Department from '../models/Department.js';
import Branch from '../models/Branch.js';
import Counter from '../models/Counter.js';
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
  if (branchId) query.branchId = branchId;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const departments = await Department.find(query)
    .populate('branchId', 'name address')
    .sort({ sortOrder: 1, name: 1 });

  res.status(200).json({
    success: true,
    data: { departments } // Note: keeping object wrapped to match create/update pattern or frontend might expect `data: departments` standard. Many endpoints do `data: departments`. Let's return just `data: departments` if frontend uses it directly, but let's match branchController which does `data: { branches }`. Actually, `/api/departments` frontend expects array or object? Let's send array directly since it's common. Wait, I will wrap it in `data: departments` but the frontend `routes/branches.js` was returning `data: departments` (array directly). I'll return array directly.
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

  // Check if department has active counters
  const activeCounters = await Counter.countDocuments({
    departmentId: id,
    status: { $ne: 'offline' }
  });

  if (activeCounters > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete department with assigned counters. Reassign or delete them first.'
    });
  }

  await Department.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Department deleted successfully'
  });
});
