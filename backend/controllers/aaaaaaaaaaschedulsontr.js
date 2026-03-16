const Schedule = require('../models/Schedule');
const Subject = require('../models/Subject');
const User = require('../models/User');

// @desc    Create schedule (Admin only)
// @route   POST /api/schedule
// @access  Private/Admin
const createSchedule = async (req, res) => {
  try {
    const { subject, teacher, day, startTime, endTime, room, semester, department, academicYear } = req.body;

    console.log('Creating schedule with data:', { subject, teacher, day, startTime, endTime, room, semester, department, academicYear });

    // Validate subject
    const subjectData = await Subject.findById(subject).populate('department');
    if (!subjectData) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Validate teacher
    const teacherData = await User.findById(teacher);
    if (!teacherData || teacherData.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check credit hours requirement
    const existingClasses = await Schedule.countDocuments({
      subject: subject,
      academicYear
    });

    if (existingClasses >= subjectData.credits) {
      return res.status(400).json({ 
        message: `This subject requires ${subjectData.credits} classes per week. Already scheduled ${existingClasses} classes.` 
      });
    }

    // Check teacher availability - FIXED: Only check same day
    const teacherConflict = await Schedule.findOne({
      teacher: teacher,
      day: day, // ← Only check same day
      academicYear,
      $or: [
        // Check if time ranges overlap
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

    // Check room availability - FIXED: Only check same day
    const roomConflict = await Schedule.findOne({
      room,
      day: day, // ← Only check same day
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

    // Create schedule - use department from subject
    const schedule = await Schedule.create({
      subject: subject,
      teacher: teacher,
      department: subjectData.department._id,
      semester: semester || subjectData.semester,
      day,
      startTime,
      endTime,
      room,
      createdBy: req.user.id,
      academicYear
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
};

// @desc    Update schedule (Admin only)
// @route   PUT /api/schedule/:id
// @access  Private/Admin
const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const { teacher, day, startTime, endTime, room, academicYear } = req.body;

    // Check teacher availability if changing - FIXED
    if (teacher && teacher !== schedule.teacher.toString() || day || startTime || endTime) {
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
    }

    // Check room availability if changing - FIXED
    if (room || day || startTime || endTime) {
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
};

// @desc    Get schedule by department and semester
// @route   GET /api/schedule/department/:deptId/semester/:semester
// @access  Private
const getScheduleByDepartment = async (req, res) => {
  try {
    const schedule = await Schedule.find({
      department: req.params.deptId,
      semester: req.params.semester
    })
    .populate('subject', 'name code credits')
    .populate('teacher', 'name')
    .sort({ day: 1, startTime: 1 });

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student schedule
// @route   GET /api/schedule/student
// @access  Private/Student
const getStudentSchedule = async (req, res) => {
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
    .sort({ day: 1, startTime: 1 });

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get teacher schedule
// @route   GET /api/schedule/teacher
// @access  Private/Teacher
const getTeacherSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.find({
      teacher: req.user._id
    })
    .populate('subject', 'name code credits')
    .populate('department', 'name')
    .sort({ day: 1, startTime: 1 });

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete schedule (Admin only)
// @route   DELETE /api/schedule/:id
// @access  Private/Admin
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    await schedule.deleteOne();
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check teacher availability
// @route   GET /api/schedule/teacher/:teacherId/availability
// @access  Private/Admin
const checkTeacherAvailability = async (req, res) => {
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSchedule,
  getScheduleByDepartment,
  getStudentSchedule,
  getTeacherSchedule,
  updateSchedule,
  deleteSchedule,
  checkTeacherAvailability
};