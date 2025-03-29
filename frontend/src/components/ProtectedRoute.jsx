// src/components/ProtectedRoute.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
  const { user, token, loading, logout, refreshAccessToken } = useContext(AuthContext);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check token expiration and attempt refresh if needed
  useEffect(() => {
    const checkTokenExpiration = async () => {
      if (!token) return;
      
      try {
        // Parse token to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        
        // If token is expired or about to expire (in next 5 minutes)
        if (Date.now() >= expirationTime - 300000) { // 5 min buffer
          setIsRefreshing(true);
          // Try to refresh the token before logging out
          const refreshSuccess = await refreshAccessToken();
          setIsRefreshing(false);
          
          // Only logout if refresh failed
          if (!refreshSuccess) {
            logout();
          }
        }
      } catch (error) {
        console.error('Error checking token expiration:', error);
        // If error in parsing token, it's probably invalid
        logout();
      }
    };
    
    checkTokenExpiration();
  }, [token, refreshAccessToken, logout]);

  // Show loading spinner while checking authentication or refreshing token
  if (loading || isRefreshing) {
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