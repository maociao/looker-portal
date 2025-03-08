import React, { useEffect, useState, useContext, useRef } from 'react';
import { Box, Heading, Text, Spinner, Center, Button, HStack } from '@chakra-ui/react';
import { AuthContext } from '../context/AuthContext';
import { getLookerEmbedUrl } from '../services/api';
import { LookerEmbedSDK } from '@looker/embed-sdk';

// Initialize Looker Embed SDK
LookerEmbedSDK.init(process.env.REACT_APP_LOOKER_HOST);

const Dashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const dashboardRef = useRef(null);
  const dashboardContainerRef = useRef(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  
  useEffect(() => {
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
    if (!dashboardRef.current || !selectedFormat) return;
    
    if (selectedFormat === 'excel') {
      dashboardRef.current.downloadExcel();
    } else if (selectedFormat === 'pdf') {
      dashboardRef.current.downloadPdf();
    }
  };
  
  return (
    <Box p={5}>
      <Heading mb={5}>Welcome, {user?.firstName}</Heading>
      <Text mb={5}>Business Partner: {user?.businessPartnerName}</Text>
      
      {/* Download options */}
      <HStack spacing={4} mb={5}>
        <Button
          colorScheme={selectedFormat === 'excel' ? 'green' : 'gray'}
          onClick={() => setSelectedFormat('excel')}
        >
          Excel
        </Button>
        <Button
          colorScheme={selectedFormat === 'pdf' ? 'red' : 'gray'}
          onClick={() => setSelectedFormat('pdf')}
        >
          PDF
        </Button>
        <Button
          colorScheme="blue"
          isDisabled={!selectedFormat}
          onClick={handleDownload}
        >
          Download
        </Button>
      </HStack>
      
      {isLoading && (
        <Center h="500px">
          <Spinner size="xl" />
        </Center>
      )}
      
      {error && (
        <Center h="500px">
          <Text color="red.500">{error}</Text>
        </Center>
      )}
      
      <Box
        ref={dashboardContainerRef}
        height="800px"
        width="100%"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        visibility={isLoading ? 'hidden' : 'visible'}
      />
    </Box>
  );
};

export default Dashboard;