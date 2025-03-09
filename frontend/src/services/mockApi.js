// src/services/mockApi.js
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this package

// Sample data
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    businessPartnerId: '1',
    businessPartnerName: 'Test Company',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'user@partner1.com',
    firstName: 'Regular',
    lastName: 'User',
    role: 'user',
    businessPartnerId: '1',
    businessPartnerName: 'Test Company',
    createdAt: new Date().toISOString()
  }
];

const mockPartners = [
  {
    id: '1',
    name: 'Test Company',
    contactEmail: 'contact@testcompany.com',
    assignedDashboards: ['1', '2', '3'],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Partner 2',
    contactEmail: 'contact@partner2.com',
    assignedDashboards: ['1'],
    createdAt: new Date().toISOString()
  }
];

const mockDashboards = [
  {
    id: '1',
    title: 'Sales Overview Dashboard',
    description: 'Monthly sales performance',
    user_id: 'admin',
    dashboardType: 'sales'
  },
  {
    id: '2',
    title: 'Marketing Performance',
    description: 'Campaign effectiveness metrics',
    user_id: 'admin',
    dashboardType: 'marketing'
  },
  {
    id: '3',
    title: 'Customer Analytics',
    description: 'Customer behavior and segmentation',
    user_id: 'admin',
    dashboardType: 'customer'
  }
];

// Authentication
export const loginUser = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email);
      
      if (user && (password === 'password' || password === 'admin')) {
        // Find the business partner to get their assigned dashboards
        const partner = mockPartners.find(p => p.id === user.businessPartnerId);
        
        resolve({
          token: 'mock-jwt-token-' + uuidv4(),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            businessPartnerId: user.businessPartnerId,
            businessPartnerName: user.businessPartnerName,
            // Include assigned dashboards in the user object for convenience
            assignedDashboards: partner?.assignedDashboards || []
          }
        });
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 800); // Simulate network delay
  });
};

// Looker Embedding
export const getLookerEmbedUrl = async (token, dashboardId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Include the dashboardId in the mock URL if provided
      const dashboardIdToUse = dashboardId || '1';
      resolve({
        embeddedUrl: `https://demo.looker.com/embed/dashboards/${dashboardIdToUse}?session_length=3600`
      });
    }, 800);
  });
};

// Get accessible dashboards for the current user
export const getUserDashboards = async (token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Parse the token to get the user info (in a real app, this would be done on the server)
      // In our mock, we'll just return all dashboards
      const availableDashboards = mockDashboards.map(dashboard => ({
        id: dashboard.id,
        title: dashboard.title,
        description: dashboard.description,
        dashboardType: dashboard.dashboardType
      }));
      
      resolve({ dashboards: availableDashboards });
    }, 800);
  });
};

// User Management
export const getUsers = async (token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ users: [...mockUsers] });
    }, 800);
  });
};

export const createUser = async (userData, token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newUser = {
        id: uuidv4(),
        ...userData,
        createdAt: new Date().toISOString()
      };
      
      // In a real app, we would add this to the database
      mockUsers.push(newUser);
      
      resolve({ 
        message: 'User created successfully',
        user: newUser
      });
    }, 800);
  });
};

export const updateUser = async (userId, userData, token) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userIndex = mockUsers.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        reject(new Error('User not found'));
        return;
      }
      
      const updatedUser = {
        ...mockUsers[userIndex],
        ...userData
      };
      
      mockUsers[userIndex] = updatedUser;
      
      resolve({ 
        message: 'User updated successfully',
        user: updatedUser
      });
    }, 800);
  });
};

export const deleteUser = async (userId, token) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userIndex = mockUsers.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        reject(new Error('User not found'));
        return;
      }
      
      mockUsers.splice(userIndex, 1);
      
      resolve({ message: 'User deleted successfully' });
    }, 800);
  });
};

// Business Partner Management
export const getBusinessPartners = async (token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ partners: [...mockPartners] });
    }, 800);
  });
};

export const createBusinessPartner = async (partnerData, token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPartner = {
        id: uuidv4(),
        ...partnerData,
        createdAt: new Date().toISOString()
      };
      
      mockPartners.push(newPartner);
      
      resolve({ 
        message: 'Business partner created successfully',
        partner: newPartner
      });
    }, 800);
  });
};

export const updateBusinessPartner = async (partnerId, partnerData, token) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const partnerIndex = mockPartners.findIndex(p => p.id === partnerId);
      
      if (partnerIndex === -1) {
        reject(new Error('Business partner not found'));
        return;
      }
      
      const updatedPartner = {
        ...mockPartners[partnerIndex],
        ...partnerData
      };
      
      mockPartners[partnerIndex] = updatedPartner;
      
      resolve({ 
        message: 'Business partner updated successfully',
        partner: updatedPartner
      });
    }, 800);
  });
};

export const deleteBusinessPartner = async (partnerId, token) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const partnerIndex = mockPartners.findIndex(p => p.id === partnerId);
      
      if (partnerIndex === -1) {
        reject(new Error('Business partner not found'));
        return;
      }
      
      mockPartners.splice(partnerIndex, 1);
      
      resolve({ message: 'Business partner deleted successfully' });
    }, 800);
  });
};

// Mock Looker dashboards API
export const getLookerDashboards = async (token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDashboards);
    }, 800);
  });
};

export const getLookerDashboardById = async (dashboardId, token) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const dashboard = mockDashboards.find(d => d.id === dashboardId);
      
      if (!dashboard) {
        reject(new Error('Dashboard not found'));
        return;
      }
      
      resolve(dashboard);
    }, 800);
  });
};

export const downloadDashboardExcel = async (dashboardId, token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a mock Blob that simulates an Excel file
      resolve(new Blob(['Mock Excel data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    }, 1500);
  });
};

export const downloadDashboardPdf = async (dashboardId, token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a mock Blob that simulates a PDF file
      resolve(new Blob(['Mock PDF data'], { type: 'application/pdf' }));
    }, 1500);
  });
};

export const testLookerConnection = async (token) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ 
        status: 'connected',
        lookerUser: 'Mock Looker User',
        lookerVersion: '23.4'
      });
    }, 800);
  });
};