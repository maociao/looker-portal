// server.js - Main Server File

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Firestore } = require('@google-cloud/firestore');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { LookerNodeSDK } = require('@looker/sdk');
const { NodeSettingsIniFile } = require('@looker/sdk-node');
const lookerSDK = LookerNodeSDK.init(new NodeSettingsIniFile());

// Initialize Express app
const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Initialize Firestore
const firestore = new Firestore();
const usersCollection = firestore.collection('users');
const businessPartnersCollection = firestore.collection('businessPartners');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

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

// Authentication Routes
app.post('/api/login', async (req, res) => {
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
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
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
      role: userData.role,
      businessPartnerId: userData.businessPartnerId,
      businessPartnerName: businessPartnerData.name
    }, JWT_SECRET, { expiresIn: '8h' });
    
    res.json({ token, user: {
      id: userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      businessPartnerId: userData.businessPartnerId,
      businessPartnerName: businessPartnerData.name
    }});
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Looker Embedding Route
app.get('/api/looker/embed', authenticateToken, async (req, res) => {
  try {
    const { userId, businessPartnerId } = req.user;
    
    // Get business partner's assigned dashboards
    const businessPartnerSnapshot = await businessPartnersCollection.doc(businessPartnerId).get();
    if (!businessPartnerSnapshot.exists) {
      return res.status(404).json({ message: 'Business partner not found' });
    }
    
    const businessPartner = businessPartnerSnapshot.data();
    const assignedDashboards = businessPartner.assignedDashboards || [];
    
    if (assignedDashboards.length === 0) {
      return res.status(404).json({ message: 'No dashboards assigned to this business partner' });
    }
    
    // Get the first dashboard (you can modify this to return multiple)
    const dashboardId = assignedDashboards[0];
    
    // Generate the signed URL for Looker SSO embedding
    const url = `/embed/dashboards/${dashboardId}`;
    const sessionLength = 3600;
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Construct the string to be signed
    const strToSign = `${url}\n${sessionLength}\n${timestamp}\n${nonce}`;
    
    // Create signature
    const signature = crypto
      .createHmac('sha1', LOOKER_EMBED_SECRET)
      .update(strToSign)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    
    // Assemble the signed URL
    const embeddedUrl = `https://${LOOKER_HOST}${url}?session_length=${sessionLength}&external_user_id=${userId}&timestamp=${timestamp}&nonce=${nonce}&signature=${signature}`;
    
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

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
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
      lastLogin: null
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

// Looker Dashboard Management Routes
app.get('/api/looker/dashboards', authenticateToken, async (req, res) => {
  try {
    // Only admins and users should access this
    if (!['admin', 'user'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Query Looker API for dashboards
    const result = await lookerSDK.ok(lookerSDK.all_dashboards());
    
    // For non-admin users, filter to only show dashboards assigned to their business partner
    if (req.user.role !== 'admin') {
      const businessPartnerSnapshot = await businessPartnersCollection.doc(req.user.businessPartnerId).get();
      if (!businessPartnerSnapshot.exists) {
        return res.status(404).json({ message: 'Business partner not found' });
      }
      
      const businessPartner = businessPartnerSnapshot.data();
      const assignedDashboards = businessPartner.assignedDashboards || [];
      
      const filteredDashboards = result.filter(dashboard => 
        assignedDashboards.includes(dashboard.id.toString())
      );
      
      return res.json({ dashboards: filteredDashboards });
    }
    
    res.json({ dashboards: result });
  } catch (error) {
    console.error('Looker dashboards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
