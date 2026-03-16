import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  AcademicCapIcon,
  ClockIcon,
  CalendarIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmationModal from '../../components/ConfirmationModal';
import toast from 'react-hot-toast';

const StudentQuizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [showHideModal, setShowHideModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [hiding, setHiding] = useState(false);
  const [hiddenQuizzes, setHiddenQuizzes] = useState(() => {
    const saved = localStorage.getItem('hiddenQuizzes');
    return saved ? JSON.parse(saved) : [];
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    expired: 0,
    completed: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('hiddenQuizzes', JSON.stringify(hiddenQuizzes));
  }, [hiddenQuizzes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [quizzesRes, subjectsRes] = await Promise.all([
        api.get('/quizzes/student'),
        api.get('/subjects/student')
      ]);

      console.log('Quizzes response:', quizzesRes.data);
      console.log('Subjects response:', subjectsRes.data);

      // Extract quizzes data
      let quizzesData = [];
      if (quizzesRes.data) {
        if (Array.isArray(quizzesRes.data)) {
          quizzesData = quizzesRes.data;
        } else if (quizzesRes.data.data && Array.isArray(quizzesRes.data.data)) {
          quizzesData = quizzesRes.data.data;
        } else if (quizzesRes.data.quizzes && Array.isArray(quizzesRes.data.quizzes)) {
          quizzesData = quizzesRes.data.quizzes;
        }
      }

      // Process quizzes - REMOVED the subject override
      quizzesData = quizzesData.map(quiz => ({
        ...quiz,
        completed: quiz.completed || quiz.submitted || false
      }));

      console.log('Processed quizzes:', quizzesData);
      setQuizzes(quizzesData);

      // Extract subjects data
      let subjectsData = [];
      if (subjectsRes.data) {
        if (Array.isArray(subjectsRes.data)) {
          subjectsData = subjectsRes.data;
          console.log('Subjects is array:', subjectsData);
        } else if (subjectsRes.data.data && Array.isArray(subjectsRes.data.data)) {
          subjectsData = subjectsRes.data.data;
          console.log('Subjects in data.data:', subjectsData);
        } else if (subjectsRes.data.subjects && Array.isArray(subjectsRes.data.subjects)) {
          subjectsData = subjectsRes.data.subjects;
          console.log('Subjects in subjects:', subjectsData);
        } else if (subjectsRes.data.enrolledSubjects && Array.isArray(subjectsRes.data.enrolledSubjects)) {
          subjectsData = subjectsRes.data.enrolledSubjects;
          console.log('Subjects in enrolledSubjects:', subjectsData);
        }
      }
      console.log('Final subjects data:', subjectsData);
      setSubjects(subjectsData);

      // Calculate stats for visible quizzes
      const visibleQuizzes = quizzesData.filter(q => !hiddenQuizzes.includes(q._id));
      
      const now = new Date();
      const active = visibleQuizzes.filter(q => {
        if (!q.startDate || !q.endDate || q.completed) return false;
        const start = new Date(q.startDate);
        const end = new Date(q.endDate);
        return now >= start && now <= end;
      }).length;
      
      const upcoming = visibleQuizzes.filter(q => {
        if (!q.startDate || q.completed) return false;
        const start = new Date(q.startDate);
        return now < start;
      }).length;
      
      const expired = visibleQuizzes.filter(q => {
        if (!q.endDate || q.completed) return false;
        const end = new Date(q.endDate);
        return now > end;
      }).length;

      const completed = visibleQuizzes.filter(q => q.completed === true).length;

      setStats({
        total: visibleQuizzes.length,
        active,
        upcoming,
        expired,
        completed
      });

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Quizzes refreshed');
  };

  const handleHideClick = (quiz) => {
    setSelectedQuiz(quiz);
    setShowHideModal(true);
  };

  const handleHideQuiz = () => {
    if (!selectedQuiz) return;
    setHiding(true);
    setHiddenQuizzes(prev => [...prev, selectedQuiz._id]);
    toast.success('Quiz hidden from view');
    setShowHideModal(false);
    setHiding(false);
    setSelectedQuiz(null);
  };

  const handleShowAll = () => {
    setHiddenQuizzes([]);
    toast.success('All quizzes are now visible');
  };

  const getQuizStatus = (quiz) => {
    if (!quiz.startDate || !quiz.endDate) {
      return { 
        status: 'unknown', 
        text: 'Unknown', 
        color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400' 
      };
    }

    if (quiz.completed) {
      return { 
        status: 'completed', 
        text: 'Completed', 
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
        icon: CheckCircleSolid
      };
    }

    const now = new Date();
    const start = new Date(quiz.startDate);
    const end = new Date(quiz.endDate);

    if (now < start) {
      const days = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return { 
        status: 'upcoming', 
        text: `Starts in ${days} ${days === 1 ? 'day' : 'days'}`, 
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' 
      };
    } else if (now > end) {
      return { 
        status: 'expired', 
        text: 'Expired', 
        color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400' 
      };
    } else {
      const hours = Math.ceil((end - now) / (1000 * 60 * 60));
      return { 
        status: 'active', 
        text: `${hours} ${hours === 1 ? 'hour' : 'hours'} left`, 
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
      };
    }
  };

  // Apply filters
  const filteredQuizzes = quizzes
    .filter(quiz => !hiddenQuizzes.includes(quiz._id))
    .filter(quiz => {
      // Search filter - FIXED to use subjectId?.name
      const matchesSearch = searchTerm === '' || 
        quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quiz.subjectId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quiz.subject?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      // Subject filter - FIXED to check both subject and subjectId
      const matchesSubject = subjectFilter === 'all' || 
        quiz.subject?._id === subjectFilter || 
        quiz.subjectId?._id === subjectFilter;
      
      // Status filter
      const now = new Date();
      const start = new Date(quiz.startDate);
      const end = new Date(quiz.endDate);
      
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = !quiz.completed && now >= start && now <= end;
      } else if (statusFilter === 'upcoming') {
        matchesStatus = !quiz.completed && now < start;
      } else if (statusFilter === 'expired') {
        matchesStatus = !quiz.completed && now > end;
      } else if (statusFilter === 'completed') {
        matchesStatus = quiz.completed === true;
      }

      return matchesSearch && matchesSubject && matchesStatus;
    });

  // Apply sorting - FIXED to use subject or subjectId
  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.endDate) - new Date(b.endDate);
    } else if (sortBy === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'subject') {
      const aName = a.subject?.name || a.subjectId?.name || '';
      const bName = b.subject?.name || b.subjectId?.name || '';
      return aName.localeCompare(bName);
    }
    return 0;
  });

  if (loading && !refreshing) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Quizzes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You have {stats.total} visible quiz{stats.total !== 1 ? 'zes' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {hiddenQuizzes.length > 0 && (
            <button
              onClick={handleShowAll}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <EyeSlashIcon className="h-4 w-4" />
              Show Hidden ({hiddenQuizzes.length})
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <AcademicCapIcon className="h-8 w-8 text-blue-500 dark:text-blue-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Visible</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <ClockIcon className="h-8 w-8 text-blue-500 dark:text-blue-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcoming}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <XCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expired}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by title, description, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="flex justify-end mt-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="title">Sort by Title</option>
            <option value="subject">Sort by Subject</option>
          </select>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="space-y-4">
        {sortedQuizzes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No quizzes found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || subjectFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'You have no quizzes yet'}
            </p>
          </div>
        ) : (
          sortedQuizzes.map((quiz) => {
            const status = getQuizStatus(quiz);
            const totalQuestions = quiz.questions?.length || 0;
            const totalMarks = quiz.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;

            // Get subject name - check both subject and subjectId
            const subjectName = quiz.subject?.name || quiz.subjectId?.name || 'Unknown Subject';

            return (
              <div
                key={quiz._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-800 transition-all"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{quiz.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                          {status.icon && <status.icon className="h-3 w-3 inline mr-1" />}
                          {status.text}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {quiz.description || 'No description provided'}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>📚 {subjectName}</span>
                        <span>⏱️ {quiz.duration} min</span>
                        <span>📝 {totalQuestions} questions</span>
                        <span>⭐ {totalMarks} marks</span>
                      </div>

                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>📅 Starts: {new Date(quiz.startDate).toLocaleDateString()}</span>
                        <span>⏰ Ends: {new Date(quiz.endDate).toLocaleDateString()}</span>
                      </div>

                      {quiz.completed && quiz.score !== undefined && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg inline-block">
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            Score: {quiz.score}/{totalMarks} ({Math.round((quiz.score/totalMarks)*100)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {status.status === 'active' && !quiz.completed && (
                        <Link
                          to={`/student/quiz/${quiz._id}`}
                          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                        >
                          Start Quiz
                        </Link>
                      )}
                      {status.status === 'upcoming' && (
                        <button disabled className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium">
                          Not Started
                        </button>
                      )}
                      {status.status === 'expired' && !quiz.completed && (
                        <>
                          <button disabled className="px-6 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium border">
                            Expired
                          </button>
                          <button
                            onClick={() => handleHideClick(quiz)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="Hide from view"
                          >
                            <EyeSlashIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      {status.status === 'completed' && (
                        <button disabled className="px-6 py-2 bg-green-100 text-green-700 rounded-lg font-medium border border-green-200">
                          Completed
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

      {/* Hide Modal */}
      <ConfirmationModal
        isOpen={showHideModal}
        onClose={() => {
          setShowHideModal(false);
          setSelectedQuiz(null);
        }}
        onConfirm={handleHideQuiz}
        title="Hide Quiz"
        message={`Are you sure you want to hide "${selectedQuiz?.title}" from your view?`}
        confirmText="Hide"
        cancelText="Cancel"
        isLoading={hiding}
        type="info"
      />
    </div>
  );
};

export default StudentQuizzes;