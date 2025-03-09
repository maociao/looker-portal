# Looker Portal Configuration Guide

This guide provides step-by-step instructions for configuring the Looker Portal application to connect with your Looker instance and exposing dashboards for use within the portal.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Looker API Configuration](#looker-api-configuration)
3. [Embedded Content Configuration](#embedded-content-configuration)
4. [Portal Application Setup](#portal-application-setup)
5. [Creating and Exposing Dashboards](#creating-and-exposing-dashboards)
6. [Testing the Connection](#testing-the-connection)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- Administrator access to your Looker instance
- Permissions to create API credentials in Looker
- The Looker Portal application code deployed or running locally
- A Google Cloud account (if deploying to GCP)
- The necessary environment variables set up for your deployment

## Looker API Configuration

### 1. Create a Dedicated API User and Credentials

1. Log in to your Looker instance as an administrator
2. Navigate to **Admin > Users**
3. Click **Add Users** and create a dedicated API service user:
   - Email: `looker-portal-api@yourdomain.com` (use your actual domain)
   - First and Last Name: "Looker Portal API"
4. Click **Add & Edit** to create the user and open their profile
5. Navigate to the **Authentication** tab
6. Under **API3 Keys**, click **New API3 Key**
7. Copy the generated **Client ID** and **Client Secret** values
   - **Important**: Store these securely as the Client Secret will not be shown again

### 2. Set Up API User Permissions

1. Navigate to **Admin > Roles**
2. Create a new role named "Looker Portal API Access"
3. Add the following permissions:
   - `access_data`
   - `see_lookml_dashboards`
   - `see_user_dashboards`
   - `see_looks`
   - `download_with_limit`
   - `schedule_look_emails`
   - `schedule_external_look_emails`
4. Navigate back to **Admin > Users** and select your API service user
5. Assign the "Looker Portal API Access" role to this user
6. If you have model-level access controls, ensure this user has access to all necessary models

## Embedded Content Configuration

### 1. Set Up Embedding Authentication

1. Navigate to **Admin > Embed**
2. Enable embedding by checking "Embedded Access"
3. Generate a new Embed Secret by clicking **Generate New Secret**
   - **Important**: Copy and store this secret securely 
4. Add your application's domain to the "Allowed Embed Domains" list
   - For local development: `http://localhost:5173`
   - For production: `https://yourdomain.com` (use your actual domain)

### 2. Configure Embed SSO Authentication (Optional)

If using SSO for embedded users:

1. Under the same Embed configuration page, enable "Embed SSO Auth"
2. Configure the appropriate SSO parameters based on your Identity Provider

## Portal Application Setup

### 1. Configure Looker SDK Settings

1. In your backend directory, create or update the `looker.ini` file:

```ini
[Looker]
base_url=https://your-looker-instance.cloud.looker.com
client_id=YOUR_CLIENT_ID
client_secret=YOUR_CLIENT_SECRET
verify_ssl=true
```

Replace placeholders with your actual Looker instance URL and API credentials.

### 2. Set Environment Variables

Configure the following environment variables in your backend `.env` file:

```
LOOKER_HOST=your-looker-instance.cloud.looker.com
LOOKER_EMBED_SECRET=your_looker_embed_secret_here
JWT_SECRET=your_jwt_secret_here
```

For your frontend `.env` file:

```
VITE_API_URL=http://localhost:8080
VITE_LOOKER_HOST=your-looker-instance.cloud.looker.com
VITE_USE_MOCK_LOOKER=false
```

### 3. Deploy or Start Your Application

For local development:
```bash
# Start backend
cd backend
npm install
npm run dev

# Start frontend
cd frontend
npm install
npm run dev
```

For production, follow your deployment process using the provided `cloudbuild.yaml`.

## Creating and Exposing Dashboards

### 1. Create Dashboards in Looker

1. Log in to your Looker instance
2. Create or identify dashboards you want to expose through the portal
3. Note the dashboard ID, which appears in the URL when viewing the dashboard:
   `https://your-looker-instance.cloud.looker.com/dashboards/123` (ID is 123)

### 2. Ensure Dashboard Visibility

Ensure dashboards are visible to your API user by:

1. Navigate to the dashboard in Looker
2. Click the gear icon ⚙️ and select "Edit Dashboard"
3. Click the gear icon again and select "Edit Dashboard Access"
4. Add your API user or a group that includes your API user
5. Ensure the API user has at least "View" access

### 3. Organize Dashboards (Recommended)

For better organization in your portal:

1. Create a dedicated folder for your portal dashboards
2. Move relevant dashboards to this folder
3. Set folder permissions to ensure your API user has access

### 4. Assign Dashboards to Business Partners

In your Looker Portal admin interface:

1. Log in as an administrator
2. Navigate to "Business Partners"
3. Select a business partner or create a new one
4. Assign dashboards from the available list
5. Save the changes

## Testing the Connection

### 1. Test API Connection

1. Log in to your Looker Portal as an admin
2. In the admin panel, there should be a "Test Looker Connection" option
3. Verify that the connection succeeds and shows the API user name

### 2. Test Dashboard Embedding

1. Log in as a business partner user
2. Navigate to the Dashboard section
3. Verify that assigned dashboards appear in the list
4. Select a dashboard and confirm it loads correctly
5. Test dashboard interactions and functionality

## Troubleshooting

### Common Issues and Solutions

#### API Connection Failures

- Verify API credentials in the `looker.ini` file
- Check that the API user has the correct permissions
- Ensure the Looker instance URL is correct and accessible

#### Embedded Dashboard Not Loading

- Check browser console for errors
- Verify the domain is allowlisted in Looker's embed settings
- Confirm the embed secret is correctly configured
- Ensure the dashboard ID is correctly passed in the embed URL

#### Missing Dashboards

- Verify the API user can access the dashboards in Looker
- Check that dashboards are correctly assigned to business partners
- Look for permission issues in Looker's access controls

#### Content Rendering Issues

- Check for iframe-related security policies in your environment
- Verify that the Looker instance allows embedding
- Check for mixed content (HTTP/HTTPS) issues

### Logging and Debugging

For more detailed diagnostics:

1. Enable debug logging in the backend by setting:
   ```
   DEBUG=looker:*
   ```

2. Check server logs for API-related errors

3. Monitor browser network requests when loading dashboards

## Additional Resources

- [Looker API Documentation](https://docs.looker.com/reference/api-and-integration)
- [Looker Embed SDK Documentation](https://github.com/looker-open-source/embed-sdk)
- [Looker Embedding Best Practices](https://docs.looker.com/admin-options/settings/embed)
