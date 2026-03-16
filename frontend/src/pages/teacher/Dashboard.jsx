import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpenIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ClockIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  CalendarIcon,
  PresentationChartLineIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [schedule, setSchedule] = useState([]); // New state for schedule
  const [todayClasses, setTodayClasses] = useState([]); // New state for today's classes
  const [nextClass, setNextClass] = useState(null); // New state for next class
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalAssignments: 0,
    totalQuizzes: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    gradedSubmissions: 0,
    lateSubmissions: 0,
    averageScore: 0,
    todayClasses: 0, // New stat
    weeklyClasses: 0 // New stat
  });

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      console.log('Fetching teacher data for user:', user?._id);
      
      // Fetch all data in parallel including schedule
      const [
        subjectsRes, 
        assignmentsRes, 
        quizzesRes, 
        assignmentSubmissionsRes,
        quizSubmissionsRes,
        studentsRes,
        scheduleRes // New schedule API call
      ] = await Promise.all([
        api.get('/subjects/teacher'),
        api.get('/assignments/teacher'),
        api.get('/quizzes/teacher'),
        api.get('/submissions/teacher').catch(() => ({ data: [] })),
        api.get('/quiz-submissions/teacher').catch(() => ({ data: { data: [] } })),
        api.get('/teacher/students').catch(() => ({ data: { data: [] } })),
        api.get('/schedule/teacher/my-schedule').catch(() => ({ data: { data: [] } })) // New schedule fetch
      ]);

      console.log('Subjects response:', subjectsRes.data);
      console.log('Assignments response:', assignmentsRes.data);
      console.log('Quizzes response:', quizzesRes.data);
      console.log('Assignment Submissions response:', assignmentSubmissionsRes.data);
      console.log('Quiz Submissions response:', quizSubmissionsRes.data);
      console.log('Students response:', studentsRes.data);
      console.log('Schedule response:', scheduleRes.data);

      // Process subjects
      const subjectsData = subjectsRes.data?.data || subjectsRes.data || [];
      setSubjects(subjectsData);

      // Process assignments
      const assignmentsData = assignmentsRes.data?.data || assignmentsRes.data || [];
      setAssignments(assignmentsData);

      // Process quizzes
      const quizzesData = quizzesRes.data?.data || quizzesRes.data || [];
      setQuizzes(quizzesData);

      // Process assignment submissions
      const assignmentSubsData = Array.isArray(assignmentSubmissionsRes.data) 
        ? assignmentSubmissionsRes.data 
        : assignmentSubmissionsRes.data?.submissions || [];
      setAssignmentSubmissions(assignmentSubsData);

      // Process quiz submissions
      const quizSubsData = quizSubmissionsRes.data?.data || [];
      setQuizSubmissions(quizSubsData);

      // Get total students from teacher/students endpoint
      const studentsData = studentsRes.data?.data || studentsRes.data || [];
      const totalStudents = studentsData.length;

      // Process schedule data
      let scheduleData = [];
      if (scheduleRes.data?.data && Array.isArray(scheduleRes.data.data)) {
        scheduleData = scheduleRes.data.data;
      } else if (Array.isArray(scheduleRes.data)) {
        scheduleData = scheduleRes.data;
      }
      setSchedule(scheduleData);

      // Calculate today's classes
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      
      const todayClassesData = scheduleData.filter(cls => cls?.day === today);
      setTodayClasses(todayClassesData);

      // Find next class
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

      const upcomingClasses = todayClassesData
        .filter(cls => cls?.startTime > currentTime)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      setNextClass(upcomingClasses[0] || null);

      // Calculate submission stats
      const assignmentPending = assignmentSubsData.filter(s => s?.status === 'submitted').length;
      const quizPending = quizSubsData.filter(s => !s.isFullyGraded).length;
      
      const assignmentGraded = assignmentSubsData.filter(s => s?.status === 'graded').length;
      const quizGraded = quizSubsData.filter(s => s.isFullyGraded).length;
      
      const assignmentLate = assignmentSubsData.filter(s => s?.status === 'late').length;

      const pendingSubmissions = assignmentPending + quizPending;
      const gradedSubmissions = assignmentGraded + quizGraded;
      const lateSubmissions = assignmentLate;

      // Calculate average score from graded submissions
      const allGradedSubmissions = [
        ...assignmentSubsData.filter(s => s.marks != null),
        ...quizSubsData.filter(s => s.totalMarksObtained != null).map(s => ({
          marks: (s.totalMarksObtained / s.totalMarks) * 100
        }))
      ];

      const avgScore = allGradedSubmissions.length > 0
        ? Math.round(allGradedSubmissions.reduce((acc, s) => acc + (s.marks || 0), 0) / allGradedSubmissions.length)
        : 0;

      setStats({
        totalSubjects: subjectsData.length,
        totalAssignments: assignmentsData.length,
        totalQuizzes: quizzesData.length,
        totalStudents,
        pendingSubmissions,
        gradedSubmissions,
        lateSubmissions,
        averageScore: avgScore,
        todayClasses: todayClassesData.length,
        weeklyClasses: scheduleData.length
      });

    } catch (error) {
      console.error('Failed to fetch teacher data:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(error.response.data?.message || 'Failed to load dashboard data');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const submissionStatusData = {
    labels: ['Graded', 'Pending', 'Late'],
    datasets: [
      {
        data: [stats.gradedSubmissions, stats.pendingSubmissions, stats.lateSubmissions],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }
    ]
  };

  const weeklyActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Submissions',
        data: [12, 19, 15, 22, 18, 8, 5],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#374151'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      },
      y: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      }
    }
  };

  // Updated statCards to include schedule stats
  const statCards = [
    {
      title: 'My Subjects',
      value: stats.totalSubjects,
      icon: BookOpenIcon,
      color: 'bg-blue-500',
      darkColor: 'dark:bg-blue-600',
      bgColor: 'bg-blue-50',
      darkBgColor: 'dark:bg-blue-900/30',
      textColor: 'text-blue-600',
      darkTextColor: 'dark:text-blue-400',
      link: '/teacher/subjects'
    },
    {
      title: 'Assignments',
      value: stats.totalAssignments,
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500',
      darkColor: 'dark:bg-green-600',
      bgColor: 'bg-green-50',
      darkBgColor: 'dark:bg-green-900/30',
      textColor: 'text-green-600',
      darkTextColor: 'dark:text-green-400',
      link: '/teacher/assignments'
    },
    {
      title: 'Quizzes',
      value: stats.totalQuizzes,
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      darkColor: 'dark:bg-purple-600',
      bgColor: 'bg-purple-50',
      darkBgColor: 'dark:bg-purple-900/30',
      textColor: 'text-purple-600',
      darkTextColor: 'dark:text-purple-400',
      link: '/teacher/quizzes'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: UsersIcon,
      color: 'bg-indigo-500',
      darkColor: 'dark:bg-indigo-600',
      bgColor: 'bg-indigo-50',
      darkBgColor: 'dark:bg-indigo-900/30',
      textColor: 'text-indigo-600',
      darkTextColor: 'dark:text-indigo-400',
      link: '/teacher/students'
    },
    {
      title: "Today's Classes",
      value: stats.todayClasses,
      icon: CalendarIcon,
      color: 'bg-orange-500',
      darkColor: 'dark:bg-orange-600',
      bgColor: 'bg-orange-50',
      darkBgColor: 'dark:bg-orange-900/30',
      textColor: 'text-orange-600',
      darkTextColor: 'dark:text-orange-400',
      link: '/teacher/schedule'
    },
    {
      title: 'Weekly Classes',
      value: stats.weeklyClasses,
      icon: PresentationChartLineIcon,
      color: 'bg-teal-500',
      darkColor: 'dark:bg-teal-600',
      bgColor: 'bg-teal-50',
      darkBgColor: 'dark:bg-teal-900/30',
      textColor: 'text-teal-600',
      darkTextColor: 'dark:text-teal-400',
      link: '/teacher/schedule'
    },
    {
      title: 'Pending Grading',
      value: stats.pendingSubmissions,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      darkColor: 'dark:bg-yellow-600',
      bgColor: 'bg-yellow-50',
      darkBgColor: 'dark:bg-yellow-900/30',
      textColor: 'text-yellow-600',
      darkTextColor: 'dark:text-yellow-400',
      link: '/teacher/submissions?status=pending'
    },
    {
      title: 'Avg Score',
      value: `${stats.averageScore}%`,
      icon: ChartBarIcon,
      color: 'bg-rose-500',
      darkColor: 'dark:bg-rose-600',
      bgColor: 'bg-rose-50',
      darkBgColor: 'dark:bg-rose-900/30',
      textColor: 'text-rose-600',
      darkTextColor: 'dark:text-rose-400',
      link: '/teacher/reports'
    }
  ];

  // Combine all submissions for recent submissions table
  const allSubmissions = [
    ...assignmentSubmissions.map(s => ({
      ...s,
      type: 'assignment',
      title: s.assignment?.title || 'Assignment',
      subjectName: s.assignment?.subject?.name || 'Unknown',
      studentName: s.student?.name || 'Unknown',
      studentEnrollment: s.student?.enrollmentNumber || 'N/A'
    })),
    ...quizSubmissions.map(s => ({
      ...s,
      type: 'quiz',
      title: s.quiz?.title || 'Quiz',
      subjectName: s.quiz?.subject?.name || 'Unknown',
      studentName: s.student?.name || 'Unknown',
      studentEnrollment: s.student?.enrollmentNumber || 'N/A'
    }))
  ].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const upcomingDeadlines = assignments
    .filter(a => new Date(a.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening with your courses today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/teacher/notes/upload"
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Upload Notes
          </Link>
          <Link
            to="/teacher/quizzes/create"
            className="btn-secondary flex items-center gap-2"
          >
            <AcademicCapIcon className="h-5 w-5" />
            Create Quiz
          </Link>
        </div>
      </div>

      {/* Next Class Alert */}
      {nextClass && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 dark:bg-green-700 rounded-full">
                <ClockIcon className="h-5 w-5 text-green-700 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-400">Next Class</p>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">
                  {nextClass.subject?.name || 'Class'}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-green-600 dark:text-green-500" />
                <span className="text-sm text-green-800 dark:text-green-300">
                  {nextClass.startTime} - {nextClass.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-green-600 dark:text-green-500" />
                <span className="text-sm text-green-800 dark:text-green-300">
                  Room {nextClass.room || 'TBA'}
                </span>
              </div>
              <Link
                to="/teacher/schedule"
                className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
              >
                View Schedule
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - 8 cards in 4x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md dark:hover:shadow-gray-800 transition-all hover:scale-105"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.darkBgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor} ${stat.darkTextColor}`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.bgColor} ${stat.darkBgColor} ${stat.textColor} ${stat.darkTextColor}`}>
                {typeof stat.value === 'number' ? stat.value : stat.value}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Today's Schedule Preview */}
      {todayClasses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Classes</h2>
            <Link
              to="/teacher/schedule"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
            >
              View Full Schedule
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayClasses.map((cls, idx) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {cls.subject?.name || 'Class'}
                  </h3>
                  <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400 px-2 py-1 rounded-full">
                    {cls.startTime} - {cls.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPinIcon className="h-4 w-4" />
                  <span>Room {cls.room || 'TBA'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>Semester {cls.semester || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Status Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Submission Status
          </h2>
          <div className="h-64 flex items-center justify-center">
            {stats.pendingSubmissions + stats.gradedSubmissions + stats.lateSubmissions > 0 ? (
              <div className="w-80">
                <Pie data={submissionStatusData} options={chartOptions} />
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
            )}
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weekly Activity
          </h2>
          <div className="h-64">
            <Bar data={weeklyActivityData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Subjects */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Subjects</h2>
            <Link
              to="/teacher/subjects"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View All
              <ArrowTrendingUpIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {subjects.length > 0 ? (
              subjects.slice(0, 4).map((subject) => (
                <div key={subject._id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {subject.name}
                        </h3>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                          {subject.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Semester {subject.semester}</span>
                        <span>{subject.credits} Credits</span>
                      </div>
                    </div>
                    <Link
                      to={`/teacher/subjects/${subject._id}`}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <BookOpenIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p>No subjects assigned yet</p>
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
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {assignment.title}
                        </h3>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">{assignment.subject?.name}</p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <ClockIcon className="h-4 w-4" />
                          <span>Due: {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {assignment.submissions?.length || 0} submissions
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                <p>No upcoming deadlines</p>
              </div>
            )}
          </div>
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-center rounded-b-lg">
            <Link
              to="/teacher/assignments"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
            >
              View All Assignments
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Submissions</h2>
          <Link
            to="/teacher/submissions"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {allSubmissions.slice(0, 5).map((submission) => (
                <tr key={submission._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 text-xs font-medium">
                          {submission.studentName?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {submission.studentName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {submission.studentEnrollment}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900 dark:text-white">{submission.title}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      submission.type === 'assignment'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                    }`}>
                      {submission.type === 'assignment' ? 'Assignment' : 'Quiz'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{submission.subjectName}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      submission.type === 'assignment'
                        ? submission.status === 'graded' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : submission.status === 'late'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        : submission.isFullyGraded
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                    }`}>
                      {submission.type === 'assignment' 
                        ? submission.status || 'Submitted'
                        : submission.isFullyGraded ? 'Graded' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {submission.type === 'assignment' 
                      ? submission.status !== 'graded' && (
                          <Link
                            to={`/teacher/submissions/${submission._id}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-medium"
                          >
                            Grade
                          </Link>
                        )
                      : !submission.isFullyGraded && (
                          <Link
                            to={`/teacher/quiz-submissions/${submission._id}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 font-medium"
                          >
                            Grade
                          </Link>
                        )
                    }
                  </td>
                </tr>
              ))}
              {allSubmissions.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No recent submissions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-6 border border-primary-200 dark:border-primary-800">
        <h2 className="text-lg font-semibold text-primary-900 dark:text-primary-400 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            to="/teacher/notes/upload"
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group border border-gray-200 dark:border-gray-700"
          >
            <DocumentTextIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Upload Notes</span>
          </Link>
          <Link
            to="/teacher/assignments/create"
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group border border-gray-200 dark:border-gray-700"
          >
            <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Create Assignment</span>
          </Link>
          <Link
            to="/teacher/quizzes/create"
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group border border-gray-200 dark:border-gray-700"
          >
            <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Create Quiz</span>
          </Link>
          <Link
            to="/teacher/submissions"
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group border border-gray-200 dark:border-gray-700"
          >
            <ClockIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Grade Submissions</span>
          </Link>
          <Link
            to="/teacher/schedule"
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-gray-800 transition-all text-center group border border-gray-200 dark:border-gray-700"
          >
            <CalendarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-gray-700 dark:text-gray-300">View Schedule</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;