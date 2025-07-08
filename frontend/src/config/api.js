const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  PROTECTED: `${API_BASE_URL}/api/protected`,
  TEST: `${API_BASE_URL}/api/test`
};

export default API_BASE_URL;
