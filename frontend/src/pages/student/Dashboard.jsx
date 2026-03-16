import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpenIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notes, setNotes] = useState([]);
  const [apiErrors, setApiErrors] = useState({});
  const [stats, setStats] = useState({
    totalSubjects: 0,
    pendingAssignments: 0,
    completedAssignments: 0,
    upcomingQuizzes: 0,
    averageScore: 0,
    attendance: 0
  });

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    const errors = {};
    
    try {
      // Fetch subjects first
      let subjectsData = [];
      try {
        const subjectsResponse = await api.get('/subjects/student');
        
        // Handle different response structures
        if (subjectsResponse.data) {
          if (Array.isArray(subjectsResponse.data)) {
            subjectsData = subjectsResponse.data;
          } else if (subjectsResponse.data.data && Array.isArray(subjectsResponse.data.data)) {
            subjectsData = subjectsResponse.data.data;
          } else if (subjectsResponse.data.subjects && Array.isArray(subjectsResponse.data.subjects)) {
            subjectsData = subjectsResponse.data.subjects;
          } else if (subjectsResponse.data.enrolledSubjects && Array.isArray(subjectsResponse.data.enrolledSubjects)) {
            subjectsData = subjectsResponse.data.enrolledSubjects;
          }
        }
        
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        errors.subjects = error.message;
        toast.error('Failed to load subjects');
      }

      // Fetch other data
      const fetchPromises = [
        { name: 'assignments', promise: api.get('/assignments/student') },
        { name: 'quizzes', promise: api.get('/quizzes/student') },
        { name: 'schedule', promise: api.get('/schedule/student') },
        { name: 'notes', promise: api.get('/notes/recent') },
        { name: 'stats', promise: api.get('/student/stats') }
      ];

      const results = await Promise.allSettled(
        fetchPromises.map(item => item.promise)
      );

      // Process each result
      let assignmentsData = [];
      let quizzesData = [];
      let scheduleData = [];
      let notesData = [];
      let statsData = {};

      results.forEach((result, index) => {
        const { name } = fetchPromises[index];
        
        if (result.status === 'fulfilled') {
          let data = [];
          if (result.value.data) {
            if (Array.isArray(result.value.data)) {
              data = result.value.data;
            } else if (result.value.data.data && Array.isArray(result.value.data.data)) {
              data = result.value.data.data;
            } else if (result.value.data[name] && Array.isArray(result.value.data[name])) {
              data = result.value.data[name];
            }
          }
          
          switch(name) {
            case 'assignments':
              assignmentsData = data;
              setAssignments(data);
              break;
            case 'quizzes':
              quizzesData = data;
              setQuizzes(data);
              break;
            case 'schedule':
              scheduleData = data;
              setSchedule(data);
              break;
            case 'notes':
              notesData = data;
              setNotes(data.slice(0, 5));
              break;
            case 'stats':
              statsData = result.value.data;
              setStats(prev => ({ ...prev, ...result.value.data }));
              break;
          }
        } else {
          console.error(`Error fetching ${name}:`, result.reason);
          errors[name] = result.reason.message;
        }
      });

      setApiErrors(errors);

      // Calculate additional stats using the data we just got
      const pendingCount = assignmentsData.filter(a => a?.status === 'pending').length;
      const completedCount = assignmentsData.filter(a => a?.status === 'submitted' || a?.status === 'graded').length;
      
      const upcomingQuizzes = quizzesData.filter(q => new Date(q?.startDate) > new Date()).length;

      const gradedAssignments = assignmentsData.filter(a => a?.marks != null);
      const avgScore = gradedAssignments.length > 0
        ? Math.round(gradedAssignments.reduce((acc, a) => acc + a.marks, 0) / gradedAssignments.length)
        : 0;

      // Get subjects count from subjectsData we already have
      const subjectsCount = subjectsData.length;

      setStats(prev => ({
        ...prev,
        totalSubjects: subjectsCount,
        pendingAssignments: pendingCount,
        completedAssignments: completedCount,
        upcomingQuizzes: upcomingQuizzes,
        averageScore: avgScore,
      }));

    } catch (error) {
      console.error('Failed to fetch student data:', error);
      toast.error('Some data could not be loaded');
    } finally {
      setLoading(false);
    }
  };

  const upcomingDeadlines = assignments
    .filter(a => a?.status === 'pending' && new Date(a?.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = schedule.filter(s => s?.day === today) || [];

  const availableQuizzes = quizzes
    .filter(q => new Date(q?.endDate) >= new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 3);

  const totalAssignments = stats.pendingAssignments + stats.completedAssignments;
  const progressPercentage = totalAssignments > 0
    ? Math.round((stats.completedAssignments / totalAssignments) * 100)
    : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-primary-100 dark:text-primary-200">
              Enrollment: {user?.enrollmentNumber} | Semester {user?.semester} | {user?.department?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/student/schedule"
              className="bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <CalendarIcon className="h-5 w-5" />
              View Schedule
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <BookOpenIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSubjects}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled Subjects</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingAssignments}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Assignments</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircleIcon className="h-8 w-8 text-green-500 dark:text-green-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedAssignments}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <AcademicCapIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingQuizzes}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Quizzes</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}%</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <UserGroupIcon className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.attendance}%</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Attendance</p>
        </div>
      </div>

      {/* Show message if no subjects */}
      {subjects.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <BellAlertIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-yellow-700 dark:text-yellow-300">
              No subjects found. Please check your enrollment or contact your administrator.
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Semester Progress</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">Week 8 of 16</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-primary-600 dark:bg-primary-500 rounded-full h-2.5"
            style={{ width: '50%' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Start: Jan 15, 2024</span>
          <span>End: May 15, 2024</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule - FIXED */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Today's Schedule ({today})
            </h2>
            <Link
              to="/student/schedule"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View Full Schedule
              <ArrowTrendingUpIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {todaySchedule.length > 0 ? (
              todaySchedule.map((item, index) => {
                // Get subject name from object
                const subjectName = item.subject?.name || item.subjectId?.name || 'Unknown Subject';
                const teacherName = item.teacher?.name || item.teacher || 'TBA';
                const room = item.room || 'TBA';
                const timeDisplay = item.time || `${item.startTime || ''} - ${item.endTime || ''}`;
                
                return (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                          <BookOpenIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{subjectName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {teacherName} • Room {room}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{timeDisplay}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p>No classes scheduled for today</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Enjoy your day off!</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Deadlines</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((assignment) => {
                const daysLeft = Math.ceil((new Date(assignment.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={assignment._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{assignment.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.subject?.name}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          daysLeft <= 2 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            : daysLeft <= 5
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        }`}>
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          Due: {new Date(assignment.deadline).toLocaleDateString()}
                        </span>
                        <Link
                          to={`/student/assignments/${assignment._id}`}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <CheckCircleSolid className="h-12 w-12 mx-auto text-green-400 dark:text-green-500/60 mb-3" />
                <p>All caught up!</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No pending assignments</p>
              </div>
            )}
          </div>
          {upcomingDeadlines.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-center rounded-b-lg">
              <Link
                to="/student/assignments"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
              >
                View All Assignments
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Subjects */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Subjects</h2>
            <Link
              to="/student/subjects"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View All
              <ArrowTrendingUpIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {subjects.length > 0 ? (
              subjects.slice(0, 4).map((subject) => (
                <div
                  key={subject._id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-800 transition-all group cursor-pointer bg-white dark:bg-gray-800"
                  onClick={() => window.location.href = `/student/subjects/${subject._id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg group-hover:scale-110 transition-transform">
                      <BookOpenIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{subject.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{subject.code}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                          Semester {subject.semester}
                        </span>
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                          {subject.credits} Credits
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
                <BookOpenIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p>No subjects enrolled yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Contact your administrator to enroll in subjects</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Quizzes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available Quizzes</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {availableQuizzes.length > 0 ? (
              availableQuizzes.map((quiz) => {
                const now = new Date();
                const startDate = new Date(quiz.startDate);
                const endDate = new Date(quiz.endDate);
                const isActive = startDate <= now && endDate >= now;
                const timeLeft = isActive 
                  ? Math.ceil((endDate - now) / (1000 * 60))
                  : Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={quiz._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-white">{quiz.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isActive 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        }`}>
                          {isActive ? 'Active Now' : `Starts in ${timeLeft} days`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{quiz.subject?.name}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-4 w-4" />
                          <span>{quiz.duration} minutes</span>
                        </div>
                        {isActive && (
                          <Link
                            to={`/student/quiz/${quiz._id}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
                          >
                            Start Quiz →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p>No quizzes available</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Materials */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recently Added Materials</h2>
          <Link
            to="/student/notes"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 flex items-center gap-1"
          >
            View All
            <ArrowTrendingUpIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-6">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div
                key={note._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-gray-800 transition-all group cursor-pointer bg-white dark:bg-gray-800"
                onClick={() => window.open(note.fileUrl, '_blank')}
              >
                <div className="flex flex-col items-center text-center">
                  <DocumentTextIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{note.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note.subject?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              <p>No materials available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-100 dark:border-purple-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assignment Completion</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{progressPercentage}%</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className="bg-green-500 dark:bg-green-400 rounded-full h-1.5"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Quiz Performance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageScore}%</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-500 dark:bg-blue-400 rounded-full h-1.5"
                style={{ width: `${stats.averageScore}%` }}
              />
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Attendance Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.attendance}%</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className="bg-purple-500 dark:bg-purple-400 rounded-full h-1.5"
                style={{ width: `${stats.attendance}%` }}
              />
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Overall Grade</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.averageScore >= 90 ? 'A' :
               stats.averageScore >= 80 ? 'B' :
               stats.averageScore >= 70 ? 'C' :
               stats.averageScore >= 60 ? 'D' : 'F'}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Based on {stats.completedAssignments} assignments
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/student/assignments"
            className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
          >
            <ClipboardDocumentListIcon className="h-8 w-8 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-700 dark:group-hover:text-primary-400">View Assignments</span>
          </Link>

          <Link
            to="/student/notes"
            className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
          >
            <DocumentTextIcon className="h-8 w-8 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-700 dark:group-hover:text-primary-400">Study Materials</span>
          </Link>

          <Link
            to="/student/quizzes"
            className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
          >
            <AcademicCapIcon className="h-8 w-8 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-700 dark:group-hover:text-primary-400">Take a Quiz</span>
          </Link>

          <Link
            to="/student/schedule"
            className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
          >
            <CalendarIcon className="h-8 w-8 text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-700 dark:group-hover:text-primary-400">My Schedule</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;