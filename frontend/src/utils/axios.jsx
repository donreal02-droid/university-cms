import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api', // This has /api
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Don't log 401 errors (they're expected when not authenticated)
    if (error.response?.status !== 401) {
      console.error('API Error:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default instance;