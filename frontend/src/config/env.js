// This file handles environment variables with sensible defaults
// For production, these will be replaced with the actual values at build time

// Export specific environment variables directly from import.meta.env
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const LOOKER_HOST = import.meta.env.VITE_LOOKER_HOST || 'mock.looker.com';
export const USE_MOCK_LOOKER = (import.meta.env.VITE_USE_MOCK_LOOKER || 'true') === 'true';
export const USE_MOCK_API = (import.meta.env.VITE_USE_MOCK_API || 'false') === 'true';