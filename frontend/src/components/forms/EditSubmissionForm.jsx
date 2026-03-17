import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowUpIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

const EditSubmissionForm = ({ assignment, submission, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt', '.pptx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        setError('File must be under 10MB and of allowed type (PDF, Word, PPT, TXT, Images)');
        return;
      }
      setFile(acceptedFiles[0]);
      setError('');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('submission', file);

    try {
      const response = await api.put(`/assignments/submission/${submission._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Update response:', response.data);
      onSuccess();
      toast.success('Submission updated successfully');
    } catch (error) {
      console.error('Edit failed:', error);
      setError(error.response?.data?.message || 'Failed to update submission');
      toast.error('Failed to update submission');
    } finally {
      setUploading(false);
    }
  };

  const handleViewFile = (filePath) => {
  if (!filePath) return;
  
  // Get base URL from environment variable
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Construct correct URL for viewing
  let fileUrl;
  if (filePath.startsWith('http')) {
    fileUrl = filePath;
  } else if (filePath.startsWith('/')) {
    fileUrl = `${baseUrl}${filePath}`;
  } else {
    fileUrl = `${baseUrl}/${filePath}`;
  }
  
  console.log('Opening file:', fileUrl);
  window.open(fileUrl, '_blank');
};

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileName = (filePath) => {
    if (!filePath) return 'No file';
    return filePath.split('/').pop();
  };

  const deadline = new Date(assignment.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Assignment Info */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">{assignment.title}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className={`px-2 py-1 rounded-full ${
            daysLeft <= 2 
              ? 'bg-red-100 text-red-700' 
              : daysLeft <= 5 
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {daysLeft} days left
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            Deadline: {deadline.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Current File */}
      {submission?.fileUrl && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">Current Submission:</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DocumentArrowUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {getFileName(submission.fileUrl)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleViewFile(submission.fileUrl)}
                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="View file"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <span className="text-xs text-gray-500">
                {new Date(submission.submittedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upload New File */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Upload New File <span className="text-red-500">*</span>
        </label>
        
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-500'
              }`}
          >
            <input {...getInputProps()} />
            <DocumentArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-300">
              {isDragActive
                ? 'Drop your file here'
                : 'Drag & drop your new file here, or click to browse'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Supported: PDF, Word, PPT, TXT, Images (Max 10MB)
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DocumentArrowUpIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          disabled={uploading}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploading || !file}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {uploading ? (
            <>
              <LoadingSpinner size="sm" />
              Updating...
            </>
          ) : (
            <>
              <DocumentArrowUpIcon className="h-5 w-5" />
              Update Submission
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EditSubmissionForm;