const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');
const useragent = require('useragent');
const requestIp = require('request-ip');

const sessionTracker = async (req, res, next) => {
  // Only track authenticated requests
  if (req.user && req.user.id) {
    try {
      const agent = useragent.parse(req.headers['user-agent']);
      const sessionId = req.headers['authorization'] || uuidv4();
      
      // Get IP and location (you might want to use a geolocation service)
      const ip = requestIp.getClientIp(req);
      
      // Check if session exists
      let session = await Session.findOne({ 
        userId: req.user.id,
        sessionId: sessionId
      });

      if (session) {
        // Update last active
        session.lastActive = new Date();
        await session.save();
      } else {
        // Create new session
        session = new Session({
          userId: req.user.id,
          sessionId: sessionId,
          device: agent.device.toString(),
          browser: agent.family,
          os: agent.os.toString(),
          ipAddress: ip,
          location: 'Unknown', // You can implement IP geolocation
          lastActive: new Date()
        });
        await session.save();
      }
      
      // Attach session to request for later use
      req.session = session;
    } catch (error) {
      console.error('Session tracking error:', error);
    }
  }
  next();
};

module.exports = sessionTracker;