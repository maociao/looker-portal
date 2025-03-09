// src/services/api.js
import * as realApi from './realApi';
import * as mockApi from './mockApi';

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';
const USE_MOCK_LOOKER = import.meta.env.VITE_USE_MOCK_LOOKER === 'true';

// Export all API functions, using either real or mock implementation
export const loginUser = USE_MOCK_API ? mockApi.loginUser : realApi.loginUser;
export const getLookerEmbedUrl = USE_MOCK_LOOKER ? mockApi.getLookerEmbedUrl : realApi.getLookerEmbedUrl;
export const getUsers = USE_MOCK_API ? mockApi.getUsers : realApi.getUsers;
export const createUser = USE_MOCK_API ? mockApi.createUser : realApi.createUser;
export const updateUser = USE_MOCK_API ? mockApi.updateUser : realApi.updateUser;
export const deleteUser = USE_MOCK_API ? mockApi.deleteUser : realApi.deleteUser;
export const getBusinessPartners = USE_MOCK_API ? mockApi.getBusinessPartners : realApi.getBusinessPartners;
export const createBusinessPartner = USE_MOCK_API ? mockApi.createBusinessPartner : realApi.createBusinessPartner;
export const updateBusinessPartner = USE_MOCK_API ? mockApi.updateBusinessPartner : realApi.updateBusinessPartner;
export const deleteBusinessPartner = USE_MOCK_API ? mockApi.deleteBusinessPartner : realApi.deleteBusinessPartner;