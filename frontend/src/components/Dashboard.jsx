import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../utils/api'; // Use the api utility instead of axios

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    upcomingClasses: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (user.role === 'teacher') {
        const [coursesRes, studentsRes] = await Promise.all([
          api.get('/teacher/courses'),
          api.get('/teacher/students')
        ]);
        setCourses(coursesRes.data);
        setStudents(studentsRes.data);
        setStats({
          totalCourses: coursesRes.data.length,
          totalStudents: studentsRes.data.length,
          upcomingClasses: coursesRes.data.filter(c => c.schedule).length
        });
      } else if (user.role === 'student') {
        const coursesRes = await api.get('/student/courses');
        setCourses(coursesRes.data);
        setStats({
          totalCourses: coursesRes.data.length,
          totalStudents: 0,
          upcomingClasses: coursesRes.data.filter(c => c.schedule).length
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-primary-600 dark:bg-primary-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">University CMS</h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm opacity-90">Welcome back,</p>
                <p className="font-semibold">{user?.name}</p>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 px-4 py-2 rounded-lg transition duration-200 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card hover:shadow-lg transition duration-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Courses</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalCourses}</p>
              </div>
            </div>
          </div>

          {user.role === 'teacher' && (
            <div className="card hover:shadow-lg transition duration-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">My Students</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalStudents}</p>
                </div>
              </div>
            </div>
          )}

          <div className="card hover:shadow-lg transition duration-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Upcoming Classes</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.upcomingClasses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">My Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course._id} className="card hover:shadow-xl transition duration-200 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-white">{course.name}</h3>
                  <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs px-2 py-1 rounded">
                    {course.code}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{course.description}</p>
                
                {course.schedule && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Schedule</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {course.schedule.day} at {course.schedule.time}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Room: {course.schedule.room}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Credits: {course.credits}
                  </span>
                  <button className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Students Section (for teachers) */}
        {user.role === 'teacher' && students.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">My Students</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map(student => (
                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500 dark:text-gray-400">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500 dark:text-gray-400">
                          {student.department?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 text-sm font-medium">
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;