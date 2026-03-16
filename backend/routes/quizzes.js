const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

// ==================== TEACHER ROUTES (without :id) ====================

// POST /api/quizzes - Create a new quiz (PROTECTED)
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const subjectExists = await Subject.findById(req.body.subject);
    if (!subjectExists) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Convert subject string to ObjectId
    const subjectId = new mongoose.Types.ObjectId(req.body.subject);

    const quizData = {
      title: req.body.title,
      description: req.body.description || '',
      subjectId: subjectId,
      duration: parseInt(req.body.duration),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdBy: req.user.id,
      questions: req.body.questions.map((q, index) => {
        const baseQuestion = {
          questionNumber: index + 1,
          questionText: q.questionText,
          type: q.type,
          marks: parseInt(q.marks)
        };
        
        if (q.type === 'multiple') {
          return {
            ...baseQuestion,
            options: q.options,
            correctAnswer: q.correctAnswer
          };
        }
        return baseQuestion;
      })
    };
    
    const quiz = new Quiz(quizData);
    await quiz.save();
    
    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/quizzes/teacher - Get teacher's quizzes (PROTECTED)
router.get('/teacher', protect, authorize('teacher'), async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id })
      .populate('subjectId', 'name code')
      .sort('-createdAt');
      
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Error fetching teacher quizzes:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/quizzes/teacher/subjects - Get teacher's subjects (PROTECTED)
router.get('/teacher/subjects', protect, authorize('teacher'), async (req, res) => {
  try {
    const subjects = await Subject.find({ createdBy: req.user.id });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== STUDENT ROUTES ====================

// GET /api/quizzes/student - Get available quizzes for student
router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      isActive: true
    }).populate('subjectId', 'name code');

    res.json({ 
      success: true, 
      data: quizzes 
    });
  } catch (error) {
    console.error('Error fetching student quizzes:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// GET /api/quizzes/student/:quizId - Get specific quiz for attempting
router.get('/student/:quizId', protect, authorize('student'), async (req, res) => {
  try {
    console.log('🔥🔥🔥 STUDENT QUIZ FETCH ROUTE HIT');
    console.log('Quiz ID requested:', req.params.quizId);
    console.log('Current time:', new Date());
    
    const now = new Date();
    console.log('Finding quiz with conditions:', {
      _id: req.params.quizId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    const quiz = await Quiz.findOne({
      _id: req.params.quizId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('subjectId', 'name code');

    console.log('Quiz found:', quiz ? 'Yes' : 'No');
    
    if (!quiz) {
      // Let's check if the quiz exists at all
      const anyQuiz = await Quiz.findById(req.params.quizId);
      console.log('Quiz exists but conditions failed:', anyQuiz ? {
        isActive: anyQuiz.isActive,
        startDate: anyQuiz.startDate,
        endDate: anyQuiz.endDate,
        now: now
      } : 'No quiz found at all');
      
      return res.status(404).json({ message: 'Quiz not found or not available' });
    }

    // Check if already submitted
    const QuizSubmission = require('../models/QuizSubmission');
    const existingSubmission = await QuizSubmission.findOne({
      quiz: quiz._id,
      student: req.user.id
    });

    console.log('Existing submission:', existingSubmission ? 'Yes' : 'No');

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this quiz' });
    }

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/quizzes/submit - Submit quiz answers
router.post('/submit', protect, authorize('student'), async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if already submitted
    const QuizSubmission = require('../models/QuizSubmission');
    const existingSubmission = await QuizSubmission.findOne({
      quiz: quizId,
      student: req.user.id
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this quiz' });
    }

    // Prepare answers
    const answerDetails = quiz.questions.map((q, index) => ({
      questionId: q._id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      studentAnswer: answers[index] || '',
      maxMarks: q.marks,
      marksObtained: 0,
      isGraded: false
    }));

    const submission = new QuizSubmission({
      quiz: quizId,
      student: req.user.id,
      subject: quiz.subjectId,
      answers: answerDetails,
      totalMarks: quiz.questions.reduce((sum, q) => sum + q.marks, 0),
      submittedAt: new Date()
    });

    await submission.save();

    res.status(201).json({ 
      success: true, 
      data: submission,
      message: 'Quiz submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(400).json({ message: error.message });
  }
});

// GET /api/quizzes/student/submissions - Get student's quiz submissions
router.get('/student/submissions', protect, authorize('student'), async (req, res) => {
  try {
    const QuizSubmission = require('../models/QuizSubmission');
    const submissions = await QuizSubmission.find({ student: req.user.id })
      .populate('quiz', 'title duration')
      .populate('subject', 'name code')
      .sort('-submittedAt');

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEACHER ROUTES WITH :id (MUST COME LAST) ====================

// GET /api/quizzes/:id - Get single quiz for teacher (PROTECTED)
router.get('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('subjectId', 'name code');
      
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== DELETE ROUTE ====================

// DELETE /api/quizzes/:id - Delete a quiz (PROTECTED)
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user owns this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this quiz' });
    }

    // Check if there are any submissions for this quiz
    const QuizSubmission = require('../models/QuizSubmission');
    const submissions = await QuizSubmission.findOne({ quiz: quiz._id });
    
    if (submissions) {
      return res.status(400).json({ 
        message: 'Cannot delete quiz with existing submissions. Please delete submissions first.' 
      });
    }

    await quiz.deleteOne();
    
    res.json({ 
      success: true, 
      message: 'Quiz deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;