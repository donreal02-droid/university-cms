const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionNumber: Number,
  questionText: String,
  studentAnswer: {
    type: String,
    required: true
  },
  marksObtained: {
    type: Number,
    default: 0
  },
  maxMarks: Number,
  isGraded: {
    type: Boolean,
    default: false
  }
});

const quizSubmissionSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  answers: [answerSchema],
  totalMarksObtained: {
    type: Number,
    default: 0
  },
  totalMarks: Number,
  isFullyGraded: {
    type: Boolean,
    default: false
  },
  feedback: String,
  fileUrl: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: Date
}, {
  timestamps: true
});

quizSubmissionSchema.index({ quiz: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('QuizSubmission', quizSubmissionSchema);