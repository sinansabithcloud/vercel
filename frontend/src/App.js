import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Homepage from './components/Homepage';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import { getUser, getToken, clearAuthData } from './utils/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = () => {
      try {
        const token = getToken();
        const savedUser = getUser();
        
        if (token && savedUser) {
          setUser(savedUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
        setError('Authentication error. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setError(null);
  };

  const handleSignUp = (userData) => {
    setUser(userData);
    setError(null);
  };

  const handleLogout = () => {
    try {
      clearAuthData();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Loading application..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <Routes>
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLogin={handleLogin} onError={handleError} />
                )
              } 
            />
            <Route 
              path="/signup" 
              element={
                user ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <SignUp onSignUp={handleSignUp} onError={handleError} />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                user ? (
                  <Homepage user={user} onLogout={handleLogout} onError={handleError} />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/" 
              element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
            />
            {/* Catch all route */}
            <Route 
              path="*" 
              element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
