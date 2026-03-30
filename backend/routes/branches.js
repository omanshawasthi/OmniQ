import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Branch from '../src/models/Branch.js';
import Department from '../src/models/Department.js';

const router = express.Router();

// All routes are protected
router.use(authenticate);

// Get all branches
router.get('/', async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true })
      .select('name address phone email operatingHours')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: branches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branches',
      error: error.message
    });
  }
});

// Get single branch
router.get('/:id', async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch',
      error: error.message
    });
  }
});

// Get departments for a branch
router.get('/:id/departments', async (req, res) => {
  try {
    const departments = await Department.find({ 
      branchId: req.params.id, 
      isActive: true 
    })
      .select('name description averageServiceTime settings prioritySupport')
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
});

export default router;
