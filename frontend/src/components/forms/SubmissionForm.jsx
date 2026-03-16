import React, { useState } from 'react';
import api from '../../utils/api';
import { DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SubmissionForm = ({ assignment, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload PDF, Word, Text, or Image files only');
      return;
    }

    setFile(file);
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('submission', file);

    setLoading(true);
    try {
      await api.post(`/assignments/${assignment._id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Assignment submitted successfully');
      onSuccess();
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Assignment Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white">{assignment.title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{assignment.subject?.name}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Due: {new Date(assignment.deadline).toLocaleDateString()}
        </p>
      </div>

      {/* File Upload Area */}
      {!file ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
          
          <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Drag & drop your file here, or <span className="text-primary-600 dark:text-primary-400 font-medium">browse</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supported formats: PDF, Word, Text, Images (Max 10MB)
          </p>
        </div>
      ) : (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentArrowUpIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Deadline Warning */}
      {new Date(assignment.deadline) < new Date() && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">
            ⚠️ This assignment is past the deadline. Late submissions may not be accepted.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !file}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-gray-200"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <DocumentArrowUpIcon className="h-5 w-5" />
              Submit Assignment
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SubmissionForm;