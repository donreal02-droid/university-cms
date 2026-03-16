const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// Get all active sessions for the current user
router.get('/active-sessions', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ 
      userId: req.user.id 
    })
    .sort({ lastActive: -1 })
    .lean();

    // Mark current session
    const currentSessionId = req.headers['authorization'];
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.sessionId === currentSessionId
    }));

    res.json({
      success: true,
      sessions: sessionsWithCurrent
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching sessions' 
    });
  }
});

// Terminate a specific session
router.delete('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Don't allow terminating current session
    if (sessionId === req.headers['authorization']) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot terminate current session' 
      });
    }

    await Session.findOneAndDelete({
      userId: req.user.id,
      sessionId: sessionId
    });

    res.json({ 
      success: true, 
      message: 'Session terminated successfully' 
    });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error terminating session' 
    });
  }
});

// Terminate all other sessions
router.delete('/sessions/others', auth, async (req, res) => {
  try {
    const currentSessionId = req.headers['authorization'];
    
    await Session.deleteMany({
      userId: req.user.id,
      sessionId: { $ne: currentSessionId }
    });

    res.json({ 
      success: true, 
      message: 'All other sessions terminated' 
    });
  } catch (error) {
    console.error('Error terminating sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error terminating sessions' 
    });
  }
});

// Clean up expired sessions (optional - run via cron job)
router.post('/cleanup', auth, async (req, res) => {
  try {
    // Only allow admins to run cleanup
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await Session.deleteMany({
      lastActive: { $lt: thirtyDaysAgo }
    });

    res.json({ 
      success: true, 
      message: 'Expired sessions cleaned up' 
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error cleaning up sessions' 
    });
  }
});

module.exports = router;