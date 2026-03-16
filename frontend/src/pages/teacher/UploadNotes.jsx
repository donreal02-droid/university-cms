import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { DocumentArrowUpIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const UploadNotes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    fileType: '',
    isPublic: true
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});

  // File type configurations with dark mode support
  const fileTypes = {
    // Documents
    'application/pdf': { icon: DocumentTextIcon, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', name: 'PDF' },
    'application/msword': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word' },
    'application/vnd.oasis.opendocument.text': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word' },
    'text/plain': { icon: DocumentTextIcon, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', name: 'Text' },
    
    // Images
    'image/jpeg': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'JPEG' },
    'image/png': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'PNG' },
    'image/gif': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'GIF' },
    'image/webp': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'WebP' },
    'image/svg+xml': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'SVG' },
    
    // Presentations
    'application/vnd.ms-powerpoint': { icon: PresentationChartBarIcon, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', name: 'PowerPoint' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: PresentationChartBarIcon, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', name: 'PowerPoint' },
    'application/vnd.oasis.opendocument.presentation': { icon: PresentationChartBarIcon, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', name: 'Presentation' },
    
    // Spreadsheets
    'application/vnd.ms-excel': { icon: TableCellsIcon, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'Excel' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: TableCellsIcon, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'Excel' },
    'application/vnd.oasis.opendocument.spreadsheet': { icon: TableCellsIcon, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'Spreadsheet' },
    
    // Videos
    'video/mp4': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MP4' },
    'video/webm': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'WebM' },
    'video/ogg': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'OGG' },
    'video/quicktime': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MOV' },
    'video/x-msvideo': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'AVI' },
    'video/x-matroska': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MKV' },
    
    // Default
    'default': { icon: DocumentIcon, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', name: 'File' }
  };

  // Maximum file size (100MB)
  const MAX_FILE_SIZE = 100 * 1024 * 1024;

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subjects/teacher');
      
      const subjectsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.subjects || [];
      
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

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
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds 100MB limit`);
      return;
    }

    const fileTypeInfo = fileTypes[file.type] || fileTypes.default;
    
    setSelectedFile(file);
    setFormData(prev => ({
      ...prev,
      fileType: file.type || 'application/octet-stream'
    }));

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }

    if (!formData.title) {
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setFormData(prev => ({ ...prev, title: fileName }));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    if (formData.title === selectedFile?.name.split('.').slice(0, -1).join('.')) {
      setFormData(prev => ({ ...prev, title: '' }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.subjectId) {
      newErrors.subjectId = 'Please select a subject';
    }
    if (!selectedFile) {
      newErrors.file = 'Please select a file to upload';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description || '');
    uploadData.append('subjectId', formData.subjectId);
    uploadData.append('isPublic', formData.isPublic);
    uploadData.append('note', selectedFile);

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await api.post('/notes', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      console.log('Upload response:', response.data);
      toast.success('Notes uploaded successfully!');
      
      setTimeout(() => {
        navigate('/teacher/subjects');
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.message || 'Failed to upload notes');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return DocumentArrowUpIcon;
    const fileTypeInfo = fileTypes[selectedFile.type] || fileTypes.default;
    return fileTypeInfo.icon;
  };

  const getFileColor = () => {
    if (!selectedFile) return 'text-primary-600 dark:text-primary-400';
    const fileTypeInfo = fileTypes[selectedFile.type] || fileTypes.default;
    return fileTypeInfo.color;
  };

  const getFileBgColor = () => {
    if (!selectedFile) return 'bg-primary-50 dark:bg-primary-900/20';
    const fileTypeInfo = fileTypes[selectedFile.type] || fileTypes.default;
    return fileTypeInfo.bg;
  };

  const getFileTypeName = () => {
    if (!selectedFile) return '';
    const fileTypeInfo = fileTypes[selectedFile.type] || fileTypes.default;
    return fileTypeInfo.name;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <LoadingSpinner />;

  const FileIcon = getFileIcon();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Upload Notes & Materials</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Share study materials with your students. Supports PDF, Word, Images, PowerPoint, Videos, and more.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">1. Select File</h2>
          
          {!selectedFile ? (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
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
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.svg,.ppt,.pptx,.xls,.xlsx,.mp4,.webm,.mov,.avi,.mkv"
              />
              
              <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                Drag & drop your file here
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                or <span className="text-primary-600 dark:text-primary-400 font-medium">browse</span> to select a file
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">PDF</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Word</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Images</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">PowerPoint</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Excel</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Video</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Maximum file size: 100MB
              </p>
            </div>
          ) : (
            <div className={`${getFileBgColor()} rounded-lg p-6 border border-gray-200 dark:border-gray-700`}>
              <div className="flex items-start gap-4">
                {/* File Icon */}
                <div className={`p-3 rounded-lg ${getFileBgColor()}`}>
                  <FileIcon className={`h-10 w-10 ${getFileColor()}`} />
                </div>

                {/* File Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{getFileTypeName()}</span>
                        <span>•</span>
                        <span>{formatFileSize(selectedFile.size)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>

                  {/* File Preview */}
                  {filePreview && (
                    <div className="mt-4">
                      {selectedFile.type.startsWith('image/') ? (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      ) : selectedFile.type.startsWith('video/') ? (
                        <video
                          src={filePreview}
                          controls
                          className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploading && uploadProgress > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                        <span className="font-medium text-primary-600 dark:text-primary-400">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 dark:bg-primary-500 rounded-full h-2 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {errors.file && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-2">{errors.file}</p>
          )}
        </div>

        {/* File Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">2. File Details</h2>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input-field dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.title ? 'border-red-500 dark:border-red-500' : ''}`}
                placeholder="e.g., Chapter 1: Introduction to Data Structures"
              />
              {errors.title && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="Add a brief description of this material..."
              />
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleInputChange}
                className={`input-field dark:bg-gray-800 dark:text-white dark:border-gray-600 ${errors.subjectId ? 'border-red-500 dark:border-red-500' : ''}`}
              >
                <option value="">Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} (Semester {subject.semester})
                  </option>
                ))}
              </select>
              {errors.subjectId && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.subjectId}</p>
              )}
            </div>

            {/* Public/Private Toggle */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Make this material public</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Public materials are visible to all students in the subject
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Supported File Formats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <DocumentTextIcon className="h-4 w-4" />
              <span>PDF (.pdf)</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Word (.doc, .docx)</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <PhotoIcon className="h-4 w-4" />
              <span>Images (.jpg, .png, .gif)</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <PresentationChartBarIcon className="h-4 w-4" />
              <span>PowerPoint (.ppt, .pptx)</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <TableCellsIcon className="h-4 w-4" />
              <span>Excel (.xls, .xlsx)</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <VideoCameraIcon className="h-4 w-4" />
              <span>Video (.mp4, .mov, .avi)</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Text (.txt)</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Maximum file size: 100MB per file
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/teacher/subjects')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="btn-primary flex items-center gap-2 min-w-[150px] justify-center"
          >
            {uploading ? (
              <>
                <LoadingSpinner />
                <span>Uploading... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="h-5 w-5" />
                Upload Notes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Upload Tips */}
      <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📝 Tips for uploading notes:</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li>Use clear, descriptive titles for easy searching</li>
          <li>Add a brief description to help students understand the content</li>
          <li>Select the correct subject to ensure materials reach the right students</li>
          <li>Large video files may take longer to upload - please be patient</li>
          <li>You can make materials private if they're not ready for all students</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadNotes;