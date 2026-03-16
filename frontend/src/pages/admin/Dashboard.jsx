import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { 
  UsersIcon, 
  AcademicCapIcon, 
  BuildingOfficeIcon, 
  BookOpenIcon,
  DocumentTextIcon,
  ClockIcon,
  UserPlusIcon,
  PlusCircleIcon
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

const AdminDashboard = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to get correct image URL
  const getImageUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    if (filename.startsWith('/uploads')) {
      return `http://localhost:5000${filename}`;
    }
    return `http://localhost:5000/uploads/profiles/${filename}`;
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Fetching dashboard stats...');
      console.log('Token being sent:', token.substring(0, 20) + '...');
      
      const response = await api.get('/dashboard/admin');
      
      console.log('Dashboard data:', response.data);
      
      if (response.data.success && response.data.data) {
        setStats(response.data.data);
        setError('');
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        setError(`Error: ${error.response.data.message || 'Unknown error'}`);
      } else {
        setError('Cannot connect to server');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToAddStudent = () => {
    navigate('/admin/users?role=student&action=add');
  };

  const navigateToAddTeacher = () => {
    navigate('/admin/users?role=teacher&action=add');
  };

  const navigateToAddDepartment = () => {
    navigate('/admin/departments?action=add');
  };

  const navigateToAddSubject = () => {
    navigate('/admin/subjects?action=add');
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          No data available
        </div>
      </div>
    );
  }

  const { counts, recentUsers, departmentStats, registrations } = stats;

  const registrationMonths = registrations?.map(r => r.month) || [];
  const registrationCounts = registrations?.map(r => r.count) || [];

  const departmentNames = departmentStats?.map(d => d.name) || [];
  const departmentStudentCounts = departmentStats?.map(d => d.studentCount) || [];

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#374151'
        }
      },
      title: {
        display: false,
      },
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

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#374151'
        }
      },
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
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#374151'
        }
      },
    },
  };

  const barData = {
    labels: departmentNames,
    datasets: [
      {
        label: 'Students per Department',
        data: departmentStudentCounts,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: registrationMonths,
    datasets: [
      {
        label: 'New Registrations',
        data: registrationCounts,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const pieData = {
    labels: ['Students', 'Teachers', 'Departments', 'Subjects'],
    datasets: [
      {
        data: [counts?.students || 0, counts?.teachers || 0, counts?.departments || 0, counts?.subjects || 0],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const statCards = [
    { 
      title: 'Total Students', 
      value: counts?.students || 0, 
      icon: UsersIcon, 
      color: 'bg-blue-500',
      darkColor: 'dark:bg-blue-600',
      change: '+12%',
      bgColor: 'bg-blue-50',
      darkBgColor: 'dark:bg-blue-900/20',
      textColor: 'text-blue-600',
      darkTextColor: 'dark:text-blue-400'
    },
    { 
      title: 'Total Teachers', 
      value: counts?.teachers || 0, 
      icon: AcademicCapIcon, 
      color: 'bg-green-500',
      darkColor: 'dark:bg-green-600',
      change: '+4%',
      bgColor: 'bg-green-50',
      darkBgColor: 'dark:bg-green-900/20',
      textColor: 'text-green-600',
      darkTextColor: 'dark:text-green-400'
    },
    { 
      title: 'Departments', 
      value: counts?.departments || 0, 
      icon: BuildingOfficeIcon, 
      color: 'bg-yellow-500',
      darkColor: 'dark:bg-yellow-600',
      change: '+2',
      bgColor: 'bg-yellow-50',
      darkBgColor: 'dark:bg-yellow-900/20',
      textColor: 'text-yellow-600',
      darkTextColor: 'dark:text-yellow-400'
    },
    { 
      title: 'Subjects', 
      value: counts?.subjects || 0, 
      icon: BookOpenIcon, 
      color: 'bg-purple-500',
      darkColor: 'dark:bg-purple-600',
      change: '+8',
      bgColor: 'bg-purple-50',
      darkBgColor: 'dark:bg-purple-900/20',
      textColor: 'text-purple-600',
      darkTextColor: 'dark:text-purple-400'
    },
    { 
      title: 'Assignments', 
      value: counts?.assignments || 0, 
      icon: DocumentTextIcon, 
      color: 'bg-indigo-500',
      darkColor: 'dark:bg-indigo-600',
      change: '+15',
      bgColor: 'bg-indigo-50',
      darkBgColor: 'dark:bg-indigo-900/20',
      textColor: 'text-indigo-600',
      darkTextColor: 'dark:text-indigo-400'
    },
    { 
      title: 'Pending Submissions', 
      value: counts?.pendingSubmissions || 0, 
      icon: ClockIcon, 
      color: 'bg-red-500',
      darkColor: 'dark:bg-red-600',
      change: counts?.submissions ? `${Math.round((counts.pendingSubmissions / counts.submissions) * 100)}%` : '0%',
      bgColor: 'bg-red-50',
      darkBgColor: 'dark:bg-red-900/20',
      textColor: 'text-red-600',
      darkTextColor: 'dark:text-red-400'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back, {currentUser?.name}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Here's what's happening in your university today.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.darkBgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor} ${stat.darkTextColor}`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.bgColor} ${stat.darkBgColor} ${stat.textColor} ${stat.darkTextColor}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            New Registrations (Last 6 Months)
          </h2>
          <div className="h-80">
            {registrationMonths.length > 0 ? (
              <Line data={lineData} options={lineOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No registration data available
              </div>
            )}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Students per Department
          </h2>
          <div className="h-80">
            {departmentNames.length > 0 ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No department data available
              </div>
            )}
          </div>
        </div>

        {/* Overall Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Overall Distribution
          </h2>
          <div className="h-80 flex items-center justify-center">
            <div className="w-96">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>
        </div>

        {/* Recent Users - FIXED PROFILE IMAGES */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Users
          </h2>
          <div className="space-y-4">
            {recentUsers && recentUsers.length > 0 ? (
              recentUsers.map((recentUser) => (
                <div key={recentUser._id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {recentUser.profileImage ? (
                      <img
                        src={getImageUrl(recentUser.profileImage)}
                        alt={recentUser.name}
                        className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          console.log('Failed to load image:', recentUser.profileImage);
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `
                            <div class="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                              <span class="text-primary-600 dark:text-primary-400 font-medium text-sm">
                                ${recentUser.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                          {recentUser.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {recentUser.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {recentUser.email} • {recentUser.role}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(recentUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No recent users
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 border border-primary-100 dark:border-primary-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary-900 dark:text-primary-400">
            Quick Actions
          </h2>
          <PlusCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={navigateToAddStudent}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-all text-center group border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
          >
            <UserPlusIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Student</span>
            <span className="text-xs text-gray-500 dark:text-gray-500 block mt-1">Register student</span>
          </button>

          <button
            onClick={navigateToAddTeacher}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-all text-center group border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
          >
            <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add New Teacher</span>
            <span className="text-xs text-gray-500 dark:text-gray-500 block mt-1">Hire teacher</span>
          </button>

          <button
            onClick={navigateToAddDepartment}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-all text-center group border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
          >
            <BuildingOfficeIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Department</span>
            <span className="text-xs text-gray-500 dark:text-gray-500 block mt-1">New department</span>
          </button>

          <button
            onClick={navigateToAddSubject}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-all text-center group border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700"
          >
            <BookOpenIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Subject</span>
            <span className="text-xs text-gray-500 dark:text-gray-500 block mt-1">New course</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;