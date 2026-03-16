import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const Register = ({ onToggleForm }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: ''
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: ''
  });
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Clear any existing tokens on mount
  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }, []);

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Password strength checker
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password);
      checkPasswordRequirements(formData.password);
    } else {
      setPasswordRequirements({
        minLength: false,
        hasUppercase: false,
        hasNumber: false,
        hasSpecialChar: false
      });
    }
  }, [formData.password]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      if (Array.isArray(response.data)) {
        setDepartments(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setDepartments(response.data.data);
      } else if (response.data.departments && Array.isArray(response.data.departments)) {
        setDepartments(response.data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const checkPasswordRequirements = (password) => {
    setPasswordRequirements({
      minLength: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password)
    });
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = '';
    let color = '';

    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch(score) {
      case 0:
      case 1:
        message = 'Weak';
        color = 'bg-red-500';
        break;
      case 2:
        message = 'Fair';
        color = 'bg-orange-500';
        break;
      case 3:
        message = 'Good';
        color = 'bg-yellow-500';
        break;
      case 4:
        message = 'Strong';
        color = 'bg-blue-500';
        break;
      case 5:
        message = 'Very Strong';
        color = 'bg-green-500';
        break;
      default:
        message = '';
        color = '';
    }

    setPasswordStrength({ score, message, color });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Full name is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.role === 'teacher' && !formData.department) {
      setError('Please select a department for teacher account');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Clear any existing tokens before registration
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      const response = await api.post('/auth/register', {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        department: formData.department || undefined
      });

      // Double-check and clear any tokens that might have been set
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      setSuccess(true);
      
      // Don't store any user data
      // Just show success message and redirect to login
      setTimeout(() => {
        if (onToggleForm) {
          onToggleForm(); // Switch to login form
        } else {
          // Navigate to login page with state
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please login with your credentials.',
              email: formData.email 
            },
            replace: true // Replace the current entry in history
          });
        }
      }, 2000);
    } catch (error) {
      if (error.response?.status === 409) {
        setError('Email already exists. Please use a different email or login.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || 'Invalid registration data');
      } else {
        setError(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-primary-800 dark:text-primary-200 mb-2">University CMS</h2>
          <p className="text-gray-600 dark:text-gray-300">Create your account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
          {success ? (
            <div className="text-center py-8">
              <div className="text-green-500 dark:text-green-400 text-5xl mb-4">✓</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Registration Successful!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Please login with your credentials</p>
              <div className="w-16 h-16 mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-start">
                  <span className="mr-2 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department {formData.role === 'teacher' && <span className="text-red-500">*</span>}
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {formData.role === 'teacher' && !formData.department && (
                  <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
                    Department is required for teacher accounts
                  </p>
                )}
              </div>

              {/* Password Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password <span className="text-red-500">*</span>
                </label>
                
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600 pr-10"
                    placeholder="Enter your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('password')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                {/* Password Requirements Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-2">
                  <div className="flex items-start gap-2">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 w-full">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                        Password Requirements:
                      </p>
                      <ul className="space-y-1.5">
                        <li className="flex items-center gap-2 text-xs">
                          <span className={`inline-block w-4 ${formData.password ? (passwordRequirements.minLength ? 'text-green-500' : 'text-gray-400') : 'text-blue-500'}`}>
                            {formData.password ? (passwordRequirements.minLength ? '✓' : '○') : '•'}
                          </span>
                          <span className={formData.password ? (passwordRequirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400') : 'text-blue-700 dark:text-blue-300'}>
                            At least 6 characters
                          </span>
                        </li>
                        <li className="flex items-center gap-2 text-xs">
                          <span className={`inline-block w-4 ${formData.password ? (passwordRequirements.hasUppercase ? 'text-green-500' : 'text-gray-400') : 'text-blue-500'}`}>
                            {formData.password ? (passwordRequirements.hasUppercase ? '✓' : '○') : '•'}
                          </span>
                          <span className={formData.password ? (passwordRequirements.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400') : 'text-blue-700 dark:text-blue-300'}>
                            One uppercase letter (A-Z)
                          </span>
                        </li>
                        <li className="flex items-center gap-2 text-xs">
                          <span className={`inline-block w-4 ${formData.password ? (passwordRequirements.hasNumber ? 'text-green-500' : 'text-gray-400') : 'text-blue-500'}`}>
                            {formData.password ? (passwordRequirements.hasNumber ? '✓' : '○') : '•'}
                          </span>
                          <span className={formData.password ? (passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400') : 'text-blue-700 dark:text-blue-300'}>
                            One number (0-9)
                          </span>
                        </li>
                        <li className="flex items-center gap-2 text-xs">
                          <span className={`inline-block w-4 ${formData.password ? (passwordRequirements.hasSpecialChar ? 'text-green-500' : 'text-gray-400') : 'text-blue-500'}`}>
                            {formData.password ? (passwordRequirements.hasSpecialChar ? '✓' : '○') : '•'}
                          </span>
                          <span className={formData.password ? (passwordRequirements.hasSpecialChar ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400') : 'text-blue-700 dark:text-blue-300'}>
                            One special character (!@#$%^&*)
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Password strength:
                      </span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.message === 'Weak' ? 'text-red-500' :
                        passwordStrength.message === 'Fair' ? 'text-orange-500' :
                        passwordStrength.message === 'Good' ? 'text-yellow-500' :
                        passwordStrength.message === 'Strong' ? 'text-blue-500' :
                        passwordStrength.message === 'Very Strong' ? 'text-green-500' : ''
                      }`}>
                        {passwordStrength.message}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600 pr-10"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                    <span>⚠</span> Passwords do not match
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1 flex items-center gap-1">
                    <span>✓</span> Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg font-semibold dark:bg-primary-500 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Register'}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={onToggleForm}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 text-sm font-medium"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;