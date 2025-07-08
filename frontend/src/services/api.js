import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post(API_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const apiService = {
  testConnection: async () => {
    const response = await apiClient.get(API_ENDPOINTS.TEST);
    return response.data;
  },

  getProtectedData: async () => {
    const response = await apiClient.get(API_ENDPOINTS.PROTECTED);
    return response.data;
  }
};

export default apiClient;
