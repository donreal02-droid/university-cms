import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TwoFactorModal from '../components/TwoFactorModal';
import { FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiBookOpen, FiUsers } from 'react-icons/fi';
import { FaUniversity, FaChalkboardTeacher } from 'react-icons/fa';
import { GiBookshelf } from 'react-icons/gi';
import { publicApi } from '../utils/api'; // ✅ IMPORT from central file
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

  // Fetch university data on mount
  useEffect(() => {
    const fetchUniversityData = async () => {
      try {
        setLoadingData(true);
        console.log('📡 Fetching university data using:', publicApi.defaults.baseURL);

        // Fetch departments
        try {
          const deptResponse = await publicApi.get('/departments/public');
          console.log('✅ Departments response:', deptResponse.data);

          if (Array.isArray(deptResponse.data)) {
            setDepartments(deptResponse.data.slice(0, 6));
          } else if (deptResponse.data?.data && Array.isArray(deptResponse.data.data)) {
            setDepartments(deptResponse.data.data.slice(0, 6));
          } else {
            setDepartments([]);
          }
        } catch (deptError) {
          console.error('❌ Error fetching departments:', deptError.message);
          setDepartments([]);
        }

        // Fetch stats
        try {
          const statsResponse = await publicApi.get('/stats/all');
          console.log('✅ Stats response:', statsResponse.data);

          setStats({
            students: statsResponse.data.students || statsResponse.data.totalStudents || 0,
            faculty: statsResponse.data.faculty || statsResponse.data.totalFaculty || 0,
            programs: statsResponse.data.programs || statsResponse.data.totalPrograms || 0
          });
        } catch (statsError) {
          console.log('Stats endpoint failed:', statsError.message);
          setStats({ students: 0, faculty: 0, programs: 0 });
        }

      } catch (error) {
        console.error('❌ Error in fetchUniversityData:', error);
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
      console.log('📡 Attempting login to:', `${publicApi.defaults.baseURL}/auth/login`);
      const result = await login(email, password);

      if (result.requires2FA) {
        console.log('🔐 2FA required');
        setTempToken(result.tempToken);
        setPendingUser(result.user);
        setTwoFAMethod(result.method || 'app');
        setShow2FAModal(true);
        setLoading(false);
      } else if (result.success) {
        console.log('✅ Login successful, redirecting...');
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
      console.error('❌ Login error:', err);
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  const handle2FASuccess = () => {
    setShow2FAModal(false);
    setTempToken('');
    setPendingUser(null);
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

  // ... rest of your JSX stays exactly the same ...
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-gray-900 flex">
        {/* Left Side - University Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 to-primary-800 relative overflow-hidden">
          {/* ... your existing JSX ... */}
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50">
          <div className="w-full max-w-md">
            {/* ... your existing form JSX ... */}
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