const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const QuizSubmission = require('../models/QuizSubmission');
const Quiz = require('../models/Quiz');
const fs = require('fs');
const path = require('path');

console.log('✅ QUIZ SUBMISSIONS ROUTES LOADED');

// @desc    Get all quiz submissions for a teacher
// @route   GET /api/quiz-submissions/teacher
// @access  Private/Teacher
router.get('/teacher', protect, authorize('teacher'), async (req, res) => {
  try {
    // First get all quizzes created by this teacher
    const quizzes = await Quiz.find({ createdBy: req.user.id }).select('_id');
    const quizIds = quizzes.map(q => q._id);

    const submissions = await QuizSubmission.find({ 
      quiz: { $in: quizIds } 
    })
    .populate('student', 'name email enrollmentNumber')
    .populate({
      path: 'quiz',
      populate: {
        path: 'subjectId',
        select: 'name code credits'
      }
    })
    .sort('-submittedAt');

    res.json({ 
      success: true, 
      data: submissions 
    });
  } catch (error) {
    console.error('Error fetching teacher quiz submissions:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get submissions by quiz
// @route   GET /api/quiz-submissions/quiz/:quizId
// @access  Private/Teacher
router.get('/quiz/:quizId', protect, authorize('teacher'), async (req, res) => {
  try {
    const submissions = await QuizSubmission.find({ 
      quiz: req.params.quizId 
    })
    .populate('student', 'name email')
    .sort('-submittedAt');

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get student's quiz submissions - FIXED
// @route   GET /api/quiz-submissions/student
// @access  Private/Student
router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    const submissions = await QuizSubmission.find({ student: req.user._id })
      .populate({
        path: 'quiz',
        populate: { 
          path: 'subjectId',  // ✅ Changed from subjectId to subject
          select: 'name code' 
        }
      })
      .sort('-submittedAt');

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get quiz submission by ID - FIXED
// @route   GET /api/quiz-submissions/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const submission = await QuizSubmission.findById(req.params.id)
      .populate('student', 'name email')
      .populate({
        path: 'quiz',
        populate: { 
          path: 'subjectId',  // ✅ Changed from subjectId to subject
          select: 'name code' 
        }
      });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'teacher') {
      const quiz = await Quiz.findById(submission.quiz._id);
      if (quiz.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    res.json({ success: true, data: submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Download quiz submission file
// @route   GET /api/quiz-submissions/:id/download
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
  try {
    const submission = await QuizSubmission.findById(req.params.id)
      .populate({
        path: 'quiz',
        select: 'createdBy'
      });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check authorization
    if (req.user.role === 'student' && submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'teacher') {
      const quiz = await Quiz.findById(submission.quiz._id);
      if (quiz.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    if (!submission.fileUrl || !fs.existsSync(submission.fileUrl)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(path.resolve(submission.fileUrl));
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Grade quiz submission
// @route   PUT /api/quiz-submissions/:id/grade
// @access  Private/Teacher
router.put('/:id/grade', protect, authorize('teacher'), async (req, res) => {
  try {
    const { answers, feedback } = req.body;
    
    const submission = await QuizSubmission.findById(req.params.id)
      .populate('quiz');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const quiz = await Quiz.findById(submission.quiz._id);
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to grade this submission' });
    }

    if (answers && answers.length > 0) {
      answers.forEach(answer => {
        const answerIndex = submission.answers.findIndex(
          a => a.questionId.toString() === answer.questionId
        );
        if (answerIndex !== -1) {
          submission.answers[answerIndex].marksObtained = answer.marksObtained;
          submission.answers[answerIndex].isGraded = true;
        }
      });
    }

    submission.totalMarksObtained = submission.answers.reduce(
      (sum, a) => sum + (a.marksObtained || 0), 0
    );
    
    submission.isFullyGraded = submission.answers.every(a => a.isGraded);
    submission.feedback = feedback;
    submission.gradedAt = new Date();

    await submission.save();

    res.json({ 
      success: true,
      message: 'Quiz graded successfully',
      data: submission 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete quiz submission
// @route   DELETE /api/quiz-submissions/:id
// @access  Private/Teacher
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const submission = await QuizSubmission.findById(req.params.id)
      .populate({
        path: 'quiz',
        select: 'createdBy'
      });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const quiz = await Quiz.findById(submission.quiz._id);
    if (quiz.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this submission' });
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