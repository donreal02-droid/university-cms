const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ==================== ADMIN ROUTES (Existing) ====================

// @desc    Get all schedules (admin)
// @route   GET /api/schedule/admin
// @access  Private/Admin
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate('subject', 'name code credits')
      .populate('teacher', 'name email')
      .populate('department', 'name')
      .sort({ day: 1, startTime: 1 });
    
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create schedule
// @route   POST /api/schedule
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { subject, teacher, day, startTime, endTime, room, semester, department, academicYear } = req.body;

    // Check teacher availability for this specific day and time
    const teacherConflict = await Schedule.findOne({
      teacher,
      day,
      academicYear,
      $or: [
        { 
          startTime: { $lt: endTime }, 
          endTime: { $gt: startTime } 
        }
      ]
    });

    if (teacherConflict) {
      return res.status(400).json({ 
        message: `Teacher already has a class on ${day} at this time` 
      });
    }

    // Check room availability for this specific day
    const roomConflict = await Schedule.findOne({
      room,
      day,
      academicYear,
      $or: [
        { 
          startTime: { $lt: endTime }, 
          endTime: { $gt: startTime } 
        }
      ]
    });

    if (roomConflict) {
      return res.status(400).json({ 
        message: `Room already booked on ${day} at this time` 
      });
    }

    // Check credit hours requirement
    const Subject = require('../models/Subject');
    const subjectData = await Subject.findById(subject);
    
    const existingClasses = await Schedule.countDocuments({
      subject,
      academicYear
    });

    if (existingClasses >= subjectData.credits) {
      return res.status(400).json({ 
        message: `This subject requires ${subjectData.credits} classes per week. Already scheduled ${existingClasses}.` 
      });
    }

    const schedule = await Schedule.create({
      subject,
      teacher,
      day,
      startTime,
      endTime,
      room,
      semester,
      department,
      academicYear,
      createdBy: req.user.id
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('subject', 'name code credits')
      .populate('teacher', 'name email')
      .populate('department', 'name');

    res.status(201).json(populatedSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update schedule
// @route   PUT /api/schedule/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const { teacher, day, startTime, endTime, room, academicYear } = req.body;

    // Check teacher availability for this specific day (excluding current schedule)
    const teacherConflict = await Schedule.findOne({
      teacher: teacher || schedule.teacher,
      day: day || schedule.day,
      academicYear: academicYear || schedule.academicYear,
      _id: { $ne: schedule._id },
      $or: [
        { 
          startTime: { $lt: endTime || schedule.endTime }, 
          endTime: { $gt: startTime || schedule.startTime } 
        }
      ]
    });

    if (teacherConflict) {
      return res.status(400).json({ 
        message: `Teacher already has a class on ${day || schedule.day} at this time` 
      });
    }

    // Check room availability for this specific day (excluding current schedule)
    const roomConflict = await Schedule.findOne({
      room: room || schedule.room,
      day: day || schedule.day,
      academicYear: academicYear || schedule.academicYear,
      _id: { $ne: schedule._id },
      $or: [
        { 
          startTime: { $lt: endTime || schedule.endTime }, 
          endTime: { $gt: startTime || schedule.startTime } 
        }
      ]
    });

    if (roomConflict) {
      return res.status(400).json({ 
        message: `Room already booked on ${day || schedule.day} at this time` 
      });
    }

    Object.assign(schedule, req.body);
    await schedule.save();

    const updatedSchedule = await Schedule.findById(schedule._id)
      .populate('subject', 'name code credits')
      .populate('teacher', 'name email')
      .populate('department', 'name');

    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete schedule
// @route   DELETE /api/schedule/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    await schedule.deleteOne();
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Check teacher availability
// @route   GET /api/schedule/teacher/:teacherId/availability
// @access  Private/Admin
router.get('/teacher/:teacherId/availability', protect, authorize('admin'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { day, startTime, endTime, academicYear, excludeId } = req.query;

    const query = {
      teacher: teacherId,
      day,
      academicYear,
      $or: [
        { 
          startTime: { $lt: endTime }, 
          endTime: { $gt: startTime } 
        }
      ]
    };

    if (excludeId && excludeId !== 'undefined') {
      query._id = { $ne: excludeId };
    }

    const conflict = await Schedule.findOne(query);
    res.json({ available: !conflict });
  } catch (error) {
    console.error('Error checking teacher availability:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Check room availability
// @route   GET /api/schedule/room/availability
// @access  Private/Admin
router.get('/room/availability', protect, authorize('admin'), async (req, res) => {
  try {
    const { room, day, startTime, endTime, academicYear, excludeId } = req.query;

    const query = {
      room,
      day,
      academicYear,
      $or: [
        { 
          startTime: { $lt: endTime }, 
          endTime: { $gt: startTime } 
        }
      ]
    };

    if (excludeId && excludeId !== 'undefined') {
      query._id = { $ne: excludeId };
    }

    const conflict = await Schedule.findOne(query);
    res.json({ available: !conflict });
  } catch (error) {
    console.error('Error checking room availability:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== STUDENT ROUTES (Existing) ====================

// @desc    Get student schedule
// @route   GET /api/schedule/student
// @access  Private/Student
router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate('department');
    
    if (!student.department) {
      return res.json([]);
    }

    const schedule = await Schedule.find({
      department: student.department._id,
      semester: student.semester
    })
    .populate('subject', 'name code credits')
    .populate('teacher', 'name')
    .populate('department', 'name')
    .sort({ day: 1, startTime: 1 });

    res.json(schedule);
  } catch (error) {
    console.error('Error fetching student schedule:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEACHER ROUTES (NEW - ADD THESE) ====================

// @desc    Get teacher's own schedule (all classes)
// @route   GET /api/schedule/teacher/my-schedule
// @access  Private/Teacher
router.get('/teacher/my-schedule', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    
    const schedules = await Schedule.find({ teacher: teacherId })
      .populate('subject', 'name code credits')
      .populate('department', 'name')
      .sort({ day: 1, startTime: 1 });
    
    res.json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get teacher's today's schedule
// @route   GET /api/schedule/teacher/today
// @access  Private/Teacher
router.get('/teacher/today', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    
    const schedules = await Schedule.find({
      teacher: teacherId,
      day: today
    })
    .populate('subject', 'name code credits')
    .populate('department', 'name')
    .sort({ startTime: 1 });
    
    res.json({
      success: true,
      date: new Date().toDateString(),
      day: today,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching today\'s schedule:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get teacher's weekly schedule (grouped by day)
// @route   GET /api/schedule/teacher/weekly
// @access  Private/Teacher
router.get('/teacher/weekly', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    
    const schedules = await Schedule.find({ teacher: teacherId })
      .populate('subject', 'name code credits')
      .populate('department', 'name')
      .sort({ day: 1, startTime: 1 });
    
    // Group by day for easier display
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const groupedSchedule = days.map(day => ({
      day,
      classes: schedules.filter(s => s.day === day)
    }));
    
    res.json({
      success: true,
      data: groupedSchedule
    });
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get teacher's schedule for specific day
// @route   GET /api/schedule/teacher/day/:day
// @access  Private/Teacher
router.get('/teacher/day/:day', protect, authorize('teacher'), async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { day } = req.params;
    
    // Validate day
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ message: 'Invalid day. Use Monday-Saturday' });
    }
    
    const schedules = await Schedule.find({
      teacher: teacherId,
      day: day
    })
    .populate('subject', 'name code credits')
    .populate('department', 'name')
    .sort({ startTime: 1 });
    
    res.json({
      success: true,
      day,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching day schedule:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;