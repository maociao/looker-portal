import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ component: Component, roles, ...rest }) => {
  const { user, loading } = useContext(AuthContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) => {
        // Check if user is authenticated
        if (!user) {
          return <Redirect to="/login" />;
        }

        // Check if route requires specific roles
        if (roles && !roles.includes(user.role)) {
          // Redirect to dashboard if user doesn't have required role
          return <Redirect to="/dashboard" />;
        }

        // If authenticated and has required role, render the component
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;