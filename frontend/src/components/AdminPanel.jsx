import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import UserManagement from './admin/UserManagement';
import BusinessPartnerManagement from './admin/BusinessPartnerManagement';
import { getUsers, getBusinessPartners } from '../services/api';

// shadcn components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const AdminPanel = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
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
        variant: 'destructive',
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      
      <Tabs defaultValue="users">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="business-partners">Business Partners</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="pt-4">
          <UserManagement 
            users={users} 
            partners={partners}
            isLoading={isLoading}
            refreshData={fetchData}
          />
        </TabsContent>
        
        <TabsContent value="business-partners" className="pt-4">
          <BusinessPartnerManagement 
            partners={partners}
            isLoading={isLoading}
            refreshData={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;