import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getLookerEmbedUrl } from '../services/api';
import { LookerEmbedSDK } from '@looker/embed-sdk';
import MockDashboard from './MockDashboard';

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Check if we're using mock Looker API
const USE_MOCK_LOOKER = import.meta.env.VITE_USE_MOCK_LOOKER === 'true';

// Initialize Looker Embed SDK only if not using mock
if (!USE_MOCK_LOOKER) {
  LookerEmbedSDK.init(import.meta.env.VITE_LOOKER_HOST);
}

const Dashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const dashboardRef = useRef(null);
  const dashboardContainerRef = useRef(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  
  useEffect(() => {
    // If using mock API, return early after a delay to simulate loading
    if (USE_MOCK_LOOKER) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Get signed URL for embedding
        const embedData = await getLookerEmbedUrl(token);
        
        if (!embedData.embeddedUrl) {
          throw new Error('Failed to get dashboard URL');
        }
        
        // Parse the dashboard ID from the URL
        const urlParts = embedData.embeddedUrl.split('/');
        const dashboardIdIndex = urlParts.findIndex(part => part === 'dashboards') + 1;
        const dashboardId = urlParts[dashboardIdIndex];
        
        if (!dashboardId) {
          throw new Error('Invalid dashboard URL');
        }
        
        // Build the dashboard with Looker Embed SDK
        LookerEmbedSDK.createDashboardWithId(dashboardId)
          .withNext()
          .appendTo(dashboardContainerRef.current)
          .withTheme('minimal')
          .withParams({
            // Add any necessary filters here
          })
          .on('dashboard:loaded', (dashboard) => {
            dashboardRef.current = dashboard;
            setIsLoading(false);
          })
          .on('dashboard:run:start', () => {
            setIsLoading(true);
          })
          .on('dashboard:run:complete', () => {
            setIsLoading(false);
          })
          .on('error', (error) => {
            console.error('Dashboard error', error);
            setError('Error loading dashboard');
            setIsLoading(false);
          })
          .build()
          .connect()
          .catch((error) => {
            console.error('Connection error', error);
            setError('Error connecting to dashboard');
            setIsLoading(false);
          });
          
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard');
        setIsLoading(false);
      }
    };
    
    if (user && token) {
      fetchDashboard();
    }
    
    return () => {
      // Clean up dashboard if it exists
      if (dashboardRef.current) {
        dashboardRef.current.disconnect();
      }
    };
  }, [user, token]);
  
  // Handle download
  const handleDownload = () => {
    if (USE_MOCK_LOOKER) {
      // Simulate download in mock mode
      const link = document.createElement('a');
      const filename = selectedFormat === 'excel' ? 'mock-dashboard.xlsx' : 'mock-dashboard.pdf';
      const mimeType = selectedFormat === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        : 'application/pdf';
      
      const blob = new Blob(['Mock file content'], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return;
    }
    
    if (!dashboardRef.current || !selectedFormat) return;
    
    if (selectedFormat === 'excel') {
      dashboardRef.current.downloadExcel();
    } else if (selectedFormat === 'pdf') {
      dashboardRef.current.downloadPdf();
    }
  };
  
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName}</h1>
        <p className="text-gray-600 mt-1">Business Partner: {user?.businessPartnerName}</p>
      </div>
      
      {/* Download options */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={selectedFormat === 'excel' ? 'default' : 'outline'}
          onClick={() => setSelectedFormat('excel')}
          className={selectedFormat === 'excel' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          Excel
        </Button>
        <Button
          variant={selectedFormat === 'pdf' ? 'default' : 'outline'}
          onClick={() => setSelectedFormat('pdf')}
          className={selectedFormat === 'pdf' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          PDF
        </Button>
        <Button
          disabled={!selectedFormat}
          onClick={handleDownload}
        >
          Download
        </Button>
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Use MockDashboard component when in mock mode */}
      {USE_MOCK_LOOKER ? (
        <MockDashboard />
      ) : (
        <div
          ref={dashboardContainerRef}
          className="h-[800px] w-full border border-gray-200 rounded-md"
          style={{ 
            visibility: isLoading ? 'hidden' : 'visible' 
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;