import React, { useState, useContext } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Alert,
  AlertIcon,
  Container,
} from '@chakra-ui/react';
import { AuthContext } from '../context/AuthContext';
import { loginUser } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser, setToken } = useContext(AuthContext);
  const history = useHistory();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Redirect to="/dashboard" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginUser(email, password);
      
      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setToken(response.token);
        setUser(response.user);
        
        history.push('/dashboard');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={10}>
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center">Business Partner Portal</Heading>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <Box as="form" onSubmit={handleSubmit} p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
          <VStack spacing={4}>
            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            
            <Button
              width="full"
              mt={4}
              colorScheme="blue"
              type="submit"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default Login;