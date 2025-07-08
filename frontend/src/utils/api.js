import axios from 'axios';
import { clearAuthData } from './auth';

// Create axios instance with base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        type: 'NETWORK_ERROR'
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('Authentication failed, clearing local data');
      clearAuthData();
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      return Promise.reject({
        message: `Too many requests. Please try again ${retryAfter ? `in ${retryAfter} seconds` : 'later'}.`,
        type: 'RATE_LIMIT',
        retryAfter
      });
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      return Promise.reject({
        message: 'Server error. Please try again later.',
        type: 'SERVER_ERROR',
        status: error.response.status
      });
    }

    return Promise.reject(error);
  }
);

export default api;
