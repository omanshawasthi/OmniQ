import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../utils/constants.js';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  tokenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
    default: null
  },
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPES),
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  smsSent: {
    type: Boolean,
    default: false
  },
  pushSent: {
    type: Boolean,
    default: false
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  sentAt: {
    type: Date,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  metadata: {
    actionUrl: String,
    actionText: String,
    icon: String,
    color: String,
    additionalData: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return Date.now() > this.expiresAt;
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this({
    userId: data.userId,
    tokenId: data.tokenId || null,
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority || 'medium',
    metadata: data.metadata || {},
    scheduledAt: data.scheduledAt || new Date(),
    expiresAt: data.expiresAt || null
  });
  
  return await notification.save();
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options;
  
  const query = { userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  // Don't include expired notifications
  query.$or = [
    { expiresAt: null },
    { expiresAt: { $gt: new Date() } }
  ];
  
  const notifications = await this.find(query)
    .populate('tokenId', 'tokenNumber status')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await this.countDocuments(query);
  
  return {
    notifications,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
    unreadCount: await this.countDocuments({ userId, isRead: false })
  };
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return await this.findOneAndUpdate(
    { _id: notificationId, userId },
    { 
      isRead: true, 
      readAt: new Date() 
    },
    { new: true }
  );
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ 
    userId, 
    isRead: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Method to mark as sent
notificationSchema.methods.markAsSent = function(channel = 'email') {
  const updateData = { sentAt: new Date() };
  
  switch (channel) {
    case 'email':
      updateData.emailSent = true;
      break;
    case 'sms':
      updateData.smsSent = true;
      break;
    case 'push':
      updateData.pushSent = true;
      break;
  }
  
  Object.assign(this, updateData);
  return this.save();
};

// Index for faster queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ tokenId: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ expiresAt: 1 });

export default mongoose.model('Notification', notificationSchema);
