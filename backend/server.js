const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/university_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const subjectRoutes = require('./routes/subjects');
const noteRoutes = require('./routes/notes');
const assignmentRoutes = require('./routes/assignments');
const quizRoutes = require('./routes/quizzes');
const submissionRoutes = require('./routes/submissions');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const scheduleRoutes = require('./routes/schedule');
const notificationRoutes = require('./routes/notifications');
const universityRoutes = require('./routes/university');
const twoFactorRoutes = require('./routes/twoFactorRoutes');
const quizSubmissionRoutes = require('./routes/quizSubmissions');
const teacherStudentRoutes = require('./routes/teacherStudents');
const notificationSettingsRoutes = require('./routes/notificationSettings');
const statsRoutes = require('./routes/statsRoutes');

// Import middleware
const { protect } = require('./middleware/auth');
const sessionTracker = require('./middleware/sessionTracker');

// ============ PUBLIC ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/stats', statsRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Debug routes (only in development)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            routes.push({
              path: handler.route.path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });
    res.json({ 
      success: true,
      total: routes.length,
      routes 
    });
  });
}

// ============ SESSION TRACKING ============
app.use('/api', sessionTracker);

// ============ PROTECTED ROUTES ============
app.use('/api/users', protect, userRoutes);
app.use('/api/university', protect, universityRoutes);

app.use('/api/subjects', protect, subjectRoutes);
app.use('/api/notes', protect, noteRoutes);
app.use('/api/assignments', protect, assignmentRoutes);
app.use('/api/quizzes', protect, quizRoutes);
app.use('/api/submissions', protect, submissionRoutes);
app.use('/api/reports', protect, reportRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/teacher', protect, teacherRoutes);
app.use('/api/student', protect, studentRoutes);
app.use('/api/schedule', protect, scheduleRoutes);
app.use('/api/2fa', protect, twoFactorRoutes);
app.use('/api/quiz-submissions', protect, quizSubmissionRoutes);
app.use('/api/teacher/students', protect, teacherStudentRoutes);

// ============ NOTIFICATION ROUTES ============
// Regular notifications - /api/notifications/*
app.use('/api/notifications', protect, notificationRoutes);

// Notification settings - /api/notification-settings/* (different path)
app.use('/api/notification-settings', protect, notificationSettingsRoutes);

// Protected test route
app.get('/api/protected-test', protect, (req, res) => {
  res.json({ 
    success: true,
    message: 'You are authenticated!',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// ============ ERROR HANDLING ============
// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log(`✅ SERVER STARTED SUCCESSFULLY`);
  console.log(`=================================`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 MongoDB: Connected`);
  console.log(`=================================\n`);
});