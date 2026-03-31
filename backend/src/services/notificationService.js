import Notification from '../models/Notification.js';
import { NOTIFICATION_TYPES } from '../utils/constants.js';

export class NotificationService {
  /**
   * General method to create a notification
   */
  static async createNotification(data) {
    try {
      return await Notification.createNotification(data);
    } catch (error) {
      console.error('Error creating notification:', error);
      // We generally don't want notification failure to break the main flow
      return null;
    }
  }

  /**
   * Send booking confirmation notification
   */
  static async sendBookingConfirmation(user, token) {
    if (!user || !user._id) return;
    
    return this.createNotification({
      userId: user._id,
      tokenId: token._id,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMATION,
      title: 'Booking Confirmed',
      message: `Your token ${token.tokenNumber} has been booked for ${token.departmentId?.name || 'the requested service'}.`,
      priority: 'high',
      metadata: {
        actionUrl: `/token/${token._id}`
      }
    });
  }

  /**
   * Send token approaching notification
   */
  static async sendTokenApproachingAlert(user, token, peopleAhead) {
    if (!user || !user._id) return;

    return this.createNotification({
      userId: user._id,
      tokenId: token._id,
      type: NOTIFICATION_TYPES.QUEUE_ALERT,
      title: 'Your Turn is Approaching!',
      message: `There are only ${peopleAhead} people ahead of you for token ${token.tokenNumber}. Please head to the counter/branch.`,
      priority: 'high',
      metadata: {
        actionUrl: `/live-queue/${token._id}`
      }
    });
  }

  /**
   * Send completion notification
   */
  static async sendTokenCompleted(user, token) {
    if (!user || !user._id) return;

    return this.createNotification({
      userId: user._id,
      tokenId: token._id,
      type: NOTIFICATION_TYPES.STATUS_UPDATE,
      title: 'Service Completed',
      message: `Token ${token.tokenNumber} service has been completed. Thank you for visiting!`,
      priority: 'medium',
      metadata: {
        actionUrl: `/token/${token._id}`
      }
    });
  }
}
