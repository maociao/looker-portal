// This file handles environment variables with sensible defaults
// For production, these will be replaced with the actual values at build time

// Function to get environment variables from window.ENV (runtime) or import.meta.env (development)
const getEnvVar = (key, defaultValue) => {
    // Check if window.ENV exists (production runtime)
    if (window.ENV && window.ENV[key] !== undefined) {
      return window.ENV[key];
    }
    
    // Otherwise use import.meta.env (build-time variables in development)
    return import.meta.env[key] || defaultValue;
  };
  
  // Export environment variables
  export const API_URL = getEnvVar('VITE_API_URL', 'http://localhost:8080');
  export const LOOKER_HOST = getEnvVar('VITE_LOOKER_HOST', 'mock.looker.com');
  export const USE_MOCK_LOOKER = (getEnvVar('VITE_USE_MOCK_LOOKER', 'true') === 'true');
  export const USE_MOCK_API = (getEnvVar('VITE_USE_MOCK_API', 'false') === 'true');