// Authentication helper functions
export const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const setAuthData = (token, user) => {
  try {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error setting auth data:', error);
    throw new Error('Failed to save authentication data');
  }
};

export const clearAuthData = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

// Form validation helpers
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateUsername = (username) => {
  const trimmedUsername = username?.trim();
  return trimmedUsername && 
         trimmedUsername.length >= 3 && 
         /^[a-zA-Z0-9_]+$/.test(trimmedUsername);
};

// Password strength checker
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, feedback: 'Password is required' };
  
  let score = 0;
  const feedback = [];
  
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Include numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Include special characters');
  
  const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  
  return {
    score,
    strength,
    feedback: feedback.length > 0 ? feedback : ['Password looks good!']
  };
};

// Utility to format display names
export const formatDisplayName = (user) => {
  if (!user) return '';
  return user.username || user.email || 'User';
};

// Check if running in production
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};
