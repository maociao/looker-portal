import React, { useState, useContext, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stack,
  Heading,
  useToast,
  Text,
  HStack,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  FormHelperText,
  Checkbox,
  CheckboxGroup,
  VStack
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { AuthContext } from '../../context/AuthContext';
import { createBusinessPartner, updateBusinessPartner, deleteBusinessPartner } from '../../services/api';
import { getLookerDashboards } from '../../services/lookerApi';

const BusinessPartnerManagement = ({ partners, isLoading, refreshData }) => {
  const { token } = useContext(AuthContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [availableDashboards, setAvailableDashboards] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    assignedDashboards: []
  });
  const toast = useToast();
  
  // Delete alert state
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const cancelRef = useRef();
  
  const resetForm = () => {
    setFormData({
      name: '',
      contactEmail: '',
      assignedDashboards: []
    });
    setSelectedPartner(null);
  };
  
  const fetchAvailableDashboards = async () => {
    try {
      const dashboards = await getLookerDashboards(token);
      setAvailableDashboards(dashboards);
    } catch (error) {
      toast({
        title: 'Error fetching dashboards',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    }
  };
  
  const handleOpenModal = async (partner = null) => {
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
    onOpen();
  };
  
  const handleCloseModal = () => {
    resetForm();
    onClose();
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleDashboardChange = (dashboardId, isChecked) => {
    const currentDashboards = [...formData.assignedDashboards];
    
    if (isChecked) {
      // Add dashboard if not already included
      if (!currentDashboards.includes(dashboardId)) {
        currentDashboards.push(dashboardId);
      }
    } else {
      // Remove dashboard
      const index = currentDashboards.indexOf(dashboardId);
      if (index > -1) {
        currentDashboards.splice(index, 1);
      }
    }
    
    setFormData({
      ...formData,
      assignedDashboards: currentDashboards
    });
  };
  
  const handleSubmit = async () => {
    try {
      if (selectedPartner) {
        // Update existing partner
        await updateBusinessPartner(selectedPartner.id, formData, token);
        toast({
          title: 'Business partner updated',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new partner
        await createBusinessPartner(formData, token);
        toast({
          title: 'Business partner created',
          status: 'success',
          duration: 3000,
        });
      }
      
      handleCloseModal();
      refreshData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
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
        title: 'Business partner deleted',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };
  
  return (
    <Box>
      <HStack justify="space-between" mb={5}>
        <Heading size="md">Business Partner Management</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => handleOpenModal()}
        >
          Add Business Partner
        </Button>
      </HStack>
      
      {partners.length === 0 ? (
        <Text>No business partners found</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Contact Email</Th>
              <Th>Assigned Dashboards</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {partners.map((partner) => (
              <Tr key={partner.id}>
                <Td>{partner.name}</Td>
                <Td>{partner.contactEmail}</Td>
                <Td>{partner.assignedDashboards?.length || 0}</Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      icon={<EditIcon />}
                      size="sm"
                      aria-label="Edit partner"
                      onClick={() => handleOpenModal(partner)}
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      aria-label="Delete partner"
                      onClick={() => handleDeleteClick(partner)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      
      {/* Business Partner Form Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedPartner ? 'Edit Business Partner' : 'Add New Business Partner'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl id="name" isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl id="contactEmail" isRequired>
                <FormLabel>Contact Email</FormLabel>
                <Input
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl id="assignedDashboards">
                <FormLabel>Assigned Dashboards</FormLabel>
                <FormHelperText mb={2}>
                  Select the dashboards this business partner can access
                </FormHelperText>
                
                <VStack align="start" spacing={2} maxHeight="200px" overflowY="auto" p={2} borderWidth={1} borderRadius="md">
                  {availableDashboards.map(dashboard => (
                    <Checkbox 
                      key={dashboard.id}
                      isChecked={formData.assignedDashboards.includes(dashboard.id)}
                      onChange={(e) => handleDashboardChange(dashboard.id, e.target.checked)}
                    >
                      {dashboard.title}
                    </Checkbox>
                  ))}
                  {availableDashboards.length === 0 && (
                    <Text>No dashboards available</Text>
                  )}
                </VStack>
              </FormControl>
            </Stack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {selectedPartner ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteAlertOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Business Partner
            </AlertDialogHeader>
            
            <AlertDialogBody>
              Are you sure you want to delete {partnerToDelete?.name}? This action cannot be undone and will affect all users associated with this business partner.
            </AlertDialogBody>
            
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteAlertOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default BusinessPartnerManagement;