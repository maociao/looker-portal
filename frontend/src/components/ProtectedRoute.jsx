// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, token, loading, logout } = useContext(AuthContext);

  // Add JWT expiration check
  useEffect(() => {
    if (token) {
      try {
        // JWT tokens have 3 parts separated by dots
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds

        // If token is expired, logout
        if (Date.now() >= expirationTime) {
          logout();
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
        logout();
      }
    }
  }, [token, logout]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if route requires specific roles
  if (roles && !roles.includes(user.role)) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and has required role, render the children
  return children;
};

export default ProtectedRoute;