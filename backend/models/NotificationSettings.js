const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  assignmentReminders: {
    type: Boolean,
    default: true
  },
  quizReminders: {
    type: Boolean,
    default: true
  },
  gradeAlerts: {
    type: Boolean,
    default: true
  },
  announcementAlerts: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: false
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  reminderTiming: {
    type: String,
    enum: ['15min', '30min', '1hour', '1day'],
    default: '1hour'
  },
  quietHoursStart: {
    type: String,
    default: '22:00'
  },
  quietHoursEnd: {
    type: String,
    default: '08:00'
  },
  quietHoursEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);