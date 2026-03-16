const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  device: {
    type: String,
    default: 'Unknown Device'
  },
  browser: {
    type: String,
    default: 'Unknown Browser'
  },
  os: {
    type: String,
    default: 'Unknown OS'
  },
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  location: {
    type: String,
    default: 'Unknown'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // Auto-delete after 30 days
  }
});

// Index for faster queries
sessionSchema.index({ userId: 1, lastActive: -1 });

module.exports = mongoose.model('Session', sessionSchema);