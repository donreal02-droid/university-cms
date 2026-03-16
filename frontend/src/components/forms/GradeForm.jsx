import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const GradeForm = ({ submission, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(submission.marks ? Math.round(submission.marks / 20) : 0);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      marks: submission.marks || '',
      feedback: submission.feedback || ''
    }
  });

  const marks = watch('marks');

  // Update rating when marks change
  useEffect(() => {
    if (marks && submission.assignment?.maxMarks) {
      const percentage = (parseInt(marks) / submission.assignment.maxMarks) * 100;
      const newRating = Math.round(percentage / 20);
      setRating(Math.min(5, Math.max(0, newRating)));
    }
  }, [marks, submission.assignment?.maxMarks]);

  const handleRatingClick = (star) => {
    if (submission.assignment?.maxMarks) {
      const newMarks = Math.round((star * 20 / 100) * submission.assignment.maxMarks);
      setValue('marks', newMarks);
      setRating(star);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put(`/submissions/${submission._id}/grade`, {
        marks: parseInt(data.marks),
        feedback: data.feedback
      });

      toast.success('Submission graded successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to grade submission:', error);
      toast.error(error.response?.data?.message || 'Failed to grade submission');
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-sm text-gray-500 dark:text-gray-400">{submission.student?.enrollmentNumber}</p>
        </div>
      </div>

      {/* Assignment Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{submission.assignment?.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{submission.assignment?.subject?.name}</p>
      </div>

      {/* Quick Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quick Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(star)}
              className="focus:outline-none"
            >
              {star <= rating ? (
                <StarIconSolid className="h-8 w-8 text-yellow-400 hover:text-yellow-500 dark:hover:text-yellow-300 transition-colors" />
              ) : (
                <StarIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-500 transition-colors" />
              )}
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {rating * 20}% - {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1] || 'Not rated'}
          </span>
        </div>
      </div>

      {/* Marks Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Marks (out of {submission.assignment?.maxMarks}) *
        </label>
        <input
          type="number"
          {...register('marks', { 
            required: 'Marks are required',
            min: { value: 0, message: 'Marks cannot be negative' },
            max: { value: submission.assignment?.maxMarks, message: `Marks cannot exceed ${submission.assignment?.maxMarks}` }
          })}
          className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          placeholder={`Enter marks (0-${submission.assignment?.maxMarks})`}
        />
        {errors.marks && (
          <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.marks.message}</p>
        )}
      </div>

      {/* Feedback */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Feedback
        </label>
        <textarea
          {...register('feedback')}
          rows="4"
          className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          placeholder="Provide feedback to the student..."
        />
      </div>

      {/* Submission Date */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Submitted: {new Date(submission.submittedAt).toLocaleString()}
        {submission.isLate && (
          <span className="ml-2 text-red-600 dark:text-red-400 font-medium">(Late Submission)</span>
        )}
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
          {loading ? 'Saving...' : 'Submit Grade'}
        </button>
      </div>
    </form>
  );
};

export default GradeForm;