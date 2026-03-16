import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  BookOpenIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  UsersIcon,
  ClockIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import SubjectForm from '../../components/forms/SubjectForm';
import toast from 'react-hot-toast';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching subjects...');
      
      const response = await api.get('/subjects');
      console.log('Subjects response:', response.data);
      
      if (Array.isArray(response.data)) {
        setSubjects(response.data);
      } else if (response.data.subjects && Array.isArray(response.data.subjects)) {
        setSubjects(response.data.subjects);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setSubjects(response.data.data);
      } else {
        setSubjects([]);
      }
      
      setError('');
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      setError('Failed to load subjects');
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      
      if (Array.isArray(response.data)) {
        setDepartments(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setDepartments(response.data.data);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubjects();
    setRefreshing(false);
    toast.success('Subjects refreshed');
  };

  const handleAddSubject = () => {
    setEditingSubject(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleViewDetails = (subject) => {
    setSelectedSubject(subject);
    setShowDetailsModal(true);
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject? This action cannot be undone.')) return;

    try {
      await api.delete(`/subjects/${subjectId}`);
      toast.success('Subject deleted successfully');
      fetchSubjects();
    } catch (error) {
      console.error('Failed to delete subject:', error);
      toast.error(error.response?.data?.message || 'Failed to delete subject');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSubject(null);
  };

  const handleDetailsModalClose = () => {
    setShowDetailsModal(false);
    setSelectedSubject(null);
  };

  const handleModalSuccess = () => {
    fetchSubjects();
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = 
      subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || subject.department?._id === departmentFilter;
    const matchesSemester = semesterFilter === 'all' || subject.semester?.toString() === semesterFilter;
    
    return matchesSearch && matchesDepartment && matchesSemester;
  });

  const semesters = [...new Set(subjects.map(s => s.semester).filter(Boolean))].sort((a, b) => a - b);

  const getCreditBadgeColor = (credits) => {
    if (credits <= 2) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    if (credits <= 3) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
    if (credits <= 4) return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400';
    return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
  };

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Manage Subjects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''}
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
            onClick={handleAddSubject}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Subject
          </button>
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
                placeholder="Search by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BookOpenIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No subjects found</h3>
            <p className="text-gray-500 dark:text-gray-400">Get started by adding your first subject</p>
            <button
              onClick={handleAddSubject}
              className="mt-4 btn-primary inline-flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Subject
            </button>
          </div>
        ) : (
          filteredSubjects.map((subject) => (
            <div
              key={subject._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleViewDetails(subject)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <BookOpenIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Code: {subject.code}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCreditBadgeColor(subject.credits)}`}>
                    {subject.credits} Credits
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {subject.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <AcademicCapIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium">Semester {subject.semester}</span>
                  </div>

                  {subject.teacher && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <UsersIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                      <span>{subject.teacher.name}</span>
                    </div>
                  )}

                  {subject.department && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Department: {subject.department.name}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSubject(subject);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="Edit Subject"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubject(subject._id);
                    }}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Subject"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Subject Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={modalMode === 'add' ? 'Add New Subject' : 'Edit Subject'}
        size="lg"
      >
        <SubjectForm
          subject={editingSubject}
          departments={departments}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      </Modal>

      {/* Subject Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={handleDetailsModalClose}
        title="Subject Details"
        size="lg"
      >
        {selectedSubject && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <BookOpenIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Code: {selectedSubject.code}</p>
              </div>
              <div className="ml-auto">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getCreditBadgeColor(selectedSubject.credits)}`}>
                  {selectedSubject.credits} Credits
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Semester</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Semester {selectedSubject.semester}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Department</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedSubject.department?.name || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Teacher</p>
                <div className="flex items-center">
                  <UsersIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedSubject.teacher?.name || 'Not Assigned'}
                  </p>
                </div>
                {selectedSubject.teacher && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedSubject.teacher.email}</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedSubject.isActive 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                }`}>
                  {selectedSubject.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Description */}
            {selectedSubject.description && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  {selectedSubject.description}
                </p>
              </div>
            )}

            {/* Syllabus */}
            {selectedSubject.syllabus && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Syllabus</h3>
                <a
                  href={selectedSubject.syllabus}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium inline-flex items-center"
                >
                  View Syllabus <ChevronRightIcon className="h-4 w-4 ml-1" />
                </a>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div>
                <p>Created: {new Date(selectedSubject.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p>Last Updated: {new Date(selectedSubject.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  handleDetailsModalClose();
                  handleEditSubject(selectedSubject);
                }}
                className="btn-primary"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Subject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageSubjects;