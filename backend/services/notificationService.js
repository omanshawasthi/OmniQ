import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';
import logger from '../config/logger.js';

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeEmailService();
  }

  // Initialize email service
  initializeEmailService() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } catch (error) {
      logger.warn('Email service initialization failed:', error.message);
    }
  }

  // Create notification
  async createNotification(data) {
    try {
      const notification = await Notification.create(data);
      
      // Emit real-time notification if socket is available
      if (global.io) {
        global.io.to(notification.recipient.toString()).emit('notification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.createdAt
        });
      }

      logger.info(`Notification created: ${notification.type} for user ${notification.recipient}`);
      return notification;
    } catch (error) {
      logger.error('Create notification error:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(to, subject, htmlContent) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${subject}`);
      return result;
    } catch (error) {
      logger.error('Send email error:', error);
      // Don't throw error, just log it
      return null;
    }
  }

  // Send booking confirmation
  async sendBookingConfirmation(userId, tokenData) {
    try {
      // Create in-app notification
      await this.createNotification({
        recipient: userId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Confirmed',
        message: `Your token ${tokenData.tokenNumber} has been confirmed. Estimated wait time: ${tokenData.estimatedWaitTime} minutes.`,
        token: tokenData._id,
        metadata: {
          waitTime: tokenData.estimatedWaitTime,
          queuePosition: tokenData.position
        }
      });

      // Send email (if user has email)
      const emailHtml = this.generateBookingConfirmationEmail(tokenData);
      await this.sendEmailNotification(
        tokenData.user.email,
        'Queueless - Booking Confirmed',
        emailHtml
      );
    } catch (error) {
      logger.error('Send booking confirmation error:', error);
    }
  }

  // Send token approaching notification
  async sendTokenApproaching(userId, tokenData) {
    try {
      await this.createNotification({
        recipient: userId,
        type: 'TOKEN_APPROACHING',
        title: 'Your Token is Approaching',
        message: `Token ${tokenData.tokenNumber} will be called soon. Please proceed to the counter.`,
        token: tokenData._id,
        priority: 'HIGH',
        metadata: {
          queuePosition: tokenData.position,
          estimatedWaitTime: tokenData.estimatedWaitTime
        }
      });
    } catch (error) {
      logger.error('Send token approaching error:', error);
    }
  }

  // Send token missed notification
  async sendTokenMissed(userId, tokenData) {
    try {
      await this.createNotification({
        recipient: userId,
        type: 'TOKEN_MISSED',
        title: 'Token Missed',
        message: `Token ${tokenData.tokenNumber} was missed. Please book a new token if needed.`,
        token: tokenData._id,
        priority: 'MEDIUM'
      });
    } catch (error) {
      logger.error('Send token missed error:', error);
    }
  }

  // Send queue completed notification
  async sendQueueCompleted(userId, tokenData) {
    try {
      await this.createNotification({
        recipient: userId,
        type: 'QUEUE_COMPLETED',
        title: 'Service Completed',
        message: `Your service for token ${tokenData.tokenNumber} has been completed.`,
        token: tokenData._id,
        priority: 'LOW'
      });
    } catch (error) {
      logger.error('Send queue completed error:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = options;
      
      const query = { recipient: userId };
      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .populate('token')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Notification.countDocuments(query);
      const unread = await Notification.countDocuments({ recipient: userId, isRead: false });

      return {
        notifications,
        total,
        unread,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Get user notifications error:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
      );

      return { updated: result.modifiedCount };
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      throw error;
    }
  }

  // Generate email templates
  generateBookingConfirmationEmail(tokenData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Queueless - Booking Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .token-info { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Queueless</h1>
            <p>Booking Confirmed</p>
          </div>
          <div class="content">
            <h2>Your token has been confirmed!</h2>
            <div class="token-info">
              <p><strong>Token Number:</strong> ${tokenData.tokenNumber}</p>
              <p><strong>Queue Position:</strong> ${tokenData.position}</p>
              <p><strong>Estimated Wait Time:</strong> ${tokenData.estimatedWaitTime} minutes</p>
              <p><strong>Department:</strong> ${tokenData.department?.name || 'N/A'}</p>
            </div>
            <p>Please arrive at the counter a few minutes before your token is called.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Queueless. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new NotificationService();
