import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getLookerEmbedUrl, getUserDashboards } from '../services/api';
import DashboardSelector from './DashboardSelector';

// shadcn components
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [userDashboards, setUserDashboards] = useState([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState(null);
  const [showDashboardSelector, setShowDashboardSelector] = useState(true);
  const [isDashboardListLoading, setIsDashboardListLoading] = useState(true);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');

  // Fetch available dashboards for the user
  useEffect(() => {
    const fetchUserDashboards = async () => {
      console.log('Starting dashboard list fetch...');
      setIsDashboardListLoading(true);
      setError('');

      try {
        console.log('Calling getUserDashboards API...');
        const dashboardsData = await getUserDashboards(token);
        console.log('Received dashboard list data:', dashboardsData);

        if (dashboardsData.dashboards && dashboardsData.dashboards.length > 0) {
          setUserDashboards(dashboardsData.dashboards);

          // If there's only one dashboard, select it automatically
          if (dashboardsData.dashboards.length === 1) {
            setSelectedDashboardId(dashboardsData.dashboards[0].id);
            setShowDashboardSelector(false);
          }
        } else {
          setError('No dashboards available for your account');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load available dashboards');
      } finally {
        setIsDashboardListLoading(false);
      }
    };

    if (user && token) {
      fetchUserDashboards();
    }
  }, [user, token]);

  // Load selected dashboard
  useEffect(() => {
    // If no dashboard selected, just show the selector
    if (!selectedDashboardId) {
      setIsDashboardLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      console.log('Starting dashboard fetch...');
      setIsDashboardLoading(true);
      setError('');
      setEmbedUrl(''); // Clear any previous embed URL
      
      try {
        // Get signed URL for embedding
        console.log('Calling getLookerEmbedUrl API...');
        const response = await getLookerEmbedUrl(token, selectedDashboardId);
        console.log('Received embed URL data:', response);

        if (!response.embeddedUrl) {
          throw new Error('Failed to get dashboard URL');
        }

        // Store the embed URL
        setEmbedUrl(response.embeddedUrl);

        // Add a small delay before showing the dashboard
        setTimeout(() => {
          setIsDashboardLoading(false);
        }, 1000);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load dashboard');
        setIsDashboardLoading(false);
      }
    };

    if (user && token) {
      fetchDashboard();
    }

    // Cleanup function to clear the embed URL when unmounting
    return () => {
      setEmbedUrl('');
    };
  }, [user, token, selectedDashboardId]);

  const handleSelectDashboard = (dashboardId) => {
    setSelectedDashboardId(dashboardId);
    setShowDashboardSelector(false);
  };

  const handleBackToSelector = () => {
    setShowDashboardSelector(true);
    setSelectedDashboardId(null);
  };

  // Find the selected dashboard title
  const selectedDashboard = userDashboards.find(d => d.id === selectedDashboardId);

  return (
    <div className="space-y-6 p-4 w-full">
      {/* Dashboard selector view */}
      {showDashboardSelector ? (
        <>
          <h2 className="text-xl font-semibold">Available Dashboards</h2>

          {isDashboardListLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-500">Loading dashboards...</p>
            </div>
          ) : error && userDashboards.length === 0 ? (
            <Alert className="mt-6">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          ) : userDashboards.length > 0 ? (
            <DashboardSelector
              dashboards={userDashboards}
              onSelectDashboard={handleSelectDashboard}
              className="mt-6"
            />
          ) : null}
        </>
      ) : (
        /* Dashboard view */
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <Button
                variant="outline"
                onClick={handleBackToSelector}
                className="mr-4"
              >
                Back to Dashboards
              </Button>

              <h2 className="text-xl font-semibold">
                {selectedDashboard?.title || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="w-full relative">
            {isDashboardLoading && (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500">Loading dashboard...</p>
              </div>
            )}
            
            {!isDashboardLoading && error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="h-[800px] w-full border border-gray-200 rounded-md">
              {!isDashboardLoading && embedUrl && (
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title="Looker Dashboard"
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;