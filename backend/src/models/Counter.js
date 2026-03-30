import mongoose from 'mongoose';
import { COUNTER_STATUS } from '../utils/constants.js';

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Counter name is required'],
    trim: true,
    maxlength: [50, 'Counter name cannot exceed 50 characters']
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
  assignedOperator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: Object.values(COUNTER_STATUS),
    default: COUNTER_STATUS.OFFLINE
  },
  currentToken: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    default: null
  },
  totalServedToday: {
    type: Number,
    default: 0,
    min: [0, 'Total served cannot be negative']
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  settings: {
    autoCallNext: {
      type: Boolean,
      default: false
    },
    maxConcurrentTokens: {
      type: Number,
      default: 1,
      min: [1, 'Must handle at least 1 token'],
      max: [5, 'Cannot handle more than 5 tokens simultaneously']
    },
    breakDurationMinutes: {
      type: Number,
      default: 15,
      min: [5, 'Break duration must be at least 5 minutes'],
      max: [60, 'Break duration cannot exceed 60 minutes']
    }
  },
  statistics: {
    totalTokensServed: {
      type: Number,
      default: 0
    },
    averageServiceTime: {
      type: Number,
      default: 0
    },
    totalBreakTime: {
      type: Number,
      default: 0
    },
    lastBreakStart: {
      type: Date,
      default: null
    }
  },
  location: {
    floor: String,
    section: String,
    description: String
  },
  equipment: {
    hasDisplay: {
      type: Boolean,
      default: false
    },
    hasPrinter: {
      type: Boolean,
      default: false
    },
    hasScanner: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Virtual for checking if counter is currently active
counterSchema.virtual('isActive').get(function() {
  return this.status === COUNTER_STATUS.ACTIVE;
});

// Virtual for time since last activity
counterSchema.virtual('timeSinceLastActivity').get(function() {
  return Date.now() - this.lastActivity;
});

// Method to update statistics when token is completed
counterSchema.methods.updateStatistics = async function(serviceTime) {
  this.totalServedToday += 1;
  this.statistics.totalTokensServed += 1;
  
  // Update average service time
  const totalTokens = this.statistics.totalTokensServed;
  const currentAvg = this.statistics.averageServiceTime;
  this.statistics.averageServiceTime = ((currentAvg * (totalTokens - 1)) + serviceTime) / totalTokens;
  
  this.lastActivity = new Date();
  return this.save();
};

// Method to start break
counterSchema.methods.startBreak = function() {
  this.status = COUNTER_STATUS.PAUSED;
  this.statistics.lastBreakStart = new Date();
  this.lastActivity = new Date();
  return this.save();
};

// Method to end break
counterSchema.methods.endBreak = function() {
  if (this.statistics.lastBreakStart) {
    const breakDuration = (Date.now() - this.statistics.lastBreakStart) / (1000 * 60); // in minutes
    this.statistics.totalBreakTime += breakDuration;
    this.statistics.lastBreakStart = null;
  }
  this.status = COUNTER_STATUS.ACTIVE;
  this.lastActivity = new Date();
  return this.save();
};

// Index for faster queries
counterSchema.index({ branchId: 1, departmentId: 1 });
counterSchema.index({ assignedOperator: 1 });
counterSchema.index({ status: 1 });
counterSchema.index({ lastActivity: 1 });

// Ensure unique counter name per branch
counterSchema.index({ branchId: 1, name: 1 }, { unique: true });

export default mongoose.model('Counter', counterSchema);
