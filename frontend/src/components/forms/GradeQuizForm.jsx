import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const GradeQuizForm = ({ submission, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [totalMarks, setTotalMarks] = useState(0);
  const [obtainedMarks, setObtainedMarks] = useState(0);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      feedback: submission.feedback || ''
    }
  });

  useEffect(() => {
    if (submission.answers) {
      // Initialize answers with current marks
      const initialAnswers = submission.answers.map(answer => ({
        ...answer,
        marksObtained: answer.marksObtained || 0
      }));
      setAnswers(initialAnswers);
      
      // Calculate total marks
      const total = submission.answers.reduce((sum, a) => sum + (a.maxMarks || 0), 0);
      setTotalMarks(total);
      
      // Calculate obtained marks
      const obtained = submission.answers.reduce((sum, a) => sum + (a.marksObtained || 0), 0);
      setObtainedMarks(obtained);
    }
  }, [submission]);

  const handleMarksChange = (questionId, value, maxMarks) => {
    const marks = parseInt(value) || 0;
    
    // Validate marks
    if (marks < 0 || marks > maxMarks) return;
    
    // Update answers
    const updatedAnswers = answers.map(a => 
      a.questionId === questionId ? { ...a, marksObtained: marks } : a
    );
    setAnswers(updatedAnswers);
    
    // Recalculate total obtained marks
    const obtained = updatedAnswers.reduce((sum, a) => sum + (a.marksObtained || 0), 0);
    setObtainedMarks(obtained);
  };

  const getRatingFromPercentage = (percentage) => {
    return Math.min(5, Math.max(1, Math.round(percentage / 20)));
  };

  const onSubmit = async (data) => {
    // Validate all answers are graded
    const ungraded = answers.some(a => a.marksObtained === undefined || a.marksObtained === null);
    if (ungraded) {
      toast.error('Please grade all questions before submitting');
      return;
    }

    setLoading(true);
    try {
      const gradeData = {
        answers: answers.map(a => ({
          questionId: a.questionId,
          marksObtained: a.marksObtained
        })),
        feedback: data.feedback
      };

      await api.put(`/quiz-submissions/${submission._id}/grade`, gradeData);

      toast.success('Quiz graded successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to grade quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to grade quiz');
    } finally {
      setLoading(false);
    }
  };

  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
  const rating = getRatingFromPercentage(percentage);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Student Info */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <span className="text-primary-600 dark:text-primary-400 font-medium">
            {submission.student?.name?.charAt(0) || 'U'}
          </span>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{submission.student?.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{submission.student?.email}</p>
        </div>
      </div>

      {/* Quiz Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{submission.quiz?.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{submission.quiz?.subject?.name}</p>
      </div>

      {/* Overall Rating */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-400">Overall Score</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {obtainedMarks}/{totalMarks} ({percentage}%)
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              star <= rating ? (
                <StarIconSolid key={star} className="h-8 w-8 text-yellow-400" />
              ) : (
                <StarIcon key={star} className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              )
            ))}
          </div>
        </div>
      </div>

      {/* Questions Grading */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Grade Each Question
        </h3>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {answers.map((answer, index) => (
            <div key={answer.questionId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-1 rounded-full text-xs font-medium">
                  Q{answer.questionNumber || index + 1}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Max Marks: {answer.maxMarks}
                </span>
              </div>
              
              <p className="text-sm text-gray-900 dark:text-white mb-2">
                {answer.questionText}
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Student's Answer:</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {answer.studentAnswer || 'No answer provided'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-32">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Marks Obtained
                  </label>
                  <input
                    type="number"
                    value={answer.marksObtained || ''}
                    onChange={(e) => handleMarksChange(answer.questionId, e.target.value, answer.maxMarks)}
                    min="0"
                    max={answer.maxMarks}
                    step="0.5"
                    className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600 text-sm"
                    placeholder="Marks"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const questionPercentage = answer.maxMarks > 0 
                        ? ((answer.marksObtained || 0) / answer.maxMarks) * 100 
                        : 0;
                      const questionRating = getRatingFromPercentage(questionPercentage);
                      return star <= questionRating ? (
                        <StarIconSolid key={star} className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <StarIcon key={star} className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall Feedback */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Overall Feedback
        </label>
        <textarea
          {...register('feedback')}
          rows="3"
          className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          placeholder="Provide overall feedback to the student..."
        />
      </div>

      {/* Submission Date */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Submitted: {new Date(submission.submittedAt).toLocaleString()}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving...' : 'Submit Grades'}
        </button>
      </div>
    </form>
  );
};

export default GradeQuizForm;