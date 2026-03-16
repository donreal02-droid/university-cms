const NotificationSettings = require('../models/NotificationSettings');

class NotificationService {
  
  // Check if user wants this type of notification
  static async shouldSendNotification(userId, type) {
    try {
      const settings = await NotificationSettings.findOne({ userId });
      if (!settings) return true; // Default to true if no settings
      
      // Check quiet hours
      if (settings.quietHoursEnabled) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime >= settings.quietHoursStart || currentTime < settings.quietHoursEnd) {
          console.log(`Quiet hours active, skipping ${type} notification for user ${userId}`);
          return false;
        }
      }
      
      // Check specific notification type
      switch(type) {
        case 'assignment':
          return settings.assignmentReminders;
        case 'quiz':
          return settings.quizReminders;
        case 'grade':
          return settings.gradeAlerts;
        case 'announcement':
          return settings.announcementAlerts;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking notification settings:', error);
      return true; // Default to true on error
    }
  }
  
  // Send email notification
  static async sendEmail(userId, subject, message, type) {
    const shouldSend = await this.shouldSendNotification(userId, type);
    if (!shouldSend) return false;
    
    try {
      // Get user email from database
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user || !user.email) return false;
      
      // TODO: Implement actual email sending logic
      console.log(`Sending email to ${user.email}: ${subject}`);
      
      // Example with nodemailer:
      // await transporter.sendMail({
      //   to: user.email,
      //   subject,
      //   text: message
      // });
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  // Send in-app notification
  static async createInAppNotification(userId, title, message, type, relatedId = null) {
    const Notification = require('../models/Notification'); // You'll need this model
    
    try {
      const notification = new Notification({
        userId,
        title,
        message,
        type,
        relatedId,
        read: false,
        createdAt: new Date()
      });
      
      await notification.save();
      
      // Emit socket event if user is online
      // io.to(userId).emit('newNotification', notification);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }
}

module.exports = NotificationService;