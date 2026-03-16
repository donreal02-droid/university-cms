const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const path = require('path');
const fs = require('fs');
const {
  createAssignment,
  getAssignmentsBySubject,
  getStudentAssignments,
  getTeacherAssignments,
  submitAssignment,
  gradeAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Import models
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

const assignmentValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('subjectId').notEmpty().withMessage('Subject ID is required'),
  body('maxMarks').isInt({ min: 1 }).withMessage('Max marks must be at least 1'),
  body('deadline').isISO8601().withMessage('Valid deadline is required')
];

router.use(protect);

// Stats route
router.get('/stats', authorize('teacher'), getAssignmentStats);

// Student routes
router.get('/student', authorize('student'), getStudentAssignments);

// Teacher routes
router.get('/teacher', authorize('teacher'), getTeacherAssignments);

// Assignment CRUD
router.route('/')
  .post(authorize('teacher'), upload.single('assignment'), assignmentValidation, createAssignment);

router.route('/:id')
  .get(getAssignmentsBySubject)
  .put(authorize('teacher'), upload.single('assignment'), updateAssignment)
  .delete(authorize('teacher'), deleteAssignment);

// Assignment actions
router.get('/subject/:subjectId', getAssignmentsBySubject);
router.post('/:id/submit', authorize('student'), upload.single('submission'), submitAssignment);
router.put('/:id/grade/:submissionId', authorize('teacher'), gradeAssignment);

// @desc    Update a submission (edit)
// @route   PUT /api/assignments/submission/:id
// @access  Private (Student)
router.put('/submission/:id', protect, authorize('student'), upload.single('submission'), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if submission belongs to student
    if (submission.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if deadline passed
    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const now = new Date();
    const deadline = new Date(assignment.deadline);
    
    if (now > deadline) {
      return res.status(400).json({ message: 'Cannot edit after deadline' });
    }

    // Check if already graded
    if (submission.status === 'graded') {
      return res.status(400).json({ message: 'Cannot edit graded submission' });
    }

    // Update with new file
    if (req.file) {
      // Delete old file if exists
      if (submission.fileUrl) {
        // Extract filename from fileUrl
        const filename = submission.fileUrl.split('/').pop();
        const oldPath = path.join(__dirname, '..', 'uploads', 'submissions', filename);
        
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      
      // Determine file type from extension
      const fileExt = path.extname(req.file.originalname).toLowerCase().substring(1);
      const validTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png'];
      const fileType = validTypes.includes(fileExt) ? fileExt : 'other';
      
      submission.fileUrl = `/uploads/submissions/${req.file.filename}`;
      submission.fileType = fileType;
      submission.fileSize = req.file.size;
      submission.submittedAt = now;
      
      // Check if now late
      if (now > deadline) {
        submission.isLate = true;
        submission.status = 'late';
      } else {
        submission.isLate = false;
        submission.status = 'submitted';
      }
    }

    await submission.save();
    
    res.json({ 
      success: true, 
      message: 'Submission updated successfully',
      data: submission 
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a submission
// @route   DELETE /api/assignments/submission/:id
// @access  Private (Student)
router.delete('/submission/:id', protect, authorize('student'), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if submission belongs to student
    if (submission.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if deadline passed
    const assignment = await Assignment.findById(submission.assignment);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const now = new Date();
    const deadline = new Date(assignment.deadline);
    
    if (now > deadline) {
      return res.status(400).json({ message: 'Cannot delete after deadline' });
    }

    // Check if already graded
    if (submission.status === 'graded') {
      return res.status(400).json({ message: 'Cannot delete graded submission' });
    }

    // Delete file from filesystem
    if (submission.fileUrl) {
      const filename = submission.fileUrl.split('/').pop();
      const filePath = path.join(__dirname, '..', 'uploads', 'submissions', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await submission.deleteOne();

    res.json({ 
      success: true, 
      message: 'Submission deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;