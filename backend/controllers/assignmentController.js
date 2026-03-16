const Assignment = require('../models/Assignment');
const Subject = require('../models/Subject');
const Submission = require('../models/Submission');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Create assignment
// @route   POST /api/assignments
// @access  Private/Teacher
const createAssignment = async (req, res) => {
  try {
    const { title, description, subjectId, maxMarks, deadline } = req.body;

    // Verify subject and teacher
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if teacher is authorized for this subject
    if (subject.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to create assignments for this subject' });
    }

    const assignmentData = {
      title,
      description,
      subject: subjectId,
      teacher: req.user._id,
      maxMarks,
      deadline
    };

    // If file was uploaded
    if (req.file) {
      assignmentData.fileUrl = req.file.path;
    }

    const assignment = await Assignment.create(assignmentData);

    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get assignments by subject
// @route   GET /api/assignments/subject/:subjectId
// @access  Private
const getAssignmentsBySubject = async (req, res) => {
  try {
    const assignments = await Assignment.find({ 
      subject: req.params.subjectId,
      isActive: true 
    })
    .populate('teacher', 'name')
    .populate('submissions')
    .sort('-createdAt');

    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student's assignments
// @route   GET /api/assignments/student
// @access  Private/Student
const getStudentAssignments = async (req, res) => {
  try {
    // Get subjects based on student's department and semester
    const subjects = await Subject.find({ 
      department: req.user.department,
      semester: req.user.semester 
    });

    const subjectIds = subjects.map(s => s._id);

    const assignments = await Assignment.find({ 
      subject: { $in: subjectIds },
      isActive: true 
    })
    .populate('subject', 'name code')
    .populate('teacher', 'name')
    .sort('deadline')
    .lean();

    // Get submissions for these assignments
    for (let assignment of assignments) {
      const submission = await Submission.findOne({
        assignment: assignment._id,
        student: req.user._id
      });
      
      assignment.submission = submission || null;
      assignment.status = submission ? submission.status : 'pending';
      
      // Check if deadline has passed
      if (new Date() > new Date(assignment.deadline) && !submission) {
        assignment.status = 'missed';
      }
    }

    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get teacher's assignments
// @route   GET /api/assignments/teacher
// @access  Private/Teacher
const getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ 
      teacher: req.user._id,
      isActive: true 
    })
    .populate('subject', 'name code semester')
    .populate({
      path: 'submissions',
      populate: { path: 'student', select: 'name enrollmentNumber' }
    })
    .sort('-createdAt');

    // Add submission counts
    const assignmentsWithStats = assignments.map(assignment => {
      const assignmentObj = assignment.toObject();
      assignmentObj.totalSubmissions = assignment.submissions.length;
      assignmentObj.gradedSubmissions = assignment.submissions.filter(s => s.status === 'graded').length;
      assignmentObj.pendingSubmissions = assignment.submissions.filter(s => s.status === 'submitted' || s.status === 'late').length;
      return assignmentObj;
    });

    res.json(assignmentsWithStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
const submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if deadline has passed
    const isLate = new Date() > new Date(assignment.deadline);
    
    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload your assignment file' });
    }

    // Create submission
    const submission = await Submission.create({
      assignment: assignment._id,
      student: req.user._id,
      fileUrl: req.file.path,
      fileType: req.file.mimetype.split('/')[1],
      fileSize: req.file.size,
      isLate: isLate,
      status: isLate ? 'late' : 'submitted'
    });

    // Add submission reference to assignment
    assignment.submissions.push(submission._id);
    await assignment.save();

    res.status(201).json({ 
      message: isLate ? 'Assignment submitted late' : 'Assignment submitted successfully',
      submission 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Grade assignment submission
// @route   PUT /api/assignments/:id/grade/:submissionId
// @access  Private/Teacher
const gradeAssignment = async (req, res) => {
  try {
    const { marks, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check authorization
    if (assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to grade this assignment' });
    }

    const submission = await Submission.findById(req.params.submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Validate marks
    if (marks > assignment.maxMarks) {
      return res.status(400).json({ 
        message: `Marks cannot exceed ${assignment.maxMarks}` 
      });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;
    submission.status = 'graded';

    await submission.save();

    res.json({ 
      message: 'Assignment graded successfully',
      submission 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update assignment (FIXED VERSION)
// @route   PUT /api/assignments/:id
// @access  Private/Teacher
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check authorization
    if (assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this assignment' });
    }

    const { title, description, subjectId, maxMarks, deadline, isActive } = req.body;

    // Update subject if provided and different
    if (subjectId && subjectId !== assignment.subject.toString()) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ message: 'Subject not found' });
      }
      // Check if teacher is authorized for this subject
      if (subject.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to change to this subject' });
      }
      assignment.subject = subjectId;
    }

    // Update other fields
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (maxMarks) assignment.maxMarks = parseInt(maxMarks);
    if (deadline) assignment.deadline = deadline;
    
    // Handle isActive
    if (isActive !== undefined) {
      assignment.isActive = isActive === 'true' || isActive === true;
    }

    // Handle file upload if new file is provided
    if (req.file) {
      // Delete old file if exists
      if (assignment.fileUrl && fs.existsSync(assignment.fileUrl)) {
        try {
          fs.unlinkSync(assignment.fileUrl);
        } catch (fileErr) {
          console.error('Error deleting old file:', fileErr);
        }
      }
      assignment.fileUrl = req.file.path;
    }

    await assignment.save();
    
    // Return populated assignment
    const updatedAssignment = await Assignment.findById(assignment._id)
      .populate('subject', 'name code semester')
      .populate('teacher', 'name email');
    
    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Teacher
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check authorization
    if (assignment.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }

    // Delete all submissions for this assignment
    const submissions = await Submission.find({ assignment: assignment._id });
    
    // Delete submission files
    submissions.forEach(submission => {
      if (submission.fileUrl && fs.existsSync(submission.fileUrl)) {
        try {
          fs.unlinkSync(submission.fileUrl);
        } catch (fileErr) {
          console.error('Error deleting submission file:', fileErr);
        }
      }
    });

    // Delete submissions from database
    await Submission.deleteMany({ assignment: assignment._id });

    // Delete assignment file if exists
    if (assignment.fileUrl && fs.existsSync(assignment.fileUrl)) {
      try {
        fs.unlinkSync(assignment.fileUrl);
      } catch (fileErr) {
        console.error('Error deleting assignment file:', fileErr);
      }
    }

    await assignment.deleteOne();
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get assignment statistics
// @route   GET /api/assignments/stats
// @access  Private/Teacher
const getAssignmentStats = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.user._id });
    
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter(a => new Date(a.deadline) > new Date()).length;
    const totalSubmissions = await Submission.countDocuments({
      assignment: { $in: assignments.map(a => a._id) }
    });
    const gradedSubmissions = await Submission.countDocuments({
      assignment: { $in: assignments.map(a => a._id) },
      status: 'graded'
    });

    res.json({
      totalAssignments,
      activeAssignments,
      totalSubmissions,
      gradedSubmissions,
      pendingSubmissions: totalSubmissions - gradedSubmissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// @desc    Update submission (edit)
// @route   PUT /api/assignments/submission/:id
// @access  Private/Student
const updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if submission belongs to student
    if (submission.student.toString() !== req.user._id.toString()) {
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
        const oldPath = submission.fileUrl;
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
            console.log('Old file deleted:', oldPath);
          } catch (err) {
            console.error('Error deleting old file:', err);
          }
        }
      }
      
      // Determine file type
      const fileExt = req.file.originalname.split('.').pop().toLowerCase();
      const validTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png'];
      const fileType = validTypes.includes(fileExt) ? fileExt : 'other';
      
      // Update submission
      submission.fileUrl = req.file.path;
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
    
    // Get updated submission with populated data
    const updatedSubmission = await Submission.findById(submission._id)
      .populate('assignment', 'title deadline maxMarks');
    
    res.json({ 
      success: true, 
      message: 'Submission updated successfully',
      data: updatedSubmission 
    });

  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete submission
// @route   DELETE /api/assignments/submission/:id
// @access  Private/Student
const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if submission belongs to student
    if (submission.student.toString() !== req.user._id.toString()) {
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
    if (submission.fileUrl && fs.existsSync(submission.fileUrl)) {
      try {
        fs.unlinkSync(submission.fileUrl);
        console.log('File deleted:', submission.fileUrl);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    // Remove submission reference from assignment
    await Assignment.findByIdAndUpdate(submission.assignment, {
      $pull: { submissions: submission._id }
    });

    await submission.deleteOne();

    res.json({ 
      success: true, 
      message: 'Submission deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createAssignment,
  getAssignmentsBySubject,
  getStudentAssignments,
  getTeacherAssignments,
  submitAssignment,
  gradeAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentStats,
  updateSubmission,  // Add this
  deleteSubmission
};