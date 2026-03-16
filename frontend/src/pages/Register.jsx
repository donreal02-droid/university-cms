import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { FaUniversity } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: '',
    semester: '',
    enrollmentNumber: '',
    phone: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDepartments, setFetchingDepartments] = useState(true);
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  
  const navigate = useNavigate();

  // Create a public axios instance
  const publicApi = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
  });

  // Update password checks when password changes
  useEffect(() => {
    setPasswordChecks({
      minLength: formData.password.length >= 6,
      hasUppercase: /[A-Z]/.test(formData.password),
      hasNumber: /[0-9]/.test(formData.password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(formData.password)
    });
  }, [formData.password]);

  // 🔴 FIXED: Fetch real departments from backend
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setFetchingDepartments(true);
        console.log('📡 Fetching departments from backend...');
        
        // Use the working public endpoint
        const response = await publicApi.get('/departments/public');
        console.log('✅ Departments response:', response.data);
        
        let departmentsData = [];
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          departmentsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          departmentsData = response.data.data;
        } else if (response.data?.departments && Array.isArray(response.data.departments)) {
          departmentsData = response.data.departments;
        }
        
        if (departmentsData.length === 0) {
          throw new Error('No departments found');
        }
        
        console.log(`✅ Loaded ${departmentsData.length} departments`);
        setDepartments(departmentsData);
        
      } catch (error) {
        console.error('❌ Failed to fetch departments:', error.message);
        toast.error('Could not load departments. Please refresh the page.');
        
        // Don't set fallback data - show error state instead
        setDepartments([]);
      } finally {
        setFetchingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      toast.error('Password must contain at least one number');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      toast.error('Password must contain at least one special character');
      return;
    }

    // Make sure department is selected
    if (!formData.department) {
      toast.error('Please select a department');
      return;
    }

    setLoading(true);

    try {
      console.log('📡 Submitting registration:', formData);
      
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        phone: formData.phone || null,
        ...(formData.role === 'student' && {
          semester: formData.semester ? parseInt(formData.semester) : null,
          enrollmentNumber: formData.enrollmentNumber || null
        })
      };

      const response = await publicApi.post('/auth/register', registrationData);
      console.log('✅ Registration response:', response.data);
      
      toast.success('Registration successful! Please login.');
      
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please login with your credentials.',
            email: formData.email 
          },
          replace: true
        });
      }, 2000);
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      
      let errorMessage = 'Registration failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors[0]?.msg || 'Validation failed';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while fetching departments
  if (fetchingDepartments) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  // Show error if no departments loaded
  if (departments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-full p-3 mx-auto w-fit mb-4">
            <FiXCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Cannot Load Departments
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Unable to fetch departments from server. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-md">
              <FaUniversity className="h-6 w-6 text-white" />
            </div>
            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
            <span className="text-xl font-semibold tracking-wide text-gray-800 dark:text-white"> 
              UOSHANGLA <span className="text-primary-600 dark:text-primary-400">CMS</span>
            </span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight"> 
              Create your account 
            </h2>
            <div className="w-16 h-0.5 bg-primary-500/50 mx-auto mt-3 rounded-full"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4"> 
              Begin your academic journey with University of Shangla
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="you@university.edu"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              I am a <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'student'})}
                className={`py-2 px-3 rounded-lg border text-sm transition-all ${
                  formData.role === 'student'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'teacher'})}
                className={`py-2 px-3 rounded-lg border text-sm transition-all ${
                  formData.role === 'teacher'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300'
                }`}
              >
                Teacher
              </button>
            </div>
          </div>

          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              id="department"
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} {dept.code ? `(${dept.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Student-specific fields */}
          {formData.role === 'student' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  id="semester"
                  name="semester"
                  required
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>Semester {num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="enrollmentNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enrollment No. <span className="text-red-500">*</span>
                </label>
                <input
                  id="enrollmentNumber"
                  name="enrollmentNumber"
                  type="text"
                  required
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="ENR2024001"
                />
              </div>
            </div>
          )}

          {/* Phone (optional) */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number (Optional)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="+92 300 1234567"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm pr-10"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              <div className="flex items-center gap-1">
                {passwordChecks.minLength ? (
                  <FiCheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <FiXCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-xs ${passwordChecks.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'}`}>
                  6+ characters
                </span>
              </div>
              <div className="flex items-center gap-1">
                {passwordChecks.hasUppercase ? (
                  <FiCheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <FiXCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-xs ${passwordChecks.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'}`}>
                  Uppercase
                </span>
              </div>
              <div className="flex items-center gap-1">
                {passwordChecks.hasNumber ? (
                  <FiCheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <FiXCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-xs ${passwordChecks.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'}`}>
                  One number
                </span>
              </div>
              <div className="flex items-center gap-1">
                {passwordChecks.hasSpecialChar ? (
                  <FiCheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <FiXCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                )}
                <span className={`text-xs ${passwordChecks.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'}`}>
                  Special char
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm pr-10"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;