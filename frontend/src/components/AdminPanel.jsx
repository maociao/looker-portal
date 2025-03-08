import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast
} from '@chakra-ui/react';
import { AuthContext } from '../context/AuthContext';
import UserManagement from './admin/UserManagement';
import BusinessPartnerManagement from './admin/BusinessPartnerManagement';
import { getUsers, getBusinessPartners } from '../services/api';

const AdminPanel = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersData, partnersData] = await Promise.all([
        getUsers(token),
        getBusinessPartners(token)
      ]);
      
      setUsers(usersData.users || []);
      setPartners(partnersData.partners || []);
    } catch (error) {
      toast({
        title: 'Error fetching data',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);
  
  return (
    <Box p={5}>
      <Heading mb={5}>Admin Panel</Heading>
      
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Users</Tab>
          <Tab>Business Partners</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <UserManagement 
              users={users} 
              partners={partners}
              isLoading={isLoading}
              refreshData={fetchData}
            />
          </TabPanel>
          <TabPanel>
            <BusinessPartnerManagement 
              partners={partners}
              isLoading={isLoading}
              refreshData={fetchData}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminPanel;