// utils/api.js
import axios from 'axios';

// Get base URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🔥 API Base URL:', API_URL);

// Public API instance (for login, register, public data)
export const publicApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Private API instance (for authenticated requests)
export const privateApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Safe localStorage access
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

// Add token to private requests
privateApi.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
const responseInterceptor = (api) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const { status } = error.response;
        
        if (status === 401) {
          console.error('❌ Unauthorized - logging out');
          removeToken();
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      } else if (error.request) {
        console.error('❌ No response from server:', error.request);
      } else {
        console.error('❌ Request error:', error.message);
      }
      return Promise.reject(error);
    }
  );
};

responseInterceptor(publicApi);
responseInterceptor(privateApi);

// Helper methods
export const apiService = {
  // Public methods
  get: (url, config = {}) => publicApi.get(url, config),
  post: (url, data, config = {}) => publicApi.post(url, data, config),
  put: (url, data, config = {}) => publicApi.put(url, data, config),
  delete: (url, config = {}) => publicApi.delete(url, config),
  
  // Authenticated methods
  authGet: (url, config = {}) => privateApi.get(url, config),
  authPost: (url, data, config = {}) => privateApi.post(url, data, config),
  authPut: (url, data, config = {}) => privateApi.put(url, data, config),
  authDelete: (url, config = {}) => privateApi.delete(url, config),
  
  // Auth specific
  login: (credentials) => publicApi.post('/auth/login', credentials),
  logout: () => {
    removeToken();
    window.location.href = '/login';
  },
  isAuthenticated: () => {
    const token = getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp < Date.now() / 1000) {
        removeToken();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
};

export default publicApi;