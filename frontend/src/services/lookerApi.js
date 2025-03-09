// src/services/lookerApi.js
import * as realLookerApi from './realLookerApi';
import * as mockApi from './mockApi';

const USE_MOCK_LOOKER = import.meta.env.VITE_USE_MOCK_LOOKER === 'true';

// Export all Looker API functions
export const getLookerDashboards = USE_MOCK_LOOKER ? mockApi.getLookerDashboards : realLookerApi.getLookerDashboards;
export const getLookerDashboardById = USE_MOCK_LOOKER ? mockApi.getLookerDashboardById : realLookerApi.getLookerDashboardById;
export const downloadDashboardExcel = USE_MOCK_LOOKER ? mockApi.downloadDashboardExcel : realLookerApi.downloadDashboardExcel;
export const downloadDashboardPdf = USE_MOCK_LOOKER ? mockApi.downloadDashboardPdf : realLookerApi.downloadDashboardPdf;
export const testLookerConnection = USE_MOCK_LOOKER ? mockApi.testLookerConnection : realLookerApi.testLookerConnection;
