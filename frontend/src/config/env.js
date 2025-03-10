// This file allows environment variables to be loaded from window.ENV in production
// or from import.meta.env during development

// Check if we're in production and have window.ENV available
const isProduction = import.meta.env.MODE === 'production';
const hasWindowEnv = typeof window !== 'undefined' && window.ENV;

// Priority: window.ENV (runtime) > import.meta.env (build time)
export const getEnvVariable = (key, defaultValue = '') => {
  if (isProduction && hasWindowEnv && window.ENV[key] !== undefined) {
    return window.ENV[key];
  }
  
  if (import.meta.env[key] !== undefined) {
    return import.meta.env[key];
  }
  
  return defaultValue;
};

// Export specific environment variables
export const API_URL = getEnvVariable('VITE_API_URL', 'http://localhost:8080');
export const LOOKER_HOST = getEnvVariable('VITE_LOOKER_HOST', 'mock.looker.com');
export const USE_MOCK_LOOKER = getEnvVariable('VITE_USE_MOCK_LOOKER', 'true') === 'true';
export const USE_MOCK_API = getEnvVariable('VITE_USE_MOCK_API', 'false') === 'true';