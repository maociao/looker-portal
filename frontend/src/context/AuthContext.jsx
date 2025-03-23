// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/env';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Refresh token function - call this when JWT expires
  const refreshAccessToken = useCallback(async () => {
    try {
      if (!refreshToken) return false;
      
      const response = await axios.post(`${API_URL}/api/refresh-token`, { 
        refreshToken 
      });
      
      if (response.data && response.data.token) {
        const newToken = response.data.token;
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout(); // If refresh fails, force logout
      return false;
    }
  }, [refreshToken]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  // Setup axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Try to refresh the token
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            // Update the request with new token and retry
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          } else {
            // Force redirect to login if refresh fails
            logout();
            // Optional: redirect to login page here if using outside React Router
            //window.location.href = '/login';
            return Promise.reject(error);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshAccessToken, token, logout]);

  // Check for existing tokens on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        // Check if token is expired before setting it
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        
        if (Date.now() < expirationTime) {
          // Token is still valid
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Token is expired, try to refresh
          setRefreshToken(storedRefreshToken);
          refreshAccessToken().catch(() => {
            // Clear invalid data if refresh fails
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          });
        }
      } catch (error) {
        // Clear invalid data
        console.error('Error parsing stored authentication data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      refreshToken,
      setUser, 
      setToken, 
      setRefreshToken,
      refreshAccessToken,
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};