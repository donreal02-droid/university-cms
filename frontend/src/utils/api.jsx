// utils/api.js
import axios from 'axios';

// CHANGE: process.env to import.meta.env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Safe localStorage access with error handling
const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

const removeToken = () => {
  try {
    localStorage.removeItem('token');
  } catch (error) {
    console.error('Error removing token from localStorage:', error);
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request');
    } else {
      console.log('No token available for request');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.error('Unauthorized access - token may be expired');
          removeToken();
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          console.error('Forbidden access');
          break;
          
        case 404:
          console.error('Resource not found');
          break;
          
        case 500:
          console.error('Server error');
          break;
          
        default:
          console.error(`API error ${status}:`, data?.message || 'Unknown error');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received from server:', error.request);
    } else {
      // Error in request setup
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper methods for common API calls
export const apiService = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
  
  // Special method for login (doesn't require token)
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Method to check if user is authenticated
  isAuthenticated: () => {
    const token = getToken();
    if (!token) return false;
    
    // Optional: Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = payload.exp < Date.now() / 1000;
      
      if (expired) {
        removeToken();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  },
  
  // Logout helper
  logout: () => {
    removeToken();
    window.location.href = '/login';
  }
};

export default api;