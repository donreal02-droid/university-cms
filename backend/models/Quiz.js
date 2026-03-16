const mongoose = require('mongoose');

console.log('✅ LOADING QUIZ MODEL WITH FIXED SCHEMA');

const questionSchema = new mongoose.Schema({
  questionNumber: {
    type: Number,
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple', 'text'],
    required: true
  },
  marks: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  options: {
    type: [String],
    validate: {
      validator: function(v) {
        if (this.type === 'multiple') {
          return v && v.length >= 2;
        }
        return true;
      },
      message: 'Multiple choice questions must have at least 2 options'
    }
  },
  correctAnswer: {
    type: Number,
    required: function() {
      console.log(`🔍 VALIDATING: Question type = ${this.type}, required = ${this.type === 'multiple'}`);
      return this.type === 'multiple';
    },
    validate: {
      validator: function(v) {
        if (this.type === 'multiple') {
          return v !== undefined && v !== null && v >= 0;
        }
        return true;
      },
      message: 'Correct answer is required for multiple choice questions'
    }
  }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  duration: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

console.log('✅ QUIZ MODEL LOADED SUCCESSFULLY');

module.exports = mongoose.model('Quiz', quizSchema);