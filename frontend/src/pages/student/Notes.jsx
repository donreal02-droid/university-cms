import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  DocumentTextIcon,
  DocumentArrowDownIcon,
  PhotoIcon,
  VideoCameraIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  BookOpenIcon,
  ChevronDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const StudentNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // File type configurations with categories and better matching
  const fileTypes = {
    // PDF Files - multiple variations
    'application/pdf': { icon: DocumentTextIcon, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', name: 'PDF', category: 'pdf' },
    'pdf': { icon: DocumentTextIcon, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', name: 'PDF', category: 'pdf' },
    '.pdf': { icon: DocumentTextIcon, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', name: 'PDF', category: 'pdf' },
    
    // Word/Document Files
    'application/msword': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word', category: 'document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word', category: 'document' },
    'application/vnd.oasis.opendocument.text': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word', category: 'document' },
    'text/plain': { icon: DocumentTextIcon, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', name: 'Text', category: 'document' },
    'application/rtf': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'RTF', category: 'document' },
    'doc': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word', category: 'document' },
    'docx': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word', category: 'document' },
    '.doc': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word', category: 'document' },
    '.docx': { icon: DocumentTextIcon, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', name: 'Word', category: 'document' },
    
    // PPT/Presentation Files
    'application/vnd.ms-powerpoint': { icon: PresentationChartBarIcon, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', name: 'PPT', category: 'presentation' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: PresentationChartBarIcon, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', name: 'PPTX', category: 'presentation' },
    'ppt': { icon: PresentationChartBarIcon, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', name: 'PPT', category: 'presentation' },
    'pptx': { icon: PresentationChartBarIcon, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', name: 'PPTX', category: 'presentation' },
    '.ppt': { icon: PresentationChartBarIcon, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', name: 'PPT', category: 'presentation' },
    '.pptx': { icon: PresentationChartBarIcon, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', name: 'PPTX', category: 'presentation' },
    
    // Images
    'image/jpeg': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'JPEG', category: 'image' },
    'image/png': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'PNG', category: 'image' },
    'image/gif': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'GIF', category: 'image' },
    'image/webp': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'WebP', category: 'image' },
    'image/svg+xml': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'SVG', category: 'image' },
    'jpg': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'JPEG', category: 'image' },
    'jpeg': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'JPEG', category: 'image' },
    'png': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'PNG', category: 'image' },
    '.jpg': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'JPEG', category: 'image' },
    '.jpeg': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'JPEG', category: 'image' },
    '.png': { icon: PhotoIcon, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', name: 'PNG', category: 'image' },
    
    // Videos
    'video/mp4': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MP4', category: 'video' },
    'video/webm': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'WebM', category: 'video' },
    'video/quicktime': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MOV', category: 'video' },
    'video/x-msvideo': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'AVI', category: 'video' },
    'video/x-matroska': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MKV', category: 'video' },
    'mp4': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MP4', category: 'video' },
    'mov': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MOV', category: 'video' },
    '.mp4': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MP4', category: 'video' },
    '.mov': { icon: VideoCameraIcon, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', name: 'MOV', category: 'video' },
    
    // Default
    'default': { icon: DocumentTextIcon, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', name: 'File', category: 'other' }
  };

  // Category options for filter
  const categoryOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'pdf', label: 'PDF Files' },
    { value: 'document', label: 'Word/Document Files' },
    { value: 'presentation', label: 'PPT/Presentation Files' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [notesRes, subjectsRes] = await Promise.all([
        api.get('/notes/student'),
        api.get('/subjects/student')
      ]);

      console.log('Notes response:', notesRes.data);
      console.log('Subjects response:', subjectsRes.data);

      // Process notes
      let notesData = [];
      if (Array.isArray(notesRes.data)) {
        notesData = notesRes.data;
      } else if (notesRes.data?.notes && Array.isArray(notesRes.data.notes)) {
        notesData = notesRes.data.notes;
      } else if (notesRes.data?.data && Array.isArray(notesRes.data.data)) {
        notesData = notesRes.data.data;
      }
      
      // Log each note's file type for debugging
      notesData.forEach(note => {
        const category = getFileCategory(note.fileType);
        console.log(`Note: ${note.title}, FileType: ${note.fileType}, Category: ${category}`);
      });
      
      setNotes(notesData);

      // Process subjects
      let subjectsData = [];
      if (Array.isArray(subjectsRes.data)) {
        subjectsData = subjectsRes.data;
      } else if (subjectsRes.data?.subjects && Array.isArray(subjectsRes.data.subjects)) {
        subjectsData = subjectsRes.data.subjects;
      } else if (subjectsRes.data?.data && Array.isArray(subjectsRes.data.data)) {
        subjectsData = subjectsRes.data.data;
      }
      setSubjects(subjectsData);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Materials refreshed');
  };

  const handleDownload = async (note) => {
    try {
      const response = await api.get(`/notes/${note._id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileExtension = note.fileUrl?.split('.').pop() || 'pdf';
      link.setAttribute('download', `${note.title}.${fileExtension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Download started');
    } catch (error) {
      console.error('Failed to download:', error);
      toast.error('Failed to download file');
    }
  };

  const handlePreview = (note) => {
    if (!note.fileUrl) {
      toast.error('No file URL available');
      return;
    }

    let fileUrl = note.fileUrl;
if (!fileUrl.startsWith('http')) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const cleanPath = fileUrl.replace(/^.*?backend[\\/]/, '').replace(/\\/g, '/');
  fileUrl = `${baseUrl}/${cleanPath}`;
}
    
    console.log('Opening file:', fileUrl);
    window.open(fileUrl, '_blank');
  };

  const getFileTypeInfo = (mimeType) => {
    if (!mimeType) return fileTypes.default;
    
    // Try exact match first
    if (fileTypes[mimeType]) {
      return fileTypes[mimeType];
    }
    
    // Try lowercase match
    const lowerCase = mimeType.toLowerCase();
    if (fileTypes[lowerCase]) {
      return fileTypes[lowerCase];
    }
    
    // Try to match by file extension from URL if available
    // This will be handled in the component where we have access to fileUrl
    
    return fileTypes.default;
  };

  const getFileCategory = (mimeType) => {
    if (!mimeType) return 'other';
    
    // Try exact match first
    if (fileTypes[mimeType]) {
      return fileTypes[mimeType].category;
    }
    
    // Try lowercase match
    const lowerCase = mimeType.toLowerCase();
    if (fileTypes[lowerCase]) {
      return fileTypes[lowerCase].category;
    }
    
    // Check if it contains pdf
    if (mimeType.toLowerCase().includes('pdf')) {
      return 'pdf';
    }
    
    // Check if it contains document words
    const lowerMime = mimeType.toLowerCase();
    if (lowerMime.includes('word') || lowerMime.includes('document') || lowerMime.includes('text') || lowerMime.includes('rtf')) {
      return 'document';
    }
    
    // Check if it contains presentation words
    if (lowerMime.includes('powerpoint') || lowerMime.includes('presentation') || lowerMime.includes('ppt')) {
      return 'presentation';
    }
    
    // Check if it's an image
    if (lowerMime.startsWith('image/') || lowerMime.includes('jpg') || lowerMime.includes('jpeg') || lowerMime.includes('png') || lowerMime.includes('gif')) {
      return 'image';
    }
    
    // Check if it's a video
    if (lowerMime.startsWith('video/') || lowerMime.includes('mp4') || lowerMime.includes('mov') || lowerMime.includes('avi')) {
      return 'video';
    }
    
    return 'other';
  };

  // Helper function to get category from file URL as fallback
  const getCategoryFromFileUrl = (fileUrl) => {
    if (!fileUrl) return 'other';
    
    const extension = fileUrl.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'document';
    if (['ppt', 'pptx'].includes(extension)) return 'presentation';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) return 'video';
    
    return 'other';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = 
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject = subjectFilter === 'all' || note.subject?._id === subjectFilter;
      
      // Get category from fileType or fallback to fileUrl
      let category = getFileCategory(note.fileType);
      if (category === 'other' && note.fileUrl) {
        category = getCategoryFromFileUrl(note.fileUrl);
      }
      
      const matchesType = typeFilter === 'all' || category === typeFilter;

      return matchesSearch && matchesSubject && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'popular') {
        return (b.downloads || 0) - (a.downloads || 0);
      }
      return 0;
    });

  // Calculate library summary stats with fallback
  const libraryStats = {
    total: notes.length,
    pdf: notes.filter(n => {
      const cat = getFileCategory(n.fileType);
      if (cat === 'pdf') return true;
      if (cat === 'other' && n.fileUrl) {
        return getCategoryFromFileUrl(n.fileUrl) === 'pdf';
      }
      return false;
    }).length,
    documents: notes.filter(n => {
      const cat = getFileCategory(n.fileType);
      if (cat === 'document') return true;
      if (cat === 'other' && n.fileUrl) {
        return getCategoryFromFileUrl(n.fileUrl) === 'document';
      }
      return false;
    }).length,
    presentations: notes.filter(n => {
      const cat = getFileCategory(n.fileType);
      if (cat === 'presentation') return true;
      if (cat === 'other' && n.fileUrl) {
        return getCategoryFromFileUrl(n.fileUrl) === 'presentation';
      }
      return false;
    }).length,
    images: notes.filter(n => {
      const cat = getFileCategory(n.fileType);
      if (cat === 'image') return true;
      if (cat === 'other' && n.fileUrl) {
        return getCategoryFromFileUrl(n.fileUrl) === 'image';
      }
      return false;
    }).length,
    videos: notes.filter(n => {
      const cat = getFileCategory(n.fileType);
      if (cat === 'video') return true;
      if (cat === 'other' && n.fileUrl) {
        return getCategoryFromFileUrl(n.fileUrl) === 'video';
      }
      return false;
    }).length,
    other: notes.filter(n => {
      const cat = getFileCategory(n.fileType);
      if (cat === 'other') {
        if (n.fileUrl) {
          const urlCat = getCategoryFromFileUrl(n.fileUrl);
          return urlCat === 'other';
        }
        return true;
      }
      return false;
    }).length
  };

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Study Materials</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredNotes.length} material{filteredNotes.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by title, description, subject, or teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Subjects</option>
              {subjects && subjects.length > 0 ? (
                subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading subjects...</option>
              )}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row - Sort */}
        <div className="flex justify-end mt-4">
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">By Title</option>
              <option value="popular">Most Downloaded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No materials found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || subjectFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No study materials have been uploaded yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            // Get file info with fallback
            let fileInfo = getFileTypeInfo(note.fileType);
            
            // If default and we have fileUrl, try to get better info from extension
            if (fileInfo.category === 'other' && note.fileUrl) {
              const extension = note.fileUrl.split('.').pop()?.toLowerCase();
              if (extension && fileTypes[extension]) {
                fileInfo = fileTypes[extension];
              } else if (extension === 'pdf') {
                fileInfo = fileTypes['pdf'];
              } else if (['doc', 'docx'].includes(extension)) {
                fileInfo = fileTypes['doc'];
              } else if (['ppt', 'pptx'].includes(extension)) {
                fileInfo = fileTypes['ppt'];
              } else if (['jpg', 'jpeg', 'png'].includes(extension)) {
                fileInfo = fileTypes[extension];
              } else if (['mp4', 'mov'].includes(extension)) {
                fileInfo = fileTypes[extension];
              }
            }
            
            const FileIcon = fileInfo.icon;
            
            return (
              <div
                key={note._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-800 transition-all group"
              >
                <div className="p-6">
                  {/* Header with Icon and Type */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${fileInfo.bg} group-hover:scale-110 transition-transform`}>
                      <FileIcon className={`h-8 w-8 ${fileInfo.color}`} />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${fileInfo.bg} ${fileInfo.color}`}>
                      {fileInfo.name}
                    </span>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {note.title}
                  </h3>
                  
                  {note.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {note.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <BookOpenIcon className="h-4 w-4" />
                      <span>{note.subject?.name || 'Unknown Subject'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <UserIcon className="h-4 w-4" />
                      <span>Uploaded by {note.teacher?.name || 'Unknown Teacher'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4" />
                      <span>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      <span>{note.downloads || 0} downloads • {formatFileSize(note.fileSize)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handlePreview(note)}
                      disabled={!note.fileUrl}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <EyeIcon className="h-5 w-5" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(note)}
                      disabled={!note.fileUrl}
                      className="flex-1 bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-primary-100 dark:border-primary-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Library Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{libraryStats.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">PDF</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{libraryStats.pdf}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Word/Doc</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{libraryStats.documents}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">PPT</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{libraryStats.presentations}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Images</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{libraryStats.images}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Videos</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{libraryStats.videos}</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Other files: {libraryStats.other}
        </div>
      </div>

      {/* Study Tips */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <AcademicCapIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">Study Tips</h3>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
              <li>Download materials for offline study</li>
              <li>Organize files by subject for easy access</li>
              <li>Check regularly for new uploads from your teachers</li>
              <li>Use the preview feature to quickly review content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentNotes;