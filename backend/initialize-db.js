const { Firestore } = require('@google-cloud/firestore');
const bcrypt = require('bcryptjs');

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

async function initializeDatabase() {
  try {
    // Create first business partner
    let partnerRef = await businessPartnersCollection.add({
      name: "Admin Company",
      contactEmail: "admin@example.com",
      assignedDashboards: [],
      createdAt: new Date()
    });

    console.log(`Created business partner with ID: ${partnerRef.id}`);

    // Hash password
    let passwordHash = await bcrypt.hash("admin123", 10);

    // Create admin user
    let userRef = await usersCollection.add({
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      passwordHash,
      role: "admin",
      businessPartnerId: partnerRef.id,
      createdAt: new Date(),
      lastLogin: null,
      failedLoginAttempts: 0
    });

    console.log(`Created admin user with ID: ${userRef.id}`);

    // Create second business partner
    partnerRef = await businessPartnersCollection.add({
      name: "Test Company",
      contactEmail: "user@testcompany.com",
      assignedDashboards: ["dashboard1", "dashboard2"],
      createdAt: new Date()
    });

    console.log(`Created business partner with ID: ${partnerRef.id}`);

    // Hash password
    passwordHash = await bcrypt.hash("password", 10);

    // Create admin user
    userRef = await usersCollection.add({
      email: "user@testcompany.com",
      firstName: "Test",
      lastName: "User",
      passwordHash,
      role: "user",
      businessPartnerId: partnerRef.id,
      createdAt: new Date(),
      lastLogin: null,
      failedLoginAttempts: 0
    });

    console.log(`Created test user with ID: ${userRef.id}`);
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

initializeDatabase();