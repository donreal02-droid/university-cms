import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const AssignmentForm = ({ assignment, subjects, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: assignment || {
      title: '',
      description: '',
      subjectId: '',
      maxMarks: 100,
      deadline: '',
      isActive: true
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('subjectId', data.subjectId);
      formData.append('maxMarks', parseInt(data.maxMarks));
      formData.append('deadline', new Date(data.deadline).toISOString());
      formData.append('isActive', data.isActive ? 'true' : 'false');
      
      if (file) {
        formData.append('assignment', file);
      }

      if (assignment) {
        await api.put(`/assignments/${assignment._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Assignment updated successfully');
      } else {
        await api.post('/assignments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Assignment created successfully');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Assignment operation failed:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="e.g., Binary Trees Implementation"
          />
          {errors.title && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject *
          </label>
          <select
            {...register('subjectId', { required: 'Subject is required' })}
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            <option value="">Select Subject</option>
            {subjects && subjects.length > 0 ? (
              subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} (Semester {subject.semester})
                </option>
              ))
            ) : (
              <option value="" disabled>No subjects available</option>
            )}
          </select>
          {errors.subjectId && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.subjectId.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description *
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows="4"
            className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            placeholder="Provide detailed instructions for the assignment..."
          />
          {errors.description && (
            <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Deadline and Max Marks */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deadline *
            </label>
            <input
              type="date"
              {...register('deadline', { 
                required: 'Deadline is required',
                min: { value: minDate, message: 'Deadline must be in the future' }
              })}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
              min={minDate}
            />
            {errors.deadline && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.deadline.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maximum Marks *
            </label>
            <input
              type="number"
              {...register('maxMarks', { 
                required: 'Maximum marks is required',
                min: { value: 1, message: 'Marks must be at least 1' },
                max: { value: 100, message: 'Marks cannot exceed 100' }
              })}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
              min="1"
              max="100"
            />
            {errors.maxMarks && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.maxMarks.message}</p>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assignment File (Optional)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
            <div className="space-y-1 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <div className="flex text-sm text-gray-600 dark:text-gray-400">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500 dark:focus-within:ring-offset-gray-900"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX, TXT up to 10MB
              </p>
              {file && (
                <p className="text-sm text-primary-600 dark:text-primary-400">
                  Selected: {file.name}
                </p>
              )}
              {assignment?.fileUrl && !file && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Current file: <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">View</a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active Assignment</span>
          </label>
        </div>
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
          {loading ? 'Saving...' : assignment ? 'Update Assignment' : 'Create Assignment'}
        </button>
      </div>
    </form>
  );
};

export default AssignmentForm;