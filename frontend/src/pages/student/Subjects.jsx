import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpenIcon,
  AcademicCapIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CalendarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const StudentSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [subjectStats, setSubjectStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [allAssignments, setAllAssignments] = useState([]);

  useEffect(() => {
    fetchSubjects();
    fetchAllAssignments();
  }, []);

  const fetchAllAssignments = async () => {
    try {
      const response = await api.get('/assignments/student');
      console.log('All assignments response:', response.data);
      
      let assignmentsData = [];
      if (Array.isArray(response.data)) {
        assignmentsData = response.data;
      } else if (response.data?.assignments && Array.isArray(response.data.assignments)) {
        assignmentsData = response.data.assignments;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        assignmentsData = response.data.data;
      }
      
      setAllAssignments(assignmentsData);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching student subjects...');
      
      const response = await api.get('/subjects/student');
      console.log('Subjects response:', response.data);
      
      let subjectsData = [];
      if (Array.isArray(response.data)) {
        subjectsData = response.data;
      } else if (response.data?.subjects && Array.isArray(response.data.subjects)) {
        subjectsData = response.data.subjects;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        subjectsData = response.data.data;
      }
      
      setSubjects(subjectsData);
      
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for a subject from assignments
  const calculateSubjectStats = (subjectId) => {
    // Filter assignments for this subject
    const subjectAssignments = allAssignments.filter(a => 
      a?.subject?._id === subjectId || a?.subject === subjectId
    );
    
    console.log(`Assignments for subject ${subjectId}:`, subjectAssignments);
    
    const pendingCount = subjectAssignments.filter(a => a?.status === 'pending').length;
    const completedCount = subjectAssignments.filter(a => a?.status === 'submitted' || a?.status === 'graded').length;
    const totalCount = subjectAssignments.length;
    
    const gradedAssignments = subjectAssignments.filter(a => a?.marks != null);
    const avgScore = gradedAssignments.length > 0
      ? Math.round(gradedAssignments.reduce((acc, a) => acc + a.marks, 0) / gradedAssignments.length)
      : 0;
    
    const bestScore = gradedAssignments.length > 0
      ? Math.max(...gradedAssignments.map(a => a.marks))
      : 0;
    
    const completionRate = totalCount > 0 
      ? Math.round((completedCount / totalCount) * 100) 
      : 0;
    
    return {
      totalAssignments: totalCount,
      pendingAssignments: pendingCount,
      completedAssignments: completedCount,
      averageScore: avgScore,
      bestScore: bestScore,
      completionRate: completionRate
    };
  };

  // Update stats whenever allAssignments or subjects change
  useEffect(() => {
    if (allAssignments.length > 0 && subjects.length > 0) {
      const newStats = {};
      subjects.forEach(subject => {
        if (subject?._id) {
          newStats[subject._id] = calculateSubjectStats(subject._id);
        }
      });
      console.log('Calculated stats:', newStats);
      setSubjectStats(newStats);
    }
  }, [allAssignments, subjects]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubjects();
    await fetchAllAssignments();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleViewDetails = (subject) => {
    setSelectedSubject(subject);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedSubject(null);
  };

  const filteredSubjects = subjects
    .filter(subject => 
      subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject?.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'code') {
        return (a.code || '').localeCompare(b.code || '');
      } else if (sortBy === 'progress') {
        const progressA = subjectStats[a?._id]?.completionRate || 0;
        const progressB = subjectStats[b?._id]?.completionRate || 0;
        return progressB - progressA;
      }
      return 0;
    });

  const getSemesterColor = (semester) => {
    const colors = [
      'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400',
      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
      'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
    ];
    return colors[(semester - 1) % colors.length];
  };

  const getCreditColor = (credits) => {
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Subjects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You are enrolled in {subjects.length} subject{subjects.length !== 1 ? 's' : ''} for Semester {user?.semester}
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

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search subjects by name, code, or teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Code</option>
              <option value="progress">Sort by Progress</option>
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
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search' : 'You are not enrolled in any subjects yet'}
            </p>
          </div>
        ) : (
          filteredSubjects.map((subject) => {
            const stats = subjectStats[subject._id] || {
              completionRate: 0,
              pendingAssignments: 0,
              averageScore: 0,
              totalAssignments: 0,
              completedAssignments: 0,
              bestScore: 0
            };
            
            return (
              <div
                key={subject._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-800 transition-all cursor-pointer group"
                onClick={() => handleViewDetails(subject)}
              >
                <div className="p-6">
                  {/* Header with Icon and Code */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg group-hover:scale-110 transition-transform">
                        <BookOpenIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{subject.code}</p>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {subject.teacher?.name || 'No teacher assigned'}
                    </p>
                  </div>

                  {/* Semester and Credits */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSemesterColor(subject.semester)}`}>
                      Semester {subject.semester}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getCreditColor(subject.credits)}`}>
                      {subject.credits} Credits
                    </span>
                  </div>

                  {/* Progress Stats */}
                  <div className="space-y-3">
                    {/* Completion Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{stats.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 dark:bg-primary-500 rounded-full h-2 transition-all duration-300"
                          style={{ width: `${stats.completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stats.pendingAssignments}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stats.averageScore}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            star <= Math.round((stats.averageScore || 0) / 20) ? (
                              <StarIconSolid key={star} className="h-4 w-4 text-yellow-400 dark:text-yellow-500" />
                            ) : (
                              <StarIcon key={star} className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                            )
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rating</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer with View Details */}
                  <div className="mt-4 flex justify-end">
                    <span className="text-sm text-primary-600 dark:text-primary-400 group-hover:text-primary-800 dark:group-hover:text-primary-300 flex items-center gap-1">
                      View Details
                      <ChevronRightIcon className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Subject Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={handleCloseModal}
        title={selectedSubject?.name}
        size="lg"
      >
        {selectedSubject && (
          <div className="space-y-6">
            {/* Header with Icon */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <BookOpenIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Code: {selectedSubject.code}</p>
              </div>
              <div className="ml-auto">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getSemesterColor(selectedSubject.semester)}`}>
                  Semester {selectedSubject.semester}
                </span>
              </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-800">
                <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedSubject.credits}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Credits</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center border border-green-100 dark:border-green-800">
                <UserIcon className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedSubject.teacher?.name || 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Teacher</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center border border-purple-100 dark:border-purple-800">
                <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {subjectStats[selectedSubject._id]?.totalAssignments || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center border border-yellow-100 dark:border-yellow-800">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {subjectStats[selectedSubject._id]?.pendingAssignments || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              </div>
            </div>

            {/* Description */}
            {selectedSubject.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  {selectedSubject.description}
                </p>
              </div>
            )}

            {/* Detailed Stats */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Your Performance</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {subjectStats[selectedSubject._id]?.completionRate || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-primary-600 dark:bg-primary-500 rounded-full h-2.5"
                      style={{ width: `${subjectStats[selectedSubject._id]?.completionRate || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {subjectStats[selectedSubject._id]?.averageScore || 0}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Best Score</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {subjectStats[selectedSubject._id]?.bestScore || 0}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Assignments Done</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-500">
                      {subjectStats[selectedSubject._id]?.completedAssignments || 0}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800">
                    <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-500">
                      {subjectStats[selectedSubject._id]?.pendingAssignments || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={`/student/assignments?subject=${selectedSubject._id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group"
                  onClick={handleCloseModal}
                >
                  <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">View Assignments</span>
                </Link>
                <Link
                  to={`/student/notes?subject=${selectedSubject._id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group"
                  onClick={handleCloseModal}
                >
                  <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Study Materials</span>
                </Link>
                <Link
                  to={`/student/schedule?subject=${selectedSubject._id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group"
                  onClick={handleCloseModal}
                >
                  <CalendarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Class Schedule</span>
                </Link>
                <Link
                  to={`/student/quizzes?subject=${selectedSubject._id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group"
                  onClick={handleCloseModal}
                >
                  <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Take Quiz</span>
                </Link>
              </div>
            </div>

            {/* Syllabus Link */}
            {selectedSubject.syllabus && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
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
          </div>
        )}
      </Modal>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-primary-100 dark:border-primary-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Academic Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Credits</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {subjects.reduce((acc, s) => acc + (s.credits || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Object.values(subjectStats).reduce((acc, s) => acc + (s.completedAssignments || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {Object.values(subjectStats).reduce((acc, s) => acc + (s.pendingAssignments || 0), 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overall Average</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {Math.round(
                Object.values(subjectStats).reduce((acc, s) => acc + (s.averageScore || 0), 0) / 
                (Object.values(subjectStats).length || 1)
              )}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSubjects;