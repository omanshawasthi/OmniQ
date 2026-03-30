import { sendEmail, emailTemplates } from '../config/nodemailer.js'
import Notification from '../models/Notification.js'
import { NOTIFICATION_TYPES } from '../utils/constants.js'

export class EmailService {
  // Send booking confirmation email
  static async sendBookingConfirmation(token, user) {
    try {
      const emailContent = emailTemplates.bookingConfirmed(
        token.tokenNumber,
        token.branchId?.name,
        token.departmentId?.name,
        token.scheduledTime
      )

      await sendEmail({
        to: user.email,
        subject: 'Queueless - Token Booking Confirmed',
        html: emailContent
      })

      // Create notification record
      await Notification.createNotification({
        userId: user._id,
        tokenId: token._id,
        type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
        title: 'Token Booked Successfully',
        message: `Your token ${token.tokenNumber} has been booked for ${token.scheduledTime}`,
        emailSent: true
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to send booking confirmation:', error)
      
      // Create notification record even if email fails
      await Notification.createNotification({
        userId: user._id,
        tokenId: token._id,
        type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
        title: 'Token Booked Successfully',
        message: `Your token ${token.tokenNumber} has been booked for ${token.scheduledTime}`,
        emailSent: false
      })

      return { success: false, error: error.message }
    }
  }

  // Send token approaching notification
  static async sendTokenApproaching(token, user) {
    try {
      const emailContent = emailTemplates.tokenApproaching(
        token.tokenNumber,
        Math.round(token.estimatedWaitTime || 0)
      )

      await sendEmail({
        to: user.email,
        subject: 'Queueless - Your Token is Approaching',
        html: emailContent
      })

      // Create notification record
      await Notification.createNotification({
        userId: user._id,
        tokenId: token._id,
        type: NOTIFICATION_TYPES.TOKEN_APPROACHING,
        title: 'Your Token is Approaching',
        message: `Token ${token.tokenNumber} will be called soon. Estimated wait time: ${Math.round(token.estimatedWaitTime || 0)} minutes`,
        emailSent: true
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to send token approaching notification:', error)
      return { success: false, error: error.message }
    }
  }

  // Send missed token notification
  static async sendMissedToken(token, user) {
    try {
      const emailContent = emailTemplates.missedToken(
        token.tokenNumber,
        `${process.env.FRONTEND_URL}/reschedule/${token._id}`
      )

      await sendEmail({
        to: user.email,
        subject: 'Queueless - Token Missed',
        html: emailContent
      })

      // Create notification record
      await Notification.createNotification({
        userId: user._id,
        tokenId: token._id,
        type: NOTIFICATION_TYPES.MISSED_TOKEN,
        title: 'Token Missed',
        message: `Your token ${token.tokenNumber} was missed. You can reschedule your appointment.`,
        emailSent: true
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to send missed token notification:', error)
      return { success: false, error: error.message }
    }
  }

  // Send token completed notification
  static async sendTokenCompleted(token, user) {
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e; font-size: 24px; margin-bottom: 20px;">✅ Service Completed</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Your token service has been completed successfully.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #111827; font-weight: bold;">Token Details:</p>
            <p style="margin: 8px 0; color: #374151;">
              Token Number: <span style="font-weight: bold;">${token.tokenNumber}</span>
            </p>
            <p style="margin: 8px 0; color: #374151;">
              Service: <span style="font-weight: bold;">${token.departmentId?.name}</span>
            </p>
            <p style="margin: 8px 0; color: #374151;">
              Service Time: <span style="font-weight: bold;">${Math.round(token.actualServiceTime || 0)} minutes</span>
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Thank you for using Queueless. We hope to see you again soon!
          </p>
        </div>
      `

      await sendEmail({
        to: user.email,
        subject: 'Queueless - Service Completed',
        html: emailContent
      })

      // Create notification record
      await Notification.createNotification({
        userId: user._id,
        tokenId: token._id,
        type: NOTIFICATION_TYPES.TOKEN_COMPLETED,
        title: 'Service Completed',
        message: `Your token ${token.tokenNumber} service has been completed. Service time: ${Math.round(token.actualServiceTime || 0)} minutes`,
        emailSent: true
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to send token completed notification:', error)
      return { success: false, error: error.message }
    }
  }

  // Send queue delay notification
  static async sendQueueDelayNotification(token, user, delayMinutes) {
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b; font-size: 24px; margin-bottom: 20px;">⏰ Queue Delay Update</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            There's a delay in the queue. Your estimated wait time has been updated.
          </p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">Updated Information:</p>
            <p style="margin: 8px 0; color: #92400e;">
              Token Number: <span style="font-weight: bold;">${token.tokenNumber}</span>
            </p>
            <p style="margin: 8px 0; color: #92400e;">
              New Estimated Wait Time: <span style="font-weight: bold;">${Math.round(token.estimatedWaitTime || 0)} minutes</span>
            </p>
            <p style="margin: 8px 0; color: #92400e;">
              Additional Delay: <span style="font-weight: bold;">${delayMinutes} minutes</span>
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            We apologize for the inconvenience. Thank you for your patience.
          </p>
        </div>
      `

      await sendEmail({
        to: user.email,
        subject: 'Queueless - Queue Delay Update',
        html: emailContent
      })

      // Create notification record
      await Notification.createNotification({
        userId: user._id,
        tokenId: token._id,
        type: NOTIFICATION_TYPES.QUEUE_DELAYED,
        title: 'Queue Delay Update',
        message: `Queue delay detected. New estimated wait time: ${Math.round(token.estimatedWaitTime || 0)} minutes (${delayMinutes} minutes delay)`,
        emailSent: true
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to send queue delay notification:', error)
      return { success: false, error: error.message }
    }
  }

  // Send token cancelled notification
  static async sendTokenCancelled(token, user) {
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444; font-size: 24px; margin-bottom: 20px;">❌ Token Cancelled</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Your token has been cancelled as requested.
          </p>
          
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: bold;">Cancelled Token:</p>
            <p style="margin: 8px 0; color: #991b1b;">
              Token Number: <span style="font-weight: bold;">${token.tokenNumber}</span>
            </p>
            <p style="margin: 8px 0; color: #991b1b;">
              Service: <span style="font-weight: bold;">${token.departmentId?.name}</span>
            </p>
            <p style="margin: 8px 0; color: #991b1b;">
              Scheduled Time: <span style="font-weight: bold;">${new Date(token.scheduledTime).toLocaleString()}</span>
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            You can book a new token anytime through our platform.
          </p>
        </div>
      `

      await sendEmail({
        to: user.email,
        subject: 'Queueless - Token Cancelled',
        html: emailContent
      })

      // Create notification record
      await Notification.createNotification({
        userId: user._id,
        tokenId: token._id,
        type: NOTIFICATION_TYPES.TOKEN_CANCELLED,
        title: 'Token Cancelled',
        message: `Your token ${token.tokenNumber} has been cancelled`,
        emailSent: true
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to send token cancelled notification:', error)
      return { success: false, error: error.message }
    }
  }

  // Send welcome email to new users
  static async sendWelcomeEmail(user) {
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6; font-size: 24px; margin-bottom: 20px;">👋 Welcome to Queueless!</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Welcome ${user.name}! Your account has been successfully created.
          </p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af; font-weight: bold;">Account Details:</p>
            <p style="margin: 8px 0; color: #1e40af;">
              Name: <span style="font-weight: bold;">${user.name}</span>
            </p>
            <p style="margin: 8px 0; color: #1e40af;">
              Email: <span style="font-weight: bold;">${user.email}</span>
            </p>
            <p style="margin: 8px 0; color: #1e40af;">
              Role: <span style="font-weight: bold;">${user.role}</span>
            </p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Get started by booking your first token and experience the convenience of queue management!
          </p>
        </div>
      `

      await sendEmail({
        to: user.email,
        subject: 'Welcome to Queueless!',
        html: emailContent
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      return { success: false, error: error.message }
    }
  }

  // Send password reset email
  static async sendPasswordResetEmail(user, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444; font-size: 24px; margin-bottom: 20px;">🔒 Password Reset</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            You requested to reset your password. Click the button below to set a new password.
          </p>
          
          <div style="margin: 20px 0;">
            <a href="${resetLink}" 
               style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `

      await sendEmail({
        to: user.email,
        subject: 'Queueless - Password Reset',
        html: emailContent
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      return { success: false, error: error.message }
    }
  }

  // Send bulk notifications (for system updates, etc.)
  static async sendBulkNotification(subject, message, recipientFilter = {}) {
    try {
      // This would fetch users based on filter criteria
      // For now, it's a placeholder for bulk email functionality
      console.log('Bulk notification:', { subject, message, recipientFilter })
      return { success: true }
    } catch (error) {
      console.error('Failed to send bulk notification:', error)
      return { success: false, error: error.message }
    }
  }

  // Process email queue (for sending emails asynchronously)
  static async processEmailQueue() {
    try {
      // Get notifications that haven't been sent via email
      const pendingNotifications = await Notification.find({
        emailSent: false,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })
      .populate('userId')
      .populate('tokenId')

      for (const notification of pendingNotifications) {
        try {
          let result
          
          switch (notification.type) {
            case NOTIFICATION_TYPES.BOOKING_CONFIRMED:
              if (notification.tokenId) {
                result = await this.sendBookingConfirmation(notification.tokenId, notification.userId)
              }
              break
            case NOTIFICATION_TYPES.TOKEN_APPROACHING:
              if (notification.tokenId) {
                result = await this.sendTokenApproaching(notification.tokenId, notification.userId)
              }
              break
            case NOTIFICATION_TYPES.MISSED_TOKEN:
              if (notification.tokenId) {
                result = await this.sendMissedToken(notification.tokenId, notification.userId)
              }
              break
            case NOTIFICATION_TYPES.TOKEN_COMPLETED:
              if (notification.tokenId) {
                result = await this.sendTokenCompleted(notification.tokenId, notification.userId)
              }
              break
            default:
              console.log('Unknown notification type:', notification.type)
              continue
          }

          if (result?.success) {
            // Mark as sent
            await Notification.findByIdAndUpdate(notification._id, { emailSent: true })
          }
        } catch (error) {
          console.error('Failed to process notification:', notification._id, error)
        }
      }

      return { processed: pendingNotifications.length }
    } catch (error) {
      console.error('Failed to process email queue:', error)
      return { processed: 0, error: error.message }
    }
  }
}

export default EmailService
