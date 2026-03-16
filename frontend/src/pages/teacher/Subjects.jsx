import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpenIcon,
  AcademicCapIcon,
  UsersIcon,
  ClockIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const TeacherSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [subjectStats, setSubjectStats] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching teacher subjects...');
      
      const response = await api.get('/subjects/teacher');
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubjects();
    setRefreshing(false);
    toast.success('Subjects refreshed');
  };
const handleViewDetails = async (subject) => {
  setSelectedSubject(subject);
  
  // Just set default stats without trying to fetch
  setSubjectStats({
    totalAssignments: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    avgScore: 0
  });
  
  setShowDetailsModal(true);
};

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedSubject(null);
    setSubjectStats(null);
  };

  const filteredSubjects = subjects.filter(subject => 
    subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            You are teaching {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
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

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search subjects by name, code, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <BookOpenIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No subjects found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search' : 'You haven\'t been assigned any subjects yet'}
            </p>
          </div>
        ) : (
          filteredSubjects.map((subject) => (
            <div
              key={subject._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-800 transition-all cursor-pointer group"
              onClick={() => handleViewDetails(subject)}
            >
              <div className="p-6">
                {/* Header with icon and code */}
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

                {/* Department and Semester */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Department:</span>{' '}
                    {subject.department?.name || 'N/A'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSemesterColor(subject.semester)}`}>
                      Semester {subject.semester}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getCreditColor(subject.credits)}`}>
                      {subject.credits} Credits
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {subject.assignmentCount || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Assignments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {subject.studentCount || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {subject.pendingSubmissions || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
                  </div>
                </div>

                {/* Footer with view details link */}
                <div className="mt-4 flex justify-end">
                  <span className="text-sm text-primary-600 dark:text-primary-400 group-hover:text-primary-800 dark:group-hover:text-primary-300 flex items-center gap-1">
                    View Details
                    <ChevronRightIcon className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          ))
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
            {/* Header with icon and code */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <BookOpenIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedSubject.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Code: {selectedSubject.code}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Department</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedSubject.department?.name || 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Semester</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Semester {selectedSubject.semester}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credits</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedSubject.credits} Credits
                </p>
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

            {/* Stats Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Subject Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-800">
                  <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{subjectStats?.totalAssignments || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Assignments</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center border border-green-100 dark:border-green-800">
                  <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{subjectStats?.totalStudents || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-center border border-yellow-100 dark:border-yellow-800">
                  <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{subjectStats?.pendingSubmissions || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center border border-purple-100 dark:border-purple-800">
                  <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{subjectStats?.avgScore || 0}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Score</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={`/teacher/assignments?subject=${selectedSubject._id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group"
                  onClick={handleCloseModal}
                >
                  <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Assignments</span>
                </Link>
                <Link
                  to={`/teacher/submissions?subject=${selectedSubject._id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group"
                  onClick={handleCloseModal}
                >
                  <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Submissions</span>
                </Link>
                <Link
                  to={`/teacher/notes/upload?subject=${selectedSubject._id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group"
                  onClick={handleCloseModal}
                >
                  <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Upload Notes</span>
                </Link>
                <Link
                  to={`/teacher/quizzes/create?subject=${selectedSubject._id}`}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group"
                  onClick={handleCloseModal}
                >
                  <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Create Quiz</span>
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
    </div>
  );
};

export default TeacherSubjects;