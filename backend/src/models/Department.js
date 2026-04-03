import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required']
  },
  averageServiceTime: {
    type: Number,
    required: [true, 'Average service time is required'],
    min: [1, 'Service time must be at least 1 minute'],
    max: [180, 'Service time cannot exceed 3 hours'],
    default: 15
  },
  isActive: {
    type: Boolean,
    default: true
  },
  prioritySupport: {
    type: Boolean,
    default: false
  },
  settings: {
    allowOnlineBooking: {
      type: Boolean,
      default: true
    },
    allowWalkIn: {
      type: Boolean,
      default: true
    },
    maxAdvanceBookingDays: {
      type: Number,
      default: 7,
      min: [1, 'Must allow at least 1 day advance booking'],
      max: [30, 'Cannot allow more than 30 days advance booking']
    },
    tokensPerSlot: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 token per slot is required'],
      max: [10, 'Cannot exceed 10 tokens per slot']
    },
    slotDurationMinutes: {
      type: Number,
      default: 15,
      min: [5, 'Slot duration must be at least 5 minutes'],
      max: [60, 'Slot duration cannot exceed 60 minutes']
    }
  },
  operatingHours: {
    monday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    tuesday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    wednesday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    thursday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    friday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    saturday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    sunday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    }
  },
  color: {
    type: String,
    default: '#3b82f6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid color code']
  },
  icon: {
    type: String,
    default: '🏢'
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for checking if department is currently open
departmentSchema.virtual('isOpen').get(function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const todayHours = this.operatingHours[dayName];
  if (!todayHours || todayHours.isClosed) return false;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
});

// Index for faster queries
departmentSchema.index({ branchId: 1, isActive: 1 });
departmentSchema.index({ name: 1 });
departmentSchema.index({ sortOrder: 1 });

// Ensure unique department name per branch
departmentSchema.index({ branchId: 1, name: 1 }, { unique: true });

export default mongoose.model('Department', departmentSchema);
