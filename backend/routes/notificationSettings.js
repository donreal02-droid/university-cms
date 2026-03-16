const express = require('express');
const router = express.Router();
const NotificationSettings = require('../models/NotificationSettings');
const { protect } = require('../middleware/auth');

// Get notification settings
router.get('/settings', protect, async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne({ userId: req.user.id });
    
    // Create default settings if not exists
    if (!settings) {
      settings = new NotificationSettings({ userId: req.user.id });
      await settings.save();
    }
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification settings'
    });
  }
});

// Update notification settings
router.put('/settings', protect, async (req, res) => {
  try {
    const updates = req.body;
    
    // Find and update, or create if not exists
    let settings = await NotificationSettings.findOneAndUpdate(
      { userId: req.user.id },
      updates,
      { new: true, upsert: true }
    );
    
    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings'
    });
  }
});

// Reset to default settings
router.post('/settings/reset', protect, async (req, res) => {
  try {
    const defaultSettings = {
      emailNotifications: true,
      assignmentReminders: true,
      quizReminders: true,
      gradeAlerts: true,
      announcementAlerts: true,
      pushNotifications: false,
      smsNotifications: false,
      reminderTiming: '1hour',
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      quietHoursEnabled: false
    };
    
    const settings = await NotificationSettings.findOneAndUpdate(
      { userId: req.user.id },
      defaultSettings,
      { new: true, upsert: true }
    );
    
    res.json({
      success: true,
      message: 'Settings reset to default',
      settings
    });
  } catch (error) {
    console.error('Error resetting notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting notification settings'
    });
  }
});

module.exports = router;