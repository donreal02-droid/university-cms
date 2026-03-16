const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Subject = require('../models/Subject');

// @desc    Get all students for teacher's subjects
// @route   GET /api/teacher/students
// @access  Private/Teacher
router.get('/', protect, authorize('teacher'), async (req, res) => {
  try {
    // Get all subjects taught by this teacher
    const subjects = await Subject.find({ teacher: req.user._id })
      .populate('department');
    
    // Get unique department and semester combinations
    const departmentSemesters = new Set();
    subjects.forEach(subject => {
      if (subject.department && subject.semester) {
        departmentSemesters.add(`${subject.department._id}-${subject.semester}`);
      }
    });

    // Find students in these departments and semesters
    const students = [];
    for (const deptSem of departmentSemesters) {
      const [department, semester] = deptSem.split('-');
      const deptStudents = await User.find({
        role: 'student',
        department: department,
        semester: parseInt(semester),
        isActive: true
      }).select('name email enrollmentNumber department semester');
      
      students.push(...deptStudents);
    }

    // Remove duplicates (in case a student is in multiple departments/semesters)
    const uniqueStudents = Array.from(
      new Map(students.map(s => [s._id.toString(), s])).values()
    );

    res.json({
      success: true,
      data: uniqueStudents
    });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get student details by ID
// @route   GET /api/teacher/students/:id
// @access  Private/Teacher
router.get('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('-password')
      .populate('department');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student's submissions
    const Submission = require('../models/Submission');
    const QuizSubmission = require('../models/QuizSubmission');

    const [assignmentSubmissions, quizSubmissions] = await Promise.all([
      Submission.find({ student: student._id })
        .populate({
          path: 'assignment',
          populate: { path: 'subject' }
        })
        .sort('-submittedAt'),
      QuizSubmission.find({ student: student._id })
        .populate({
          path: 'quiz',
          populate: { path: 'subjectId' }
        })
        .sort('-submittedAt')
    ]);

    res.json({
      success: true,
      data: {
        student,
        assignmentSubmissions,
        quizSubmissions
      }
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;