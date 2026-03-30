import mongoose from 'mongoose';
import { TOKEN_STATUS, TOKEN_PRIORITY, BOOKING_TYPE } from '../utils/constants.js';

const tokenSchema = new mongoose.Schema({
  tokenNumber: {
    type: String,
    required: [true, 'Token number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{1,3}\d{1,4}$/, 'Token number must be in format like A001, AB123']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required']
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  counterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Counter',
    default: null
  },
  bookingType: {
    type: String,
    enum: Object.values(BOOKING_TYPE),
    required: [true, 'Booking type is required']
  },
  priority: {
    type: String,
    enum: Object.values(TOKEN_PRIORITY),
    default: TOKEN_PRIORITY.NORMAL
  },
  status: {
    type: String,
    enum: Object.values(TOKEN_STATUS),
    default: TOKEN_STATUS.WAITING
  },
  scheduledTime: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  checkedInAt: {
    type: Date,
    default: null
  },
  startedServiceAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  estimatedWaitTime: {
    type: Number,
    default: 0,
    min: [0, 'Wait time cannot be negative']
  },
  actualServiceTime: {
    type: Number,
    default: null,
    min: [0, 'Service time cannot be negative']
  },
  noShowCount: {
    type: Number,
    default: 0,
    min: [0, 'No-show count cannot be negative']
  },
  qrCode: {
    type: String,
    unique: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  metadata: {
    sourceIp: String,
    userAgent: String,
    bookingChannel: {
      type: String,
      default: 'web'
    },
    referralSource: String
  },
  alerts: {
    approachingSent: {
      type: Boolean,
      default: false
    },
    missedSent: {
      type: Boolean,
      default: false
    },
    completedSent: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Virtual for calculating queue position (to be populated by queue service)
tokenSchema.virtual('queuePosition').get(function() {
  // This will be calculated dynamically based on current queue state
  return null;
});

// Virtual for time in queue
tokenSchema.virtual('timeInQueue').get(function() {
  if (this.status === TOKEN_STATUS.COMPLETED || this.status === TOKEN_STATUS.MISSED) {
    return this.completedAt - this.createdAt;
  }
  return Date.now() - this.createdAt;
});

// Virtual for service duration
tokenSchema.virtual('serviceDuration').get(function() {
  if (this.startedServiceAt && this.completedAt) {
    return this.completedAt - this.startedServiceAt;
  }
  if (this.startedServiceAt) {
    return Date.now() - this.startedServiceAt;
  }
  return null;
});

// Method to check if token is expired
tokenSchema.methods.isExpired = function() {
  const now = new Date();
  const expiryTime = new Date(this.scheduledTime);
  expiryTime.setMinutes(expiryTime.getMinutes() + 30); // 30 minutes grace period
  return now > expiryTime && this.status === TOKEN_STATUS.WAITING;
};

// Method to check if token can be cancelled
tokenSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const cutoffTime = new Date(this.scheduledTime);
  cutoffTime.setMinutes(cutoffTime.getMinutes() - 30); // Can't cancel within 30 minutes
  return now < cutoffTime && this.status === TOKEN_STATUS.WAITING;
};

// Method to update status with validation
tokenSchema.methods.updateStatus = function(newStatus, performedBy, reason = '') {
  const validTransitions = {
    [TOKEN_STATUS.WAITING]: [
      TOKEN_STATUS.SERVING,
      TOKEN_STATUS.HELD,
      TOKEN_STATUS.SKIPPED,
      TOKEN_STATUS.MISSED,
      TOKEN_STATUS.CANCELLED
    ],
    [TOKEN_STATUS.SERVING]: [
      TOKEN_STATUS.COMPLETED,
      TOKEN_STATUS.HELD,
      TOKEN_STATUS.SKIPPED
    ],
    [TOKEN_STATUS.HELD]: [
      TOKEN_STATUS.WAITING,
      TOKEN_STATUS.SERVING,
      TOKEN_STATUS.CANCELLED
    ],
    [TOKEN_STATUS.SKIPPED]: [
      TOKEN_STATUS.WAITING,
      TOKEN_STATUS.MISSED,
      TOKEN_STATUS.CANCELLED
    ],
    [TOKEN_STATUS.MISSED]: [
      TOKEN_STATUS.WAITING,
      TOKEN_STATUS.CANCELLED
    ],
    [TOKEN_STATUS.COMPLETED]: [],
    [TOKEN_STATUS.CANCELLED]: []
  };

  if (!validTransitions[this.status]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }

  const oldStatus = this.status;
  this.status = newStatus;

  // Update timestamps based on status
  const now = new Date();
  switch (newStatus) {
    case TOKEN_STATUS.SERVING:
      this.startedServiceAt = now;
      break;
    case TOKEN_STATUS.COMPLETED:
      this.completedAt = now;
      if (this.startedServiceAt) {
        this.actualServiceTime = (now - this.startedServiceAt) / (1000 * 60); // in minutes
      }
      break;
    case TOKEN_STATUS.MISSED:
      this.noShowCount += 1;
      break;
  }

  return {
    oldStatus,
    newStatus,
    performedBy,
    reason,
    timestamp: now
  };
};

// Index for faster queries
tokenSchema.index({ tokenNumber: 1 });
tokenSchema.index({ userId: 1 });
tokenSchema.index({ branchId: 1, departmentId: 1 });
tokenSchema.index({ status: 1 });
tokenSchema.index({ scheduledTime: 1 });
tokenSchema.index({ priority: 1, status: 1, scheduledTime: 1 });
tokenSchema.index({ bookingType: 1 });

// Compound index for queue queries
tokenSchema.index({ 
  branchId: 1, 
  departmentId: 1, 
  status: 1, 
  priority: 1, 
  scheduledTime: 1 
});

export default mongoose.model('Token', tokenSchema);
