import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { loginUser } from '../services/api';
import { APP_NAME } from '../config/env';

// shadcn components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import ErrorAlert from './ErrorAlert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser, setToken, setRefreshToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');  // Clear error when user changes input
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');  // Clear error when user changes input
  };

  // If already logged in, redirect to appropriate page based on role
  if (user) {
    const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await loginUser(email, password);

      if (response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));

        setToken(response.token);
        setRefreshToken(response.refreshToken);
        setUser(response.user);

        // Navigate based on user role
        const redirectPath = response.user.role === 'admin' ? '/admin' : '/dashboard';
        navigate(redirectPath);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);

      // Extract error message from response if available
      let errorMessage = 'An error occurred during login';

      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{APP_NAME}</h1>
        </div>

        <ErrorAlert
          error={error}
          onDismiss={() => setError('')}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;