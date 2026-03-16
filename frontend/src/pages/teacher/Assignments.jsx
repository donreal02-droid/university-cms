import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import AssignmentForm from '../../components/forms/AssignmentForm';
import toast from 'react-hot-toast';

const TeacherAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalSubmissions: 0
  });

  // Helper function to get correct file URL
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith('http')) return filePath;
    
    // Remove any Windows path prefixes and fix backslashes
    const cleanPath = filePath.replace(/^.*?backend[\\/]/, '').replace(/\\/g, '/');
    return `http://localhost:5000/${cleanPath}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [assignmentsRes, subjectsRes] = await Promise.all([
        api.get('/assignments/teacher'),
        api.get('/subjects/teacher')
      ]);

      let subjectsData = [];
      if (subjectsRes.data?.data) {
        subjectsData = subjectsRes.data.data;
      } else if (Array.isArray(subjectsRes.data)) {
        subjectsData = subjectsRes.data;
      } else if (subjectsRes.data?.subjects) {
        subjectsData = subjectsRes.data.subjects;
      }
      setSubjects(subjectsData);

      const assignmentsData = Array.isArray(assignmentsRes.data) 
        ? assignmentsRes.data 
        : assignmentsRes.data?.assignments || [];
      setAssignments(assignmentsData);

      const now = new Date();
      const active = assignmentsData.filter(a => new Date(a.deadline) > now).length;
      const expired = assignmentsData.filter(a => new Date(a.deadline) <= now).length;
      const totalSubmissions = assignmentsData.reduce((acc, a) => 
        acc + (a.submissions?.length || 0), 0
      );

      setStats({
        total: assignmentsData.length,
        active,
        expired,
        totalSubmissions
      });

    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDetailsModal(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;

    try {
      await api.delete(`/assignments/${assignmentId}`);
      toast.success('Assignment deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAssignment(null);
  };

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedAssignment(null);
  };

  const handleModalSuccess = () => {
    fetchData();
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject = subjectFilter === 'all' || assignment.subject?._id === subjectFilter;
    
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && deadline > now) ||
      (statusFilter === 'expired' && deadline <= now);

    return matchesSearch && matchesSubject && matchesStatus;
  });

  const getStatusBadge = (deadline) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (dueDate < now) {
      return {
        text: 'Expired',
        className: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      };
    } else if (daysLeft <= 2) {
      return {
        text: `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'
      };
    } else if (daysLeft <= 5) {
      return {
        text: `Due in ${daysLeft} days`,
        className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
      };
    } else {
      return {
        text: `Due in ${daysLeft} days`,
        className: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      };
    }
  };

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Assignments</h1>
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
          <button
            onClick={handleAddAssignment}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Assignment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Total Assignments</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Active Assignments</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <XCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
              Expired
            </span>
          </div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Expired Assignments</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expired}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <UsersIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400">Total Submissions</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSubmissions}</p>
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
                placeholder="Search assignments by title or description..."
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
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
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
              <option value="active">Active</option>
              <option value="expired">Expired</option>
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
                : 'Create your first assignment to get started'}
            </p>
            {!searchTerm && subjectFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={handleAddAssignment}
                className="mt-4 btn-primary inline-flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Create Assignment
              </button>
            )}
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const status = getStatusBadge(assignment.deadline);
            const submissionCount = assignment.submissions?.length || 0;
            const pendingCount = assignment.submissions?.filter(s => s?.status === 'submitted').length || 0;
            const gradedCount = assignment.submissions?.filter(s => s?.status === 'graded').length || 0;

            return (
              <div
                key={assignment._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-800 transition-all"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left side - Assignment Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${status.className}`}>
                          {status.text}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {assignment.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <DocumentTextIcon className="h-4 w-4" />
                          {assignment.subject?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          Due: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-4 w-4" />
                          {submissionCount} submissions
                        </span>
                        <span className="text-primary-600 dark:text-primary-400 font-medium">
                          Max Marks: {assignment.maxMarks}
                        </span>
                      </div>
                    </div>

                    {/* Right side - Stats and Actions */}
                    <div className="flex items-center gap-4">
                      {/* Submission Progress */}
                      {submissionCount > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {pendingCount} Pending · {gradedCount} Graded
                          </div>
                          <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                            <div 
                              className="h-1.5 bg-green-500 dark:bg-green-400 rounded-full"
                              style={{ width: `${(gradedCount / submissionCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(assignment)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditAssignment(assignment)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="Edit Assignment"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(assignment._id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Assignment"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assignment Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={modalMode === 'add' ? 'Create New Assignment' : 'Edit Assignment'}
        size="lg"
      >
        <AssignmentForm
          assignment={editingAssignment}
          subjects={subjects}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </Modal>

      {/* Assignment Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={handleDetailsModalClose}
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
                  {selectedAssignment.subject?.name} · Due: {selectedAssignment.deadline ? new Date(selectedAssignment.deadline).toLocaleDateString() : 'N/A'}
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Marks</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAssignment.maxMarks}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Submissions</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedAssignment.submissions?.length || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pending Grading</p>
                <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  {selectedAssignment.submissions?.filter(s => s?.status === 'submitted').length || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Graded</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {selectedAssignment.submissions?.filter(s => s?.status === 'graded').length || 0}
                </p>
              </div>
            </div>

            {/* Submission List */}
            {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Submissions</h3>
                <div className="space-y-2">
                  {selectedAssignment.submissions.slice(0, 5).map((submission) => (
                    <div key={submission._id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">
                            {submission.student?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {submission.student?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          submission.status === 'graded' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        }`}>
                          {submission.status || 'Submitted'}
                        </span>
                        {submission.marks && (
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {submission.marks}/{selectedAssignment.maxMarks}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedAssignment.submissions.length > 5 && (
                  <Link
                    to={`/teacher/submissions?assignment=${selectedAssignment._id}`}
                    className="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 inline-flex items-center"
                    onClick={handleDetailsModalClose}
                  >
                    View all {selectedAssignment.submissions.length} submissions
                  </Link>
                )}
              </div>
            )}

            {/* Attachment - FIXED with proper URL handling */}
            {selectedAssignment.fileUrl && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <a
                  href={getFileUrl(selectedAssignment.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium inline-flex items-center"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  View Assignment File
                </a>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to={`/teacher/submissions?assignment=${selectedAssignment._id}`}
                className="btn-primary"
                onClick={handleDetailsModalClose}
              >
                Grade Submissions
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TeacherAssignments;