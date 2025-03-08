import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
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
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { AuthContext } from '../../context/AuthContext';
import { createUser, updateUser, deleteUser } from '../../services/api';

const UserManagement = ({ users, partners, isLoading, refreshData }) => {
  const { token } = useContext(AuthContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    businessPartnerId: '',
  });
  const toast = useToast();
  
  // Delete alert state
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const cancelRef = React.useRef();
  
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'user',
      businessPartnerId: '',
    });
    setSelectedUser(null);
  };
  
  const handleOpenModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '', // Don't set password on edit
        role: user.role,
        businessPartnerId: user.businessPartnerId,
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
  
  const handleSubmit = async () => {
    try {
      if (selectedUser) {
        // Update existing user
        const userData = { ...formData };
        if (!userData.password) {
          delete userData.password; // Don't update password if empty
        }
        
        await updateUser(selectedUser.id, userData, token);
        toast({
          title: 'User updated',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new user
        await createUser(formData, token);
        toast({
          title: 'User created',
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
  
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteAlertOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(userToDelete.id, token);
      setIsDeleteAlertOpen(false);
      refreshData();
      toast({
        title: 'User deleted',
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
        <Heading size="md">User Management</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => handleOpenModal()}
        >
          Add User
        </Button>
      </HStack>
      
      {users.length === 0 ? (
        <Text>No users found</Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Business Partner</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>{`${user.firstName} ${user.lastName}`}</Td>
                <Td>{user.email}</Td>
                <Td>{user.role}</Td>
                <Td>
                  {partners.find(p => p.id === user.businessPartnerId)?.name || 'N/A'}
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      icon={<EditIcon />}
                      size="sm"
                      aria-label="Edit user"
                      onClick={() => handleOpenModal(user)}
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      aria-label="Delete user"
                      onClick={() => handleDeleteClick(user)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      
      {/* User Form Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedUser ? 'Edit User' : 'Add New User'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl id="firstName" isRequired>
                <FormLabel>First Name</FormLabel>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl id="lastName" isRequired>
                <FormLabel>Last Name</FormLabel>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl id="email" isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl id="password" isRequired={!selectedUser}>
                <FormLabel>{selectedUser ? 'Password (leave empty to keep current)' : 'Password'}</FormLabel>
                <Input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </FormControl>
              
              <FormControl id="role" isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>
              
              <FormControl id="businessPartnerId" isRequired>
                <FormLabel>Business Partner</FormLabel>
                <Select
                  name="businessPartnerId"
                  value={formData.businessPartnerId}
                  onChange={handleInputChange}
                >
                  <option value="">Select Business Partner</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {selectedUser ? 'Update' : 'Create'}
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
              Delete User
            </AlertDialogHeader>
            
            <AlertDialogBody>
              Are you sure you want to delete {userToDelete?.firstName} {userToDelete?.lastName}? This action cannot be undone.
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

export default UserManagement;