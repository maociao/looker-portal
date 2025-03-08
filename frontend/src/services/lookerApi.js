import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get all available Looker dashboards
 * @param {string} token - JWT authentication token
 * @returns {Promise<Array>} Array of dashboard objects
 */
export const getLookerDashboards = async (token) => {
  try {
    const response = await api.get('/api/looker/dashboards', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.dashboards;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch dashboards'
    );
  }
};

/**
 * Get a specific Looker dashboard by ID
 * @param {string} dashboardId - The Looker dashboard ID
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Dashboard object
 */
export const getLookerDashboardById = async (dashboardId, token) => {
  try {
    const response = await api.get(`/api/looker/dashboards/${dashboardId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.dashboard;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to fetch dashboard'
    );
  }
};

/**
 * Download dashboard as Excel
 * @param {string} dashboardId - The Looker dashboard ID
 * @param {string} token - JWT authentication token
 * @returns {Promise<Blob>} Excel file as blob
 */
export const downloadDashboardExcel = async (dashboardId, token) => {
  try {
    const response = await api.get(`/api/looker/dashboards/${dashboardId}/excel`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to download Excel'
    );
  }
};

/**
 * Download dashboard as PDF
 * @param {string} dashboardId - The Looker dashboard ID
 * @param {string} token - JWT authentication token
 * @returns {Promise<Blob>} PDF file as blob
 */
export const downloadDashboardPdf = async (dashboardId, token) => {
  try {
    const response = await api.get(`/api/looker/dashboards/${dashboardId}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to download PDF'
    );
  }
};

/**
 * Test the Looker API connectivity
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Status object
 */
export const testLookerConnection = async (token) => {
  try {
    const response = await api.get('/api/looker/status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to connect to Looker API'
    );
  }
};