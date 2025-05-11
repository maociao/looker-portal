// This file handles environment variables with sensible defaults
// For production, these will be replaced with the actual values at build time

// Function to get environment variables from window.ENV (runtime) or import.meta.env (development)
const getEnvVar = (key, defaultValue) => {
  // Check if window.ENV exists (production runtime)
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key] !== undefined) {
    return window.ENV[key];
  }
  
  // Otherwise use import.meta.env (build-time variables in development)
  if (import.meta && import.meta.env && import.meta.env[key] !== undefined) {
    return import.meta.env[key];
  }
  
  // Fallback to default value
  return defaultValue;
};

// Export environment variables with default values
export const API_URL = getEnvVar('VITE_API_URL', 'http://localhost:8080');
export const LOOKER_HOST = getEnvVar('VITE_LOOKER_HOST', 'mock.looker.com');
export const USE_MOCK_LOOKER = getEnvVar('VITE_USE_MOCK_LOOKER', 'false');
export const USE_MOCK_API = getEnvVar('VITE_USE_MOCK_API', 'false');
export const APP_NAME = getEnvVar('VITE_APP_NAME', 'Looker Portal');
export const APP_NAME_LOWER = getEnvVar('VITE_APP_NAME_LOWER', 'looker-portal');
export const DEPLOY_REGION = getEnvVar('VITE_DEPLOY_REGION', 'us-central1');

// For debugging
console.log('Environment variables loaded:');
console.log('APP_NAME:', APP_NAME);
console.log('API_URL:', API_URL);
console.log('LOOKER_HOST:', LOOKER_HOST);
console.log('USE_MOCK_LOOKER:', USE_MOCK_LOOKER);