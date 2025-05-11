import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { createBusinessPartner, updateBusinessPartner, deleteBusinessPartner } from '../../services/api';
import { getLookerDashboards } from '../../services/lookerApi';

// shadcn components
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

// Lucide icons
import { Plus, Pencil, Trash, Search } from 'lucide-react';

const BusinessPartnerManagement = ({ partners, isLoading, refreshData }) => {
  const { token } = useContext(AuthContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [availableDashboards, setAvailableDashboards] = useState([]);
  const [dashboardFilter, setDashboardFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    assignedDashboards: []
  });
  const { toast } = useToast();
  
  // Delete alert state
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  
  const resetForm = () => {
    setFormData({
      name: '',
      contactEmail: '',
      assignedDashboards: []
    });
    setSelectedPartner(null);
    setDashboardFilter('');
  };
  
  const fetchAvailableDashboards = async () => {
    try {
      const dashboards = await getLookerDashboards(token);
      setAvailableDashboards(dashboards);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboards',
        variant: 'destructive',
      });
    }
  };
  
  const handleOpenDialog = async (partner = null) => {
    await fetchAvailableDashboards();
    
    if (partner) {
      setSelectedPartner(partner);
      setFormData({
        name: partner.name,
        contactEmail: partner.contactEmail,
        assignedDashboards: partner.assignedDashboards || []
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    resetForm();
    setIsDialogOpen(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleDashboardChange = (dashboardId, isChecked) => {
    if (isChecked) {
      // Add dashboard if not already included
      setFormData(prev => ({
        ...prev,
        assignedDashboards: [...prev.assignedDashboards, dashboardId]
      }));
    } else {
      // Remove dashboard
      setFormData(prev => ({
        ...prev,
        assignedDashboards: prev.assignedDashboards.filter(id => id !== dashboardId)
      }));
    }
  };
  
  const handleSubmit = async () => {
    try {
      if (selectedPartner) {
        // Update existing partner
        await updateBusinessPartner(selectedPartner.id, formData, token);
        toast({
          title: 'Success',
          description: 'Business partner updated successfully',
        });
      } else {
        // Create new partner
        await createBusinessPartner(formData, token);
        toast({
          title: 'Success',
          description: 'Business partner created successfully',
        });
      }
      
      handleCloseDialog();
      refreshData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteClick = (partner) => {
    setPartnerToDelete(partner);
    setIsDeleteAlertOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await deleteBusinessPartner(partnerToDelete.id, token);
      setIsDeleteAlertOpen(false);
      refreshData();
      toast({
        title: 'Success',
        description: 'Business partner deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  // Filter dashboards based on search input
  const filteredDashboards = availableDashboards.filter(dashboard => 
    dashboard.title.toLowerCase().includes(dashboardFilter.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Business Partner Management</h2>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-1">
          <Plus size={16} /> Add Business Partner
        </Button>
      </div>
      
      {partners.length === 0 ? (
        <p className="text-sm text-gray-500">No business partners found</p>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Assigned Dashboards</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>{partner.name}</TableCell>
                  <TableCell>{partner.contactEmail}</TableCell>
                  <TableCell>{partner.assignedDashboards?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDialog(partner)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClick(partner)}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Partner Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedPartner ? 'Edit Business Partner' : 'Add New Business Partner'}
            </DialogTitle>
            <DialogDescription>
              Fill in the form below to {selectedPartner ? 'update' : 'create'} a business partner.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Assigned Dashboards</Label>
              <div className="text-sm text-gray-500 mb-2">
                Select the dashboards this business partner can access
              </div>
              
              {/* Dashboard filter input */}
              <div className="relative mb-2">
                <Input
                  placeholder="Filter dashboards..."
                  value={dashboardFilter}
                  onChange={(e) => setDashboardFilter(e.target.value)}
                  className="mb-2"
                />
              </div>
              
              <ScrollArea className="h-48 border rounded-md p-2">
                <div className="space-y-2">
                  {availableDashboards.length === 0 ? (
                    <p className="text-sm text-gray-500">No dashboards available</p>
                  ) : filteredDashboards.length === 0 ? (
                    <p className="text-sm text-gray-500">No dashboards match your filter</p>
                  ) : (
                    filteredDashboards.map(dashboard => (
                      <div key={dashboard.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`dashboard-${dashboard.id}`}
                          checked={formData.assignedDashboards.includes(dashboard.id)}
                          onCheckedChange={(checked) => handleDashboardChange(dashboard.id, checked)}
                        />
                        <Label 
                          htmlFor={`dashboard-${dashboard.id}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {dashboard.title}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedPartner ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Business Partner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {partnerToDelete?.name}? This action cannot be undone and will affect all users associated with this business partner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BusinessPartnerManagement;