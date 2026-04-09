import mongoose from 'mongoose';
import { QUEUE_ACTIONS } from '../utils/constants.js';

const queueLogSchema = new mongoose.Schema({
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    required: [true, 'Token ID is required']
  },
  action: {
    type: String,
    enum: Object.values(QUEUE_ACTIONS),
    required: [true, 'Action is required']
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for system-generated actions
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    previousStatus: String,
    newStatus: String,
    reason: String,
    duration: Number, // in minutes
    queuePosition: Number,
    estimatedWaitTime: Number,
    additionalData: mongoose.Schema.Types.Mixed
  },
  systemGenerated: {
    type: Boolean,
    default: false
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Static method to log queue actions
queueLogSchema.statics.logAction = async function(data) {
  const log = new this({
    tokenId: data.tokenId,
    action: data.action,
    performedBy: data.performedBy,
    metadata: data.metadata || {},
    systemGenerated: data.systemGenerated || false,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent
  });
  
  return await log.save();
};

// Static method to get token history
queueLogSchema.statics.getTokenHistory = async function(tokenId) {
  return await this.find({ tokenId })
    .populate('performedBy', 'name email role')
    .sort({ timestamp: 1 });
};

// Static method to get activity (formerly counter activity)
queueLogSchema.statics.getActivity = async function(startDate, endDate) {
  const query = {
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return await this.find(query)
    .populate('performedBy', 'name email')
    .sort({ timestamp: -1 });
};

// Static method to get daily statistics
queueLogSchema.statics.getDailyStats = async function(branchId, departmentId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const matchStage = {
    timestamp: { $gte: startOfDay, $lte: endOfDay }
  };
  
  if (branchId) {
    matchStage['metadata.branchId'] = branchId;
  }
  
  if (departmentId) {
    matchStage['metadata.departmentId'] = departmentId;
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        avgDuration: { $avg: '$metadata.duration' }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      avgDuration: stat.avgDuration || 0
    };
    return acc;
  }, {});
};

// Index for faster queries
queueLogSchema.index({ tokenId: 1, timestamp: -1 });
queueLogSchema.index({ performedBy: 1, timestamp: -1 });
queueLogSchema.index({ action: 1, timestamp: -1 });
queueLogSchema.index({ timestamp: -1 });

export default mongoose.model('QueueLog', queueLogSchema);
