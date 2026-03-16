const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

// ==================== TEACHER ROUTES ====================

// GET /api/subjects/teacher - Get subjects where teacher is the logged in teacher
router.get('/teacher', protect, authorize('teacher'), async (req, res) => {
  try {
    const subjects = await Subject.find({ teacher: req.user.id })
      .populate('department', 'name');
    
    res.json({ 
      success: true, 
      data: subjects 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== ADMIN ROUTES ====================

// POST /api/subjects - Create a new subject (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const subject = new Subject({
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      department: req.body.department,
      semester: req.body.semester,
      credits: req.body.credits,
      teacher: req.body.teacher,
      syllabus: req.body.syllabus,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    
    await subject.save();
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/subjects/:id - Update a subject (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    subject.name = req.body.name || subject.name;
    subject.code = req.body.code || subject.code;
    subject.description = req.body.description || subject.description;
    subject.credits = req.body.credits || subject.credits;
    subject.semester = req.body.semester || subject.semester;
    subject.department = req.body.department || subject.department;
    subject.teacher = req.body.teacher || subject.teacher;
    subject.isActive = req.body.isActive !== undefined ? req.body.isActive : subject.isActive;

    const updatedSubject = await subject.save();
    
    await updatedSubject.populate('department', 'name code');
    await updatedSubject.populate('teacher', 'name email');

    res.json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== STUDENT ROUTES ====================

// GET /api/subjects/student - Get subjects for student
router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    const subjects = await Subject.find({
      department: req.user.department,
      semester: req.user.semester,
      isActive: true
    }).populate('teacher', 'name email');

    res.json({ 
      success: true, 
      data: subjects 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ==================== PUBLIC ROUTES (MUST COME LAST) ====================

// GET /api/subjects - Get all subjects (public)
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .populate('department', 'name')
      .populate('teacher', 'name email');
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/subjects/:id - Get single subject by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('department', 'name')
      .populate('teacher', 'name email');
      
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;