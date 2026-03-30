import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"Queueless" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

export const emailTemplates = {
  bookingConfirmed: (tokenNumber, branchName, departmentName, scheduledTime) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">✅ Token Booked Successfully</h2>
      <p>Your token has been confirmed. Here are your details:</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Token Number:</strong> ${tokenNumber}</p>
        <p><strong>Branch:</strong> ${branchName}</p>
        <p><strong>Department:</strong> ${departmentName}</p>
        <p><strong>Scheduled Time:</strong> ${new Date(scheduledTime).toLocaleString()}</p>
      </div>
      
      <p>Please arrive 10 minutes before your scheduled time. You can check your queue status in real-time through our app.</p>
      
      <p style="color: #6b7280; font-size: 14px;">This is an automated message from Queueless.</p>
    </div>
  `,

  tokenApproaching: (tokenNumber, estimatedTime) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">⏰ Your Turn is Approaching</h2>
      <p>Your token will be called soon. Please be ready:</p>
      
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Token Number:</strong> ${tokenNumber}</p>
        <p><strong>Estimated Time:</strong> ${estimatedTime} minutes</p>
      </div>
      
      <p>Please proceed to the counter area and wait for your token to be called.</p>
      
      <p style="color: #6b7280; font-size: 14px;">This is an automated message from Queueless.</p>
    </div>
  `,

  missedToken: (tokenNumber, rescheduleLink) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">❌ Token Missed</h2>
      <p>Your token was called but you were not present:</p>
      
      <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Token Number:</strong> ${tokenNumber}</p>
        <p><strong>Status:</strong> Missed</p>
      </div>
      
      <p>You can reschedule your appointment by clicking the link below:</p>
      <a href="${rescheduleLink}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reschedule Token</a>
      
      <p style="color: #6b7280; font-size: 14px;">This is an automated message from Queueless.</p>
    </div>
  `
};
