import Counter from '../models/Counter.js';
import Branch from '../models/Branch.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import { COUNTER_STATUS } from '../utils/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Create new counter
export const createCounter = asyncHandler(async (req, res) => {
  const { name, branchId, departmentId, settings, location, equipment } = req.body;

  // Validate branch and department
  const branch = await Branch.findById(branchId);
  const department = await Department.findOne({ _id: departmentId, branchId });

  if (!branch) {
    return res.status(404).json({ success: false, message: 'Branch not found' });
  }
  if (!department) {
    return res.status(404).json({ success: false, message: 'Department not found in this branch' });
  }

  const counter = new Counter({
    name,
    branchId,
    departmentId,
    settings,
    location,
    equipment,
    status: COUNTER_STATUS.OFFLINE // Start offline by default
  });

  await counter.save();

  res.status(201).json({
    success: true,
    message: 'Counter created successfully',
    data: { counter }
  });
});

// Get all counters (optionally filtered by branch and department)
export const getCounters = asyncHandler(async (req, res) => {
  const { branchId, departmentId, status } = req.query;

  const query = {};
  if (branchId) query.branchId = branchId;
  if (departmentId) query.departmentId = departmentId;
  if (status) query.status = status;

  const counters = await Counter.find(query)
    .populate('branchId', 'name')
    .populate('departmentId', 'name')
    .populate('assignedOperator', 'name email phone')
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: { counters } // Match standard envelope format
  });
});

// Get single counter
export const getCounter = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const counter = await Counter.findById(id)
    .populate('branchId', 'name')
    .populate('departmentId', 'name')
    .populate('assignedOperator', 'name email phone');

  if (!counter) {
    return res.status(404).json({ success: false, message: 'Counter not found' });
  }

  res.status(200).json({
    success: true,
    data: { counter }
  });
});

// Update counter generic details
export const updateCounter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, status, settings, location, equipment } = req.body;

  // Don't allow assigning staff or changing branch/dept through this general update route
  const counter = await Counter.findByIdAndUpdate(
    id,
    { name, status, settings, location, equipment },
    { new: true, runValidators: true }
  )
    .populate('branchId', 'name')
    .populate('departmentId', 'name')
    .populate('assignedOperator', 'name');

  if (!counter) {
    return res.status(404).json({ success: false, message: 'Counter not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Counter updated successfully',
    data: { counter }
  });
});

// Delete counter strictly if offline and holding no tokens
export const deleteCounter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const counter = await Counter.findById(id);
  if (!counter) {
    return res.status(404).json({ success: false, message: 'Counter not found' });
  }

  if (counter.currentToken) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cannot delete counter actively serving a token. Re-route or complete the token first.' 
    });
  }

  if (counter.assignedOperator) {
    // Clear staff assignment first
    await User.findByIdAndUpdate(counter.assignedOperator, { assignedCounter: null });
  }

  await Counter.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Counter deleted successfully'
  });
});

// Specialized routing action: Assign Staff to a Counter
export const assignStaff = asyncHandler(async (req, res) => {
  const { id } = req.params; // Counter ID
  const { userId } = req.body; // Staff User ID (can be null to unassign)

  const counter = await Counter.findById(id);
  if (!counter) {
    return res.status(404).json({ success: false, message: 'Counter not found' });
  }

  // 1. Unassign: Request to clear the counter
  if (!userId) {
    if (counter.assignedOperator) {
      await User.findByIdAndUpdate(counter.assignedOperator, { assignedCounter: null });
    }
    counter.assignedOperator = null;
    counter.status = COUNTER_STATUS.OFFLINE;
    await counter.save();
    return res.status(200).json({ success: true, message: 'Staff unassigned successfully', data: { counter } });
  }

  // 2. Assign: Validating the incoming user
  const newStaff = await User.findById(userId);
  if (!newStaff) {
    return res.status(404).json({ success: false, message: 'Staff user not found' });
  }
  
  // Optional safety: guarantee role is STAFF properly (or OPERATOR depending on your constants)
  if (newStaff.role !== 'STAFF' && newStaff.role.toLowerCase() !== 'operator') {
    return res.status(400).json({ success: false, message: 'Target user does not have STAFF/OPERATOR privileges' });
  }

  // Perform bi-directional cleanup logic
  
  // A. If mapping the NEW staff, check if they are already on another counter
  if (newStaff.assignedCounter && newStaff.assignedCounter.toString() !== id) {
    await Counter.findByIdAndUpdate(newStaff.assignedCounter, { assignedOperator: null, status: COUNTER_STATUS.OFFLINE });
  }

  // B. If mapping this counter, check if there is ALREADY a staff assigned we need to kick off
  if (counter.assignedOperator && counter.assignedOperator.toString() !== userId) {
    await User.findByIdAndUpdate(counter.assignedOperator, { assignedCounter: null });
  }

  // Finalize Assignments
  counter.assignedOperator = userId;
  await counter.save();

  newStaff.assignedCounter = id;
  if (!newStaff.assignedBranch) newStaff.assignedBranch = counter.branchId; 
  await newStaff.save();

  // Populate fully to return updated state
  const updatedCounter = await Counter.findById(id)
    .populate('branchId', 'name')
    .populate('departmentId', 'name')
    .populate('assignedOperator', 'name email role');

  res.status(200).json({
    success: true,
    message: 'Staff assigned to counter successfully',
    data: { counter: updatedCounter }
  });
});
