import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/axios.jsx';
import { publicApi, apiService } from '../utils/api'; // Import the SAME axios instance

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';
import { publicApi, privateApi } from '../utils/api'; // Import BOTH from central API

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('🔄 Initializing auth with token:', token ? 'Present' : 'None');
        console.log('🔧 API Base URL:', publicApi.defaults.baseURL);
        
        if (!token) {
          console.log('❌ No token found, user is not authenticated');
          setLoading(false);
          return;
        }

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('✅ User restored from localStorage:', parsedUser.email);
          } catch (parseError) {
            console.error('❌ Error parsing stored user:', parseError);
            localStorage.removeItem('user');
          }
        }

        // Verify token by fetching profile using privateApi (includes token)
        try {
          console.log('📡 Verifying token with profile request...');
          const response = await privateApi.get('/auth/profile');
          console.log('✅ Profile fetched successfully:', response.data);
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('❌ Token invalid, clearing auth data:', error.message);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          toast.error('Session expired. Please login again.');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        console.log('✅ Auth initialization complete. Loading:', false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('📡 Login attempt to:', `${publicApi.defaults.baseURL}/auth/login`);
      const response = await publicApi.post('/auth/login', { email, password });
      console.log('📡 Login response:', response.data);
      
      // Handle 2FA requirement
      if (response.data.requires2FA) {
        console.log('🔐 2FA required');
        return { 
          requires2FA: true, 
          tempToken: response.data.tempToken,
          method: response.data.method,
          user: response.data.user
        };
      }
      
      // Handle successful login
      const { token, ...userData } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      console.log('✅ Login successful for:', userData.email);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Login successful!');
      
      return { success: true, role: userData.role, user: userData };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const verify2FA = async (tempToken, code, isBackupCode = false) => {
    try {
      console.log('📡 Verifying 2FA...');
      const response = await publicApi.post('/auth/verify-2fa', {
        tempToken,
        token: code,
        isBackupCode
      });
      
      console.log('✅ 2FA verification successful');
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('2FA verification successful!');
      
      return { success: true, role: userData.role, user: userData };
    } catch (error) {
      console.error('❌ 2FA verification error:', error);
      toast.error(error.response?.data?.message || 'Verification failed');
      return { success: false };
    }
  };

  const updateUser = (userData) => {
    console.log('📝 Updating user:', userData.email);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    console.log('👋 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/login';
  };

  const value = {
    user,
    login,
    verify2FA,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user
  };

  console.log('📊 AuthContext state:', { 
    user: user?.email, 
    loading, 
    isAuthenticated: !!user,
    apiUrl: publicApi.defaults.baseURL
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        // If no token, stop loading and don't fetch
        if (!token) {
          console.log('No token found, user is not authenticated');
          setLoading(false);
          return;
        }

        // If we have stored user data, set it temporarily
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError);
            localStorage.removeItem('user');
          }
        }

        // Verify token by fetching profile
        try {
          await fetchUser();
        } catch (error) {
          // If token is invalid, clear storage
          console.log('Token invalid, clearing auth data');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUser = async () => {
    try {
      // REMOVED /api from path (axios.jsx already has it)
      const response = await api.get('/auth/profile');
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.requires2FA) {
        return { 
          requires2FA: true, 
          tempToken: response.data.tempToken,
          method: response.data.method,
          user: response.data.user
        };
      }
      
      let token, userData;
      
      if (response.data.token && response.data.user) {
        token = response.data.token;
        userData = response.data.user;
      } else if (response.data.token && response.data.role) {
        token = response.data.token;
        userData = response.data;
      } else {
        throw new Error('Invalid response format');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Login successful!');
      
      return { success: true, role: userData.role, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false };
    }
  };

  const verify2FA = async (tempToken, code, isBackupCode = false) => {
    try {
      const response = await api.post('/auth/verify-2fa', {
        tempToken,
        token: code,
        isBackupCode
      });
      
      const { token, ...userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('2FA verification successful!');
      
      return { success: true, role: userData.role, user: userData };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
      return { success: false };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      verify2FA,
      logout, 
      updateUser, 
      loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};