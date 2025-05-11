require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Firestore } = require('@google-cloud/firestore');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const NodeCache = require('node-cache');
const lookerService = require('./services/lookerService');

// Check if we should use mock Looker services
const USE_MOCK_LOOKER = process.env.USE_MOCK_LOOKER === 'true' || !process.env.LOOKER_HOST;

// Initialize Looker SDK conditionally
let lookerSDK = null;
if (!USE_MOCK_LOOKER) {
  try {
    // Initialize the service when server starts
    lookerService.initialize().then(sdk => {
      lookerSDK = sdk;
      console.log('Looker SDK initialized successfully');
    }).catch(error => {
      console.error('Failed to initialize Looker SDK:', error);
    });
  } catch (error) {
    console.error('Error setting up Looker service:', error);
  }
}

// Create a cache instance with default TTL of 60 minutes and refresh interval of 30 minutes
const DASHBOARD_CACHE_TTL = parseInt(process.env.DASHBOARD_CACHE_TTL || '3600', 10);
const CACHE_REFRESH_INTERVAL = parseInt(process.env.CACHE_REFRESH_INTERVAL || '1800000', 10);

const dashboardCache = new NodeCache({ stdTTL: DASHBOARD_CACHE_TTL, checkperiod: 120 });
const DASHBOARD_CACHE_KEY = 'all_dashboards';
let cacheUpdateInProgress = false;

// Function to update dashboard cache
async function updateDashboardCache() {
  // Prevent multiple simultaneous update requests
  if (cacheUpdateInProgress) return;

  cacheUpdateInProgress = true;
  try {
    console.log('Updating dashboard cache...');
    const dashboards = await lookerSDK.ok(lookerSDK.all_dashboards());
    dashboardCache.set(DASHBOARD_CACHE_KEY, dashboards);
    console.log(`Dashboard cache updated with ${dashboards.length} dashboards`);
  } catch (error) {
    console.error('Error updating dashboard cache:', error);
  } finally {
    cacheUpdateInProgress = false;
  }
}

// Set up a timer to periodically refresh the dashboard cache
if (lookerSDK) {
  setInterval(() => {
    updateDashboardCache().catch(err => {
      console.error('Scheduled dashboard cache refresh failed:', err);
    });
  }, CACHE_REFRESH_INTERVAL);
}

// Initialize Express app
const app = express();

// Trust the X-Forwarded-For header from Cloud Run proxy
app.set('trust proxy', 1);

app.use(express.json());

// Enable CORS
const allowedOrigins = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['*'];
console.log('Allowed CORS origins:', allowedOrigins);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is allowed or if we're allowing any origin
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS policy. Allowed origins:`, allowedOrigins);
      callback(null, true); // Still allow for debugging (change to false in production)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization']
}));

// Add OPTIONS response for preflight requests
app.options('*', cors());

// Update Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'",],
      connectSrc: ["'self'", process.env.LOOKER_HOST],
      frameSrc: ["'self'", process.env.LOOKER_HOST],
      imgSrc: ["'self'", "data:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Initialize Firestore
const projectId = process.env.GOOGLE_CLOUD_PROJECT; // Your project ID
const databaseId = process.env.FIRESTORE_DATABASE_ID; // Your custom database name

console.log(`Attempting to connect to Firestore database '${databaseId}' in project: ${projectId}`);

const firestore = new Firestore({
  projectId: projectId,
  databaseId: databaseId
});

const usersCollection = firestore.collection('users');
const businessPartnersCollection = firestore.collection('businessPartners');
// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;
// Setup JWT secret
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

// Looker embedding secrets
const LOOKER_EMBED_SECRET = process.env.LOOKER_EMBED_SECRET;
const LOOKER_HOST = process.env.LOOKER_HOST;

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Firestore Connection Test Route
app.get('/api/test-firestore', async (req, res) => {
  try {
    const snapshot = await firestore.collection('users').limit(1).get();
    res.json({ success: true, message: 'Connected to Firestore successfully' });
  } catch (error) {
    console.error('Firestore connection error:', error);
    res.status(500).json({ success: false, message: 'Failed to connect to Firestore' });
  }
});

// Rate Limiting Middleware
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts per window
  message: { message: 'Too many login attempts, please try again later' },
  trustProxy: false,
});

// Authentication Routes
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in database
    const userSnapshot = await usersCollection.where('email', '==', email).limit(1).get();

    if (userSnapshot.empty) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userData = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id;

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);
    if (!passwordMatch) {
      // Increment failed login attempts
      const failedAttempts = (userData.failedLoginAttempts || 0) + 1;
      await usersCollection.doc(userId).update({
        failedLoginAttempts: failedAttempts,
        lastFailedLogin: new Date()
      });

      // If too many failures, lock the account
      if (failedAttempts >= 5) {
        await usersCollection.doc(userId).update({
          accountLocked: true,
          lockExpiration: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        });
        return res.status(401).json({ message: 'Account locked. Please try again later.' });
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If account is locked, check if it's expired
    if (userData.accountLocked && userData.lockExpiration > new Date()) {
      return res.status(401).json({ message: 'Account locked. Please try again later.' });
    }

    // Reset failed attempts on successful login
    await usersCollection.doc(userId).update({
      failedLoginAttempts: 0,
      accountLocked: false,
      lastLogin: new Date()
    });

    // Get business partner details
    const businessPartnerSnapshot = await businessPartnersCollection.doc(userData.businessPartnerId).get();
    if (!businessPartnerSnapshot.exists) {
      return res.status(404).json({ message: 'Business partner not found' });
    }

    const businessPartnerData = businessPartnerSnapshot.data();

    // Create JWT token
    const token = jwt.sign({
      userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      businessPartnerId: userData.businessPartnerId,
      businessPartnerName: businessPartnerData.name
    }, JWT_SECRET, { expiresIn: '15m' });

    // Refresh token mechanism
    const refreshToken = jwt.sign({
      userId
    }, REFRESH_TOKEN_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      refreshToken,
      user: {
        id: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        businessPartnerId: userData.businessPartnerId,
        businessPartnerName: businessPartnerData.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this after your login route
app.post('/api/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    // Verify the refresh token
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Invalid refresh token' });

      // Find user in database to ensure they still exist and have access
      const userDoc = await usersCollection.doc(decoded.userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = userDoc.data();

      // Get business partner details
      const businessPartnerSnapshot = await businessPartnersCollection
        .doc(userData.businessPartnerId).get();

      if (!businessPartnerSnapshot.exists) {
        return res.status(404).json({ message: 'Business partner not found' });
      }

      const businessPartnerData = businessPartnerSnapshot.data();

      // Create new access token (shorter lived)
      const token = jwt.sign({
        userId: decoded.userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        businessPartnerId: userData.businessPartnerId,
        businessPartnerName: businessPartnerData.name
      }, JWT_SECRET, { expiresIn: '15m' });

      // Return the new access token
      res.json({ token });
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Password Change Route
app.post('/api/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Input validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Password strength validation
    if (newPassword.length < 10) {
      return res.status(400).json({ message: 'Password must be at least 10 characters long' });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one special character' });
    }

    // Get user from database
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, userData.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await usersCollection.doc(userId).update({
      passwordHash: newPasswordHash,
      passwordLastChanged: new Date()
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Looker Embedding Route
app.get('/api/looker/embed', authenticateToken, async (req, res) => {
  try {
    const { userId, role, firstName, lastName, businessPartnerId } = req.user;
    
    // For non-admin users, verify they have access to this dashboard
    let assignedDashboards = [];
    if (role !== 'admin') {
      // Get business partner's assigned dashboards
      const businessPartnerSnapshot = await businessPartnersCollection.doc(businessPartnerId).get();
      if (!businessPartnerSnapshot.exists) {
        return res.status(404).json({ message: 'Business partner not found' });
      }

      const businessPartner = businessPartnerSnapshot.data();
      assignedDashboards = businessPartner.assignedDashboards || [];

      if (assignedDashboards.length === 0) {
        return res.status(404).json({ message: 'No dashboards assigned to this business partner' });
      }
    }

    // Get the dashboard ID from the query parameter or use the first dashboard
    const dashboardId = req.query.dashboardId || (assignedDashboards.length > 0 ? assignedDashboards[0] : null);
    
    if (!dashboardId) {
      return res.status(400).json({ message: 'Dashboard ID is required' });
    }

    // Get frontend domain for embedding
    const frontendDomain = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Helper function to force Unicode encoding (same as in the sample code)
    function forceUnicodeEncoding(string) {
      return decodeURIComponent(encodeURIComponent(string));
    }
    
    // Generate a random nonce
    function nonce(length) {
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let text = '';
      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    }

    // Build option parameters exactly as in the static HTML tool
    const host = LOOKER_HOST;
    const embed_path = `/embed/dashboards/${dashboardId}?embed_domain=${frontendDomain}`;
    const permissions = ["access_data", "see_looks", "see_user_dashboards", "see_lookml_dashboards"];
    const models = ["maastricht"];
    
    // Create JSON strings for each parameter - EXACTLY as in the sample code
    const json_external_user_id = JSON.stringify(userId);
    const json_first_name = JSON.stringify(firstName);
    const json_last_name = JSON.stringify(lastName);
    const json_permissions = JSON.stringify(permissions);
    const json_models = JSON.stringify(models);
    const json_group_ids = JSON.stringify([]);
    const json_external_group_id = JSON.stringify("");
    const json_user_attributes = JSON.stringify({});
    const json_access_filters = JSON.stringify({});
    const json_session_length = JSON.stringify(600);
    const json_force_logout_login = JSON.stringify(true);
    
    // Compute time and nonce
    const json_time = JSON.stringify(Math.floor(Date.now() / 1000));
    const json_nonce = JSON.stringify(nonce(16));
    
    // URL encode the embed path for the string to sign
    const encoded_embed_path = '/login/embed/' + encodeURIComponent(embed_path);
    
    // Build the string to sign - ORDER IS IMPORTANT
    let string_to_sign = "";
    string_to_sign += host + "\n";
    string_to_sign += encoded_embed_path + "\n";
    string_to_sign += json_nonce + "\n";
    string_to_sign += json_time + "\n";
    string_to_sign += json_session_length + "\n";
    string_to_sign += json_external_user_id + "\n";
    string_to_sign += json_permissions + "\n";
    string_to_sign += json_models + "\n";
    string_to_sign += json_group_ids + "\n";
    string_to_sign += json_external_group_id + "\n";
    string_to_sign += json_user_attributes + "\n";
    string_to_sign += json_access_filters;
    
    // Create the signature using the same approach as the static HTML tool
    const signature = crypto
      .createHmac('sha1', LOOKER_EMBED_SECRET)
      .update(forceUnicodeEncoding(string_to_sign))
      .digest('base64')
      .trim();
    
    // Build the query parameters - maintaining exact order
    const query_params = [
      `nonce=${encodeURIComponent(json_nonce)}`,
      `time=${encodeURIComponent(json_time)}`,
      `session_length=${encodeURIComponent(json_session_length)}`,
      `external_user_id=${encodeURIComponent(json_external_user_id)}`,
      `permissions=${encodeURIComponent(json_permissions)}`,
      `models=${encodeURIComponent(json_models)}`,
      `group_ids=${encodeURIComponent(json_group_ids)}`,
      `external_group_id=${encodeURIComponent(json_external_group_id)}`,
      `user_attributes=${encodeURIComponent(json_user_attributes)}`,
      `access_filters=${encodeURIComponent(json_access_filters)}`,
      `first_name=${encodeURIComponent(json_first_name)}`,
      `last_name=${encodeURIComponent(json_last_name)}`,
      `force_logout_login=${encodeURIComponent(json_force_logout_login)}`,
      `signature=${encodeURIComponent(signature)}`
    ].join('&');

    // Create the final URL
    const embeddedUrl = `https://${host}/login/embed/${encodeURIComponent(embed_path)}?${query_params}`;
    
    res.json({ embeddedUrl });
  } catch (error) {
    console.error('Looker embed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Management Routes (Admin Only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const usersSnapshot = await usersCollection.get();
    const users = [];

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        businessPartnerId: userData.businessPartnerId,
        createdAt: userData.createdAt
      });
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const { body, validationResult } = require('express-validator');

app.post('/api/users',
  authenticateToken,
  [
    body('email').isEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role').isIn(['admin', 'user']).withMessage('Invalid role'),
    body('businessPartnerId').notEmpty().withMessage('Business partner required'),
    body('password')
      .isLength({ min: 10 }).withMessage('Password must be at least 10 characters long')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const { email, firstName, lastName, password, role, businessPartnerId } = req.body;

      // Verify business partner exists
      const businessPartnerSnapshot = await businessPartnersCollection.doc(businessPartnerId).get();
      if (!businessPartnerSnapshot.exists) {
        return res.status(404).json({ message: 'Business partner not found' });
      }

      // Check if email is already in use
      const existingUserSnapshot = await usersCollection.where('email', '==', email).limit(1).get();
      if (!existingUserSnapshot.empty) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = {
        email,
        firstName,
        lastName,
        passwordHash,
        role,
        businessPartnerId,
        createdAt: new Date(),
        lastLogin: null,
        failedLoginAttempts: 0
      };

      const userRef = await usersCollection.add(newUser);

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: userRef.id,
          email,
          firstName,
          lastName,
          role,
          businessPartnerId,
          createdAt: newUser.createdAt
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// User Update Route
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const userId = req.params.id;
    const { firstName, lastName, email, password, role, businessPartnerId } = req.body;

    // Verify user exists
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify business partner exists
    const businessPartnerSnapshot = await businessPartnersCollection.doc(businessPartnerId).get();
    if (!businessPartnerSnapshot.exists) {
      return res.status(404).json({ message: 'Business partner not found' });
    }

    // Check if email is already in use by another user
    if (email !== userDoc.data().email) {
      const existingUserSnapshot = await usersCollection.where('email', '==', email).limit(1).get();
      if (!existingUserSnapshot.empty && existingUserSnapshot.docs[0].id !== userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Prepare update data
    const updateData = {
      firstName,
      lastName,
      email,
      role,
      businessPartnerId
    };

    // Only update password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update user
    await usersCollection.doc(userId).update(updateData);

    res.json({
      message: 'User updated successfully',
      user: {
        id: userId,
        ...updateData,
        passwordHash: undefined // Don't return the password hash
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Delete Route
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const userId = req.params.id;

    // Verify user exists
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await usersCollection.doc(userId).delete();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Business Partner Management Routes (Admin Only)
app.get('/api/business-partners', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const partnersSnapshot = await businessPartnersCollection.get();
    const partners = [];

    partnersSnapshot.forEach(doc => {
      const partnerData = doc.data();
      partners.push({
        id: doc.id,
        name: partnerData.name,
        contactEmail: partnerData.contactEmail,
        assignedDashboards: partnerData.assignedDashboards || [],
        createdAt: partnerData.createdAt
      });
    });

    res.json({ partners });
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/business-partners', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { name, contactEmail, assignedDashboards } = req.body;

    // Create new business partner
    const newPartner = {
      name,
      contactEmail,
      assignedDashboards: assignedDashboards || [],
      createdAt: new Date()
    };

    const partnerRef = await businessPartnersCollection.add(newPartner);

    res.status(201).json({
      message: 'Business partner created successfully',
      partner: {
        id: partnerRef.id,
        ...newPartner
      }
    });
  } catch (error) {
    console.error('Create partner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Business Partner Update Route
app.put('/api/business-partners/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const partnerId = req.params.id;
    const { name, contactEmail, assignedDashboards } = req.body;

    // Verify business partner exists
    const partnerDoc = await businessPartnersCollection.doc(partnerId).get();
    if (!partnerDoc.exists) {
      return res.status(404).json({ message: 'Business partner not found' });
    }

    // Prepare update data
    const updateData = {
      name,
      contactEmail,
      assignedDashboards: assignedDashboards || []
    };

    // Update business partner
    await businessPartnersCollection.doc(partnerId).update(updateData);

    res.json({
      message: 'Business partner updated successfully',
      partner: {
        id: partnerId,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Update partner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Business Partner Delete Route
app.delete('/api/business-partners/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const partnerId = req.params.id;

    // Verify business partner exists
    const partnerDoc = await businessPartnersCollection.doc(partnerId).get();
    if (!partnerDoc.exists) {
      return res.status(404).json({ message: 'Business partner not found' });
    }

    // Check if any users are associated with this business partner
    const usersSnapshot = await usersCollection.where('businessPartnerId', '==', partnerId).limit(1).get();
    if (!usersSnapshot.empty) {
      return res.status(400).json({
        message: 'Cannot delete business partner with associated users. Please reassign or delete those users first.'
      });
    }

    // Delete business partner
    await businessPartnersCollection.doc(partnerId).delete();

    res.json({ message: 'Business partner deleted successfully' });
  } catch (error) {
    console.error('Delete partner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Looker Dashboard Management Routes
app.get('/api/looker/dashboards', authenticateToken, async (req, res) => {
  try {
    // Only admins and users should access this
    if (!['admin', 'user'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get dashboards from cache if available
    let dashboards = dashboardCache.get(DASHBOARD_CACHE_KEY);

    // If cache is empty or expired, get from Looker and trigger background update
    if (!dashboards) {
      console.log('Cache miss for dashboards, fetching from Looker...');
      try {
        dashboards = await lookerSDK.ok(lookerSDK.all_dashboards());
        // Store in cache
        dashboardCache.set(DASHBOARD_CACHE_KEY, dashboards);
      } catch (error) {
        console.error('Error fetching dashboards directly:', error);
        return res.status(500).json({ message: 'Failed to fetch dashboards' });
      }
    } else {
      // If cache hit, trigger background refresh to keep cache fresh
      setTimeout(() => updateDashboardCache(), 100);
    }

    // For non-admin users, filter to only show dashboards assigned to their business partner
    if (req.user.role !== 'admin') {
      const businessPartnerId = req.user.businessPartnerId;

      // Get the business partner document
      const businessPartnerSnapshot = await businessPartnersCollection.doc(businessPartnerId).get();

      if (!businessPartnerSnapshot.exists) {
        return res.status(404).json({ message: 'Business partner not found' });
      }

      const businessPartner = businessPartnerSnapshot.data();
      const assignedDashboards = businessPartner.assignedDashboards || [];

      // Filter to only include assigned dashboards
      const filteredDashboards = dashboards.filter(dashboard =>
        assignedDashboards.includes(dashboard.id.toString())
      );

      return res.json({ dashboards: filteredDashboards });
    }
    return res.json({ dashboards });
  } catch (error) {
    console.error('Looker dashboards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Looker Dashboard Details Route
app.get('/api/looker/dashboards/:id', authenticateToken, async (req, res) => {
  try {
    const dashboardId = req.params.id;

    // For non-admin users, verify they have access to this dashboard
    if (req.user.role !== 'admin') {
      const businessPartnerSnapshot = await businessPartnersCollection.doc(req.user.businessPartnerId).get();
      if (!businessPartnerSnapshot.exists) {
        return res.status(404).json({ message: 'Business partner not found' });
      }

      const businessPartner = businessPartnerSnapshot.data();
      const assignedDashboards = businessPartner.assignedDashboards || [];

      if (!assignedDashboards.includes(dashboardId)) {
        return res.status(403).json({ message: 'Unauthorized to access this dashboard' });
      }
    }

    // Query Looker API for specific dashboard
    const dashboard = await lookerSDK.ok(lookerSDK.dashboard(dashboardId));

    res.json({ dashboard });
  } catch (error) {
    console.error('Looker dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Routes for downloading dashboard content
app.get('/api/looker/dashboards/:id/excel', authenticateToken, async (req, res) => {
  try {
    const dashboardId = req.params.id;

    // For non-admin users, verify they have access to this dashboard
    if (req.user.role !== 'admin') {
      const businessPartnerSnapshot = await businessPartnersCollection.doc(req.user.businessPartnerId).get();
      if (!businessPartnerSnapshot.exists) {
        return res.status(404).json({ message: 'Business partner not found' });
      }

      const businessPartner = businessPartnerSnapshot.data();
      const assignedDashboards = businessPartner.assignedDashboards || [];

      if (!assignedDashboards.includes(dashboardId)) {
        return res.status(403).json({ message: 'Unauthorized to access this dashboard' });
      }
    }

    // Generate task to create the Excel file
    const task = await lookerSDK.ok(
      lookerSDK.create_dashboard_render_task({
        dashboard_id: dashboardId,
        result_format: 'xlsx',
        width: 1200,
        height: 800,
        fields: null,
        pdf_paper_size: null,
        pdf_landscape: true
      })
    );

    // Wait for task to complete
    let renderTask;
    let maxAttempts = 10;
    while (maxAttempts > 0) {
      renderTask = await lookerSDK.ok(lookerSDK.render_task(task.id));
      if (renderTask.status === 'success') {
        break;
      }
      if (renderTask.status === 'error') {
        throw new Error('Render task failed');
      }
      // Wait 1 second between checks
      await new Promise(resolve => setTimeout(resolve, 1000));
      maxAttempts--;
    }

    if (maxAttempts === 0) {
      throw new Error('Render task timed out');
    }

    // Get the rendered content
    const response = await lookerSDK.ok(lookerSDK.render_task_results(task.id));

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="dashboard-${dashboardId}.xlsx"`);

    // Send the file
    res.send(response);
  } catch (error) {
    console.error('Excel download error:', error);
    res.status(500).json({ message: 'Failed to generate Excel file' });
  }
});

app.get('/api/looker/dashboards/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const dashboardId = req.params.id;

    // For non-admin users, verify they have access to this dashboard
    if (req.user.role !== 'admin') {
      const businessPartnerSnapshot = await businessPartnersCollection.doc(req.user.businessPartnerId).get();
      if (!businessPartnerSnapshot.exists) {
        return res.status(404).json({ message: 'Business partner not found' });
      }

      const businessPartner = businessPartnerSnapshot.data();
      const assignedDashboards = businessPartner.assignedDashboards || [];

      if (!assignedDashboards.includes(dashboardId)) {
        return res.status(403).json({ message: 'Unauthorized to access this dashboard' });
      }
    }

    // Generate task to create the PDF file
    const task = await lookerSDK.ok(
      lookerSDK.create_dashboard_render_task({
        dashboard_id: dashboardId,
        result_format: 'pdf',
        width: 1200,
        height: 800,
        fields: null,
        pdf_paper_size: 'letter',
        pdf_landscape: true
      })
    );

    // Wait for task to complete
    let renderTask;
    let maxAttempts = 10;
    while (maxAttempts > 0) {
      renderTask = await lookerSDK.ok(lookerSDK.render_task(task.id));
      if (renderTask.status === 'success') {
        break;
      }
      if (renderTask.status === 'error') {
        throw new Error('Render task failed');
      }
      // Wait 1 second between checks
      await new Promise(resolve => setTimeout(resolve, 1000));
      maxAttempts--;
    }

    if (maxAttempts === 0) {
      throw new Error('Render task timed out');
    }

    // Get the rendered content
    const response = await lookerSDK.ok(lookerSDK.render_task_results(task.id));

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dashboard-${dashboardId}.pdf"`);

    // Send the file
    res.send(response);
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ message: 'Failed to generate PDF file' });
  }
});

// Looker API status check endpoint
app.get('/api/looker/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Query Looker API to verify connection
    const me = await lookerSDK.ok(lookerSDK.me());

    res.json({
      status: 'connected',
      lookerUser: me.display_name,
      lookerVersion: me.looker_version
    });
  } catch (error) {
    console.error('Looker status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Looker API'
    });
  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});