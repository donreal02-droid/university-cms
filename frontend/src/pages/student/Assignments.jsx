import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CalendarIcon,
  UserIcon,
  BookOpenIcon,
  ChevronRightIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import SubmissionForm from '../../components/forms/SubmissionForm';
import EditSubmissionForm from '../../components/forms/EditSubmissionForm';
import ConfirmationModal from '../../components/ConfirmationModal';
import toast from 'react-hot-toast';

const StudentAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    graded: 0,
    late: 0,
    averageScore: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [assignmentsRes, subjectsRes] = await Promise.all([
        api.get('/assignments/student'),
        api.get('/subjects/student')
      ]);

      console.log('Assignments response:', assignmentsRes.data);
      console.log('Subjects response:', subjectsRes.data);

      let assignmentsData = [];
      if (Array.isArray(assignmentsRes.data)) {
        assignmentsData = assignmentsRes.data;
      } else if (assignmentsRes.data?.assignments && Array.isArray(assignmentsRes.data.assignments)) {
        assignmentsData = assignmentsRes.data.assignments;
      } else if (assignmentsRes.data?.data && Array.isArray(assignmentsRes.data.data)) {
        assignmentsData = assignmentsRes.data.data;
      }
      setAssignments(assignmentsData);

      let subjectsData = [];
      if (Array.isArray(subjectsRes.data)) {
        subjectsData = subjectsRes.data;
      } else if (subjectsRes.data?.subjects && Array.isArray(subjectsRes.data.subjects)) {
        subjectsData = subjectsRes.data.subjects;
      } else if (subjectsRes.data?.data && Array.isArray(subjectsRes.data.data)) {
        subjectsData = subjectsRes.data.data;
      }
      setSubjects(subjectsData);

      const pending = assignmentsData.filter(a => a.status === 'pending').length;
      const submitted = assignmentsData.filter(a => a.status === 'submitted').length;
      const graded = assignmentsData.filter(a => a.status === 'graded').length;
      const late = assignmentsData.filter(a => a.status === 'late').length;

      const gradedAssignments = assignmentsData.filter(a => a.marks != null);
      const avgScore = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((acc, a) => acc + a.marks, 0) / gradedAssignments.length)
        : 0;

      setStats({
        total: assignmentsData.length,
        pending,
        submitted,
        graded,
        late,
        averageScore: avgScore
      });

    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Assignments refreshed');
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowEditModal(true);
  };

  const handleDeleteClick = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteConfirmation(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setShowSubmitModal(false);
    setShowEditModal(false);
    setShowDeleteConfirmation(false);
    setSelectedAssignment(null);
  };

  const handleDeleteSubmission = async () => {
    if (!selectedAssignment || !selectedAssignment.submission?._id) {
      toast.error('No submission found to delete');
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/assignments/submission/${selectedAssignment.submission._id}`);
      
      // Update the assignment in the list
      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => {
          if (assignment._id === selectedAssignment._id) {
            return {
              ...assignment,
              status: 'pending',
              submission: null
            };
          }
          return assignment;
        })
      );
      
      // Update selected assignment
      setSelectedAssignment(prev => ({
        ...prev,
        status: 'pending',
        submission: null
      }));
      
      toast.success('Submission deleted successfully');
      setShowDeleteConfirmation(false);
      
      // Refresh data to ensure everything is in sync
      await fetchData();
      
    } catch (error) {
      console.error('Failed to delete submission:', error);
      toast.error(error.response?.data?.message || 'Failed to delete submission');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmissionSuccess = () => {
    fetchData();
    setShowSubmitModal(false);
    setSelectedAssignment(null);
    toast.success('Assignment submitted successfully');
  };

  const handleEditSuccess = () => {
    fetchData();
    setShowEditModal(false);
    setSelectedAssignment(null);
    toast.success('Submission updated successfully');
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    
    if (filePath.startsWith('http')) {
      return filePath;
    }
    
    if (filePath.startsWith('/uploads')) {
      return `http://localhost:5000${filePath}`;
    }
    
    const cleanPath = filePath.replace(/^.*?backend[\\/]/, '').replace(/\\/g, '/');
    return `http://localhost:5000/${cleanPath}`;
  };

  const handleViewSubmission = (submission) => {
    if (!submission?.fileUrl) {
      toast.error('No file URL available');
      return;
    }
    const fileUrl = getFileUrl(submission.fileUrl);
    window.open(fileUrl, '_blank');
  };

  const handleViewAssignmentFile = (assignment) => {
    if (!assignment?.fileUrl) {
      toast.error('No file URL available');
      return;
    }
    const fileUrl = getFileUrl(assignment.fileUrl);
    window.open(fileUrl, '_blank');
  };

  const canEditSubmission = (assignment) => {
    // Can edit if:
    // 1. Assignment is submitted (not graded)
    // 2. Deadline hasn't passed
    // 3. Has a submission
    return assignment.status === 'submitted' && 
           assignment.submission && 
           new Date(assignment.deadline) > new Date();
  };

  const getStatusBadge = (assignment) => {
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    
    if (assignment.status === 'graded') {
      return {
        text: `Graded (${assignment.marks}/${assignment.maxMarks})`,
        className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
        icon: CheckCircleSolid
      };
    } else if (assignment.status === 'submitted') {
      return {
        text: 'Submitted',
        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
        icon: CheckCircleIcon
      };
    } else if (assignment.status === 'late') {
      return {
        text: 'Late Submission',
        className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
        icon: XCircleIcon
      };
    } else if (deadline < now) {
      return {
        text: 'Expired',
        className: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400',
        icon: XCircleIcon
      };
    } else {
      const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 2) {
        return {
          text: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`,
          className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
          icon: ClockIcon
        };
      } else if (daysLeft <= 5) {
        return {
          text: `${daysLeft} days left`,
          className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
          icon: ClockIcon
        };
      } else {
        return {
          text: `${daysLeft} days left`,
          className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
          icon: ClockIcon
        };
      }
    }
  };

  const filteredAssignments = assignments
    .filter(assignment => {
      const matchesSearch = 
        assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject = subjectFilter === 'all' || assignment.subject?._id === subjectFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = assignment.status === 'pending';
      } else if (statusFilter === 'submitted') {
        matchesStatus = assignment.status === 'submitted';
      } else if (statusFilter === 'graded') {
        matchesStatus = assignment.status === 'graded';
      } else if (statusFilter === 'late') {
        matchesStatus = assignment.status === 'late';
      } else if (statusFilter === 'expired') {
        matchesStatus = assignment.status === 'pending' && new Date(assignment.deadline) < new Date();
      }

      return matchesSearch && matchesSubject && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.deadline) - new Date(b.deadline);
      } else if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'subject') {
        return (a.subject?.name || '').localeCompare(b.subject?.name || '');
      }
      return 0;
    });

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You have {stats.total} total assignment{stats.total !== 1 ? 's' : ''}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.submitted}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.graded}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Graded</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.late}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Late</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.averageScore}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Score</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by title, description, or subject..."
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
                <option value="" disabled>No subjects available</option>
              )}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="late">Late</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex justify-end mt-4">
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="newest">Newest First</option>
              <option value="title">Sort by Title</option>
              <option value="subject">Sort by Subject</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No assignments found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || subjectFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'You have no assignments yet'}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const status = getStatusBadge(assignment);
            const StatusIcon = status.icon;
            const canSubmit = assignment.status === 'pending' && new Date(assignment.deadline) > new Date();
            const canEdit = canEditSubmission(assignment);
            const hasSubmitted = assignment.status === 'submitted' || assignment.status === 'graded';
            const deadlinePassed = new Date(assignment.deadline) < new Date();

            return (
              <div
                key={assignment._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left side - Assignment Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${status.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.text}
                        </span>
                        {deadlinePassed && assignment.status === 'pending' && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            Deadline Passed
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {assignment.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <BookOpenIcon className="h-4 w-4" />
                          {assignment.subject?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          Due: {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="h-4 w-4" />
                          Max Marks: {assignment.maxMarks}
                        </span>
                        {assignment.marks && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                            <CheckCircleIcon className="h-4 w-4" />
                            Score: {assignment.marks}/{assignment.maxMarks}
                          </span>
                        )}
                      </div>

                      {assignment.feedback && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Feedback: </span>
                          <span className="text-gray-600 dark:text-gray-400">{assignment.feedback}</span>
                        </div>
                      )}

                      {assignment.submission && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                          <span className="font-medium text-blue-700 dark:text-blue-400">Submitted: </span>
                          <span className="text-blue-600 dark:text-blue-300">
                            {new Date(assignment.submission.submittedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(assignment)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {canSubmit && (
                        <button
                          onClick={() => handleSubmitAssignment(assignment)}
                          className="p-2 text-green-600 dark:text-green-400 hover:text-white hover:bg-green-600 dark:hover:bg-green-600 rounded-lg transition-colors"
                          title="Submit Assignment"
                        >
                          <ArrowUpTrayIcon className="h-5 w-5" />
                        </button>
                      )}

                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleEditAssignment(assignment)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 rounded-lg transition-colors"
                            title="Edit Submission"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(assignment)}
                            className="p-2 text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-600 rounded-lg transition-colors"
                            title="Delete Submission"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}

                      {assignment.fileUrl && (
                        <button
                          onClick={() => handleViewAssignmentFile(assignment)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="View Assignment File"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assignment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={handleCloseModal}
        title="Assignment Details"
        size="lg"
      >
        {selectedAssignment && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <ClipboardDocumentListIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAssignment.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedAssignment.subject?.name} • Due: {new Date(selectedAssignment.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                {selectedAssignment.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subject</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedAssignment.subject?.name}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Teacher</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedAssignment.teacher?.name}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Marks</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedAssignment.maxMarks}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedAssignment.status === 'graded' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                  selectedAssignment.status === 'submitted' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                  selectedAssignment.status === 'late' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                }`}>
                  {selectedAssignment.status || 'Pending'}
                </span>
              </div>
            </div>

            {/* Submission Info */}
            {selectedAssignment.submission && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Submission</h3>
                  {canEditSubmission(selectedAssignment) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleCloseModal();
                          handleEditAssignment(selectedAssignment);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleCloseModal();
                          handleDeleteClick(selectedAssignment);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-600 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Submitted: {new Date(selectedAssignment.submission.submittedAt).toLocaleString()}
                  </p>
                  {selectedAssignment.submission.fileUrl && (
                    <button
                      onClick={() => handleViewSubmission(selectedAssignment.submission)}
                      className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                    >
                      <DocumentTextIcon className="h-5 w-5" />
                      View Submission
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Grade Info */}
            {selectedAssignment.marks && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Grade & Feedback</h3>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-lg font-bold text-green-700 dark:text-green-400 mb-2">
                    {selectedAssignment.marks}/{selectedAssignment.maxMarks}
                  </p>
                  {selectedAssignment.feedback && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                      "{selectedAssignment.feedback}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {selectedAssignment.status === 'pending' && new Date(selectedAssignment.deadline) > new Date() && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    handleCloseModal();
                    handleSubmitAssignment(selectedAssignment);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  Submit Assignment
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Submit Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={handleCloseModal}
        title="Submit Assignment"
        size="md"
      >
        {selectedAssignment && (
          <SubmissionForm
            assignment={selectedAssignment}
            onClose={handleCloseModal}
            onSuccess={handleSubmissionSuccess}
          />
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        title="Edit Submission"
        size="md"
      >
        {selectedAssignment && (
          <EditSubmissionForm
            assignment={selectedAssignment}
            submission={selectedAssignment.submission}
            onClose={handleCloseModal}
            onSuccess={handleEditSuccess}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={handleCloseModal}
        onConfirm={handleDeleteSubmission}
        title="Delete Submission"
        message="Are you sure you want to delete your submission? This action cannot be undone and you will need to resubmit the assignment."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleting}
        type="danger"
      />
    </div>
  );
};

export default StudentAssignments;