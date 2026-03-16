import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TwoFactorModal from '../components/TwoFactorModal';
import { HiMiniSquare3Stack3D } from "react-icons/hi2";
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiBookOpen, FiUsers } from 'react-icons/fi';
import { FaUniversity, FaChalkboardTeacher } from 'react-icons/fa';
import { GiBookshelf } from 'react-icons/gi';
import axios from 'axios';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    programs: 0
  });
  const [loadingData, setLoadingData] = useState(true);
  
  // 2FA states
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const [twoFAMethod, setTwoFAMethod] = useState('app');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Create a public axios instance
  const publicApi = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 8000,
  });

  // Fetch university data on mount
  useEffect(() => {
    const fetchUniversityData = async () => {
      try {
        setLoadingData(true);
        console.log('Fetching university data...');

        // Fetch departments
        try {
          const deptResponse = await publicApi.get('/departments/public');
          console.log('Departments response:', deptResponse.data);
          
          if (Array.isArray(deptResponse.data)) {
            setDepartments(deptResponse.data.slice(0, 6));
          } else if (deptResponse.data?.data && Array.isArray(deptResponse.data.data)) {
            setDepartments(deptResponse.data.data.slice(0, 6));
          } else {
            // If no departments, try to get from another endpoint or leave empty
            setDepartments([]);
          }
        } catch (deptError) {
          console.log('Error fetching departments:', deptError);
          setDepartments([]);
        }

        // Fetch university stats using a single optimized endpoint
        try {
          // Try to get all stats in one call first
          const statsResponse = await publicApi.get('/stats/all');
          console.log('Stats response:', statsResponse.data);
          
          setStats({
            students: statsResponse.data.students || statsResponse.data.totalStudents || 0,
            faculty: statsResponse.data.faculty || statsResponse.data.totalFaculty || 0,
            programs: statsResponse.data.programs || statsResponse.data.totalPrograms || 0
          });
        } catch (statsError) {
          console.log('Single stats endpoint failed, trying individual endpoints:', statsError);
          
          // Fallback to individual endpoints
          try {
            const [studentsRes, facultyRes, programsRes] = await Promise.allSettled([
              publicApi.get('/stats/students').catch(() => ({ status: 'rejected', value: { data: { total: 0 } } })),
              publicApi.get('/stats/faculty').catch(() => ({ status: 'rejected', value: { data: { total: 0 } } })),
              publicApi.get('/stats/programs').catch(() => ({ status: 'rejected', value: { data: { total: 0 } } }))
            ]);

            setStats({
              students: studentsRes.status === 'fulfilled' ? studentsRes.value.data.total || studentsRes.value.data.count || 0 : 0,
              faculty: facultyRes.status === 'fulfilled' ? facultyRes.value.data.total || facultyRes.value.data.count || 0 : 0,
              programs: programsRes.status === 'fulfilled' ? programsRes.value.data.total || programsRes.value.data.count || 0 : 0
            });
          } catch (fallbackError) {
            console.log('All stats endpoints failed:', fallbackError);
            // If all endpoints fail, keep zeros
            setStats({ students: 0, faculty: 0, programs: 0 });
          }
        }

      } catch (error) {
        console.error('Error in fetchUniversityData:', error);
        setDepartments([]);
        setStats({ students: 0, faculty: 0, programs: 0 });
      } finally {
        setLoadingData(false);
      }
    };

    fetchUniversityData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login...');
      const result = await login(email, password);
      
      // Check if 2FA is required
      if (result.requires2FA) {
        console.log('2FA required, showing modal...');
        setTempToken(result.tempToken);
        setPendingUser(result.user);
        setTwoFAMethod(result.method || 'app');
        setShow2FAModal(true);
        setLoading(false);
      } else if (result.success) {
        console.log('Login successful, redirecting...');
        switch (result.role) {
          case 'admin': navigate('/admin/dashboard'); break;
          case 'teacher': navigate('/teacher/dashboard'); break;
          case 'student': navigate('/student/dashboard'); break;
          default: navigate('/');
        }
      } else {
        setError(result.error || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handle2FASuccess = () => {
    setShow2FAModal(false);
    setTempToken('');
    setPendingUser(null);
    // The redirect will be handled by the verify2FA function in AuthContext
  };

  const handle2FAClose = () => {
    setShow2FAModal(false);
    setTempToken('');
    setPendingUser(null);
    setLoading(false);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading University Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-gray-900 flex">
        {/* Left Side - University Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 to-primary-800 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 border-2 border-white rounded-full"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full flex flex-col justify-between p-12 text-white">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-12">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                  <FaUniversity className="h-8 w-8 text-yellow-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">University of Shangla</h1>
                  <p className="text-white/70 text-sm mt-1">Excellence in Education Since 2022</p>
                </div>
              </div>

              <h2 className="text-5xl font-bold mb-6 leading-tight">
                Welcome to <br />
                <span className="text-yellow-300">University Portal</span>
              </h2>
              
              <p className="text-white/80 text-lg mb-12 leading-relaxed max-w-lg">
                Access your courses, track your progress, connect with faculty, and manage your academic journey all in one place.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <FiUsers className="h-6 w-6 text-yellow-300 mb-2" />
                <div className="text-2xl font-bold">{stats.students > 0 ? stats.students.toLocaleString() : '0'}+</div>
                <div className="text-white/60 text-sm">Enrolled Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <FaChalkboardTeacher className="h-6 w-6 text-yellow-300 mb-2" />
                <div className="text-2xl font-bold">{stats.faculty > 0 ? stats.faculty.toLocaleString() : '0'}+</div>
                <div className="text-white/60 text-sm">Faculty Members</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
                <GiBookshelf className="h-6 w-6 text-yellow-300 mb-2" />
                <div className="text-2xl font-bold">{stats.programs > 0 ? stats.programs.toLocaleString() : '0'}+</div>
                <div className="text-white/60 text-sm">Academic Programs</div>
              </div>
            </div>

            {/* Departments */}
            {departments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FiBookOpen className="text-yellow-300" />
                  Academic Departments
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {departments.map((dept, index) => (
                    <div key={dept._id || index} className="bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors">
                      <FiBookOpen className="text-yellow-300/70 h-4 w-4 flex-shrink-0" />
                      <span className="text-sm text-white/80 truncate">
                        {dept.name || dept}
                        {dept.code && <span className="text-white/40 ml-1 text-xs">({dept.code})</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 text-sm text-white/40">
              © 2024 University of Shangla. All rights reserved.
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg mb-4">
                <FaUniversity className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">University of Shangla</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-10">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Please sign in to continue to your dashboard
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="you@university.edu"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FiArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              {/* Register Link */}
              <div className="text-center mt-6">
                <p className="text-gray-600 dark:text-gray-400">
                  New to University of Shangla?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      <TwoFactorModal
        isOpen={show2FAModal}
        onClose={handle2FAClose}
        onSuccess={handle2FASuccess}
        tempToken={tempToken}
        method={twoFAMethod}
        userData={pendingUser}
      />
    </>
  );
};

export default Login;