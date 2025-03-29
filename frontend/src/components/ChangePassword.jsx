import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { changePassword } from '../services/api';

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

const ChangePassword = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { token } = useContext(AuthContext);
  const { toast } = useToast();
  
  // Password validation rules
  const passwordRequirements = [
    { id: 'length', text: 'At least 10 characters', regex: /.{10,}/ },
    { id: 'uppercase', text: 'At least one uppercase letter', regex: /[A-Z]/ },
    { id: 'lowercase', text: 'At least one lowercase letter', regex: /[a-z]/ },
    { id: 'number', text: 'At least one number', regex: /[0-9]/ },
    { id: 'special', text: 'At least one special character', regex: /[^A-Za-z0-9]/ }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);
    
    // Validate form data
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    // Check if new password matches confirmation
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    
    // Validate password requirements
    const invalidRequirements = passwordRequirements.filter(req => !req.regex.test(newPassword));
    if (invalidRequirements.length > 0) {
      setError(`Password doesn't meet the following requirements: ${invalidRequirements.map(r => r.text).join(', ')}`);
      return;
    }
    
    // Submit password change request
    try {
      setIsSubmitting(true);
      
      await changePassword(currentPassword, newPassword, token);
      
      setIsSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: 'Success',
        description: 'Your password has been changed successfully',
      });
      
      // Close the component after success if onClose is provided
      if (onClose) {
        setTimeout(onClose, 2000);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while changing your password');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to maintain account security
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isSuccess && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <AlertDescription>
              Your password has been changed successfully.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
            
            {/* Password requirements */}
            <div className="text-xs text-gray-500 mt-1">
              <p>Password requirements:</p>
              <ul className="list-disc ml-5 mt-1">
                {passwordRequirements.map((req) => (
                  <li 
                    key={req.id}
                    className={newPassword && req.regex.test(newPassword) 
                      ? "text-green-600" 
                      : "text-gray-500"}
                  >
                    {req.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            {onClose && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Changing Password..." : "Change Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePassword;