import axios from 'axios';
import { API_URL } from '../config/env';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response && error.response.status === 401) {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = '/login';
  }
  throw error;
};

// Authentication
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/api/login', { email, password });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to login'
    );
  }
};

// Password Change
export const changePassword = async (currentPassword, newPassword, token) => {
  try {
    const response = await api.post('/api/change-password', 
      { currentPassword, newPassword }, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to change password'
    );
  }
};

// Looker Embedding
export const getLookerEmbedUrl = async (token, dashboardId) => {
  try {
    let url = '/api/looker/embed';
    if (dashboardId) {
      url += `?dashboardId=${dashboardId}`;
    }
    
    const response = await api.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to get dashboard URL'
    );
  }
};

// Get user's accessible dashboards
export const getUserDashboards = async (token) => {
  try {
    const response = await api.get('/api/looker/user-dashboards', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch user dashboards'
    );
  }
};

// User Management
export const getUsers = async (token) => {
  try {
    const response = await api.get('/api/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch users'
    );
  }
};

export const createUser = async (userData, token) => {
  try {
    const response = await api.post('/api/users', userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to create user'
    );
  }
};

export const updateUser = async (userId, userData, token) => {
  try {
    const response = await api.put(`/api/users/${userId}`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to update user'
    );
  }
};

export const deleteUser = async (userId, token) => {
  try {
    const response = await api.delete(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to delete user'
    );
  }
};

// Business Partner Management
export const getBusinessPartners = async (token) => {
  try {
    const response = await api.get('/api/business-partners', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch business partners'
    );
  }
};

export const createBusinessPartner = async (partnerData, token) => {
  try {
    const response = await api.post('/api/business-partners', partnerData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to create business partner'
    );
  }
};

export const updateBusinessPartner = async (partnerId, partnerData, token) => {
  try {
    const response = await api.put(`/api/business-partners/${partnerId}`, partnerData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to update business partner'
    );
  }
};

export const deleteBusinessPartner = async (partnerId, token) => {
  try {
    const response = await api.delete(`/api/business-partners/${partnerId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw new Error(
      error.response?.data?.message || 'Failed to delete business partner'
    );
  }
};