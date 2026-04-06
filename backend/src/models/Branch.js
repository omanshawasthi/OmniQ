import mongoose from 'mongoose';

const operatingHoursSchema = new mongoose.Schema({
  open: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  close: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  isClosed: {
    type: Boolean,
    default: false
  }
});

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true,
    maxlength: [100, 'Branch name cannot exceed 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  coordinates: {
    lat: {
      type: Number,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  operatingHours: {
    monday: operatingHoursSchema,
    tuesday: operatingHoursSchema,
    wednesday: operatingHoursSchema,
    thursday: operatingHoursSchema,
    friday: operatingHoursSchema,
    saturday: operatingHoursSchema,
    sunday: operatingHoursSchema
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    maxTokensPerDay: {
      type: Number,
      default: 500,
      min: [1, 'Max tokens per day must be at least 1']
    },
    tokenExpiryMinutes: {
      type: Number,
      default: 30,
      min: [5, 'Token expiry must be at least 5 minutes']
    },
    gracePeriodMinutes: {
      type: Number,
      default: 10,
      min: [1, 'Grace period must be at least 1 minute']
    },
    averageWaitTimeMinutes: {
      type: Number,
      default: 15,
      min: [1, 'Average wait time must be at least 1 minute']
    }
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if branch is currently open
branchSchema.virtual('isOpen').get(function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const todayHours = this.operatingHours[dayName];
  if (!todayHours || todayHours.isClosed) return false;
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
});

// Virtual for departments relationship
branchSchema.virtual('departments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'branchId'
});

// Index for faster queries
branchSchema.index({ name: 1 });
branchSchema.index({ isActive: 1 });
branchSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

export default mongoose.model('Branch', branchSchema);
