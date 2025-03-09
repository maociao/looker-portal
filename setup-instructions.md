# Looker Partner Portal - Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Cloud account (for deployment)
- Looker instance with API credentials
- Firestore database setup

## Local Development Setup

### Backend Setup

1. **Create Environment Variables File**
   
   Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=8080
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your_jwt_secret_here
   LOOKER_HOST=your-looker-instance.cloud.looker.com
   LOOKER_EMBED_SECRET=your_looker_embed_secret_here
   ```

2. **Install Dependencies**
   
   ```bash
   cd backend
   npm install
   ```

3. **Setup Looker SDK Configuration**
   
   Create a `looker.ini` file in the backend directory:
   ```ini
   [Looker]
   base_url=https://your-looker-instance.cloud.looker.com
   client_id=your_client_id
   client_secret=your_client_secret
   verify_ssl=true
   ```

4. **Start the Backend Server**
   
   ```bash
   npm start
   ```

### Frontend Setup

1. **Create Environment Variables File**
   
   Create a `.env` file in the frontend directory:
   ```
   VITE_API_URL=http://localhost:8080
   VITE_PUBLIC_URL=/
   VITE_LOOKER_HOST=your-looker-instance.com
   ```

2. **Install Dependencies**
   
   ```bash
   cd frontend
   npm install
   ```

3. **Start the Frontend Server**
   
   ```bash
   npm run dev
   ```

## Firestore Setup

1. **Create a Firestore database in your Google Cloud console**

2. **Set Up the Following Collections**:
   - `users`
   - `businessPartners`

3. **Create an Initial Admin User**:
   
   You can use Firebase Admin SDK to create your first admin user:
   ```javascript
   const admin = require('firebase-admin');
   admin.initializeApp();
   
   const db = admin.firestore();
   const bcrypt = require('bcryptjs');
   
   async function createAdminUser() {
     // First, create a business partner
     const partnerRef = await db.collection('businessPartners').add({
       name: 'Admin Company',
       contactEmail: 'admin@example.com',
       assignedDashboards: [],
       createdAt: admin.firestore.FieldValue.serverTimestamp()
     });
     
     // Then create an admin user
     const passwordHash = await bcrypt.hash('admin123', 10);
     await db.collection('users').add({
       email: 'admin@example.com',
       firstName: 'Admin',
       lastName: 'User',
       passwordHash,
       role: 'admin',
       businessPartnerId: partnerRef.id,
       createdAt: admin.firestore.FieldValue.serverTimestamp(),
       lastLogin: null
     });
     
     console.log('Admin user created successfully!');
   }
   
   createAdminUser().catch(console.error);
   ```

## Deployment

### Setting Up Google Cloud Build

1. **Initialize Google Cloud Build**
   
   ```bash
   gcloud init
   ```

2. **Create Build Trigger**
   
   In Google Cloud Console, navigate to Cloud Build > Triggers and create a new trigger that uses the `cloudbuild.yaml` file.

3. **Set Required Substitution Variables**
   
   As defined in your `cloudbuild.yaml` file:
   - `_LOOKER_HOST`
   - `_BACKEND_URL`
   - `_LOOKER_EMBED_SECRET`
   - `_JWT_SECRET`

4. **Push Your Code to Trigger Deployment**
   
   Push to the branch configured in your trigger to start the build and deployment process.

## Testing the Application

1. **Navigate to your frontend URL**
   
   - Local: http://localhost:5173
   - Deployed: Your Cloud Run URL

2. **Login with the admin user**
   
   - Email: admin@example.com
   - Password: admin123 (or whatever you set)

3. **Create Business Partners and Users**
   
   Use the admin panel to create business partners and assign users to them.

4. **Assign Looker Dashboards**
   
   Assign Looker dashboards to business partners to allow their users to view those dashboards.

## Troubleshooting

### Common Issues

1. **CORS Errors**
   
   Ensure the `FRONTEND_URL` in the backend `.env` file matches your frontend URL exactly.

2. **Authentication Issues**
   
   Check the JWT_SECRET values match between your environment and the application.

3. **Looker Embedding Issues**
   
   Verify your Looker instance is properly configured for embedding with the correct domain allowlisting.

4. **API Connection Issues**
   
   Check your Looker API credentials and ensure the `looker.ini` file is correctly configured.

### Logs

Access logs via:

- **Backend (Cloud Run)**: Google Cloud Console > Cloud Run > looker-portal-backend > Logs
- **Frontend (Cloud Run)**: Google Cloud Console > Cloud Run > looker-portal-frontend > Logs

## Security Considerations

1. **Secret Management**
   
   In production, use Google Cloud Secret Manager to manage sensitive values:
   ```yaml
   - '--set-secrets=JWT_SECRET=projects/PROJECT_ID/secrets/jwt-secret:latest'
   ```

2. **Firestore Security Rules**
   
   Implement proper security rules as defined in your `firebase-config.txt` file.

3. **Regular Updates**
   
   Keep all dependencies updated to mitigate security vulnerabilities:
   ```bash
   npm audit fix
   ```
