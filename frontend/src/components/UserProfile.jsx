import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import ChangePassword from './ChangePassword';

// shadcn components
import { Card, CardContent } from "@/components/ui/card";

const UserProfile = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return null; // Don't render anything if user is not authenticated
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-primary text-primary-foreground rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>

                <div className="text-center">
                  <h3 className="font-semibold text-lg">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs font-medium mt-1 px-2 py-1 bg-gray-100 rounded-full inline-block">
                    {user.role === 'admin' ? 'Administrator' : 'User'}
                  </p>
                </div>

                <div className="border-t w-full pt-3 mt-3">
                  <p className="text-sm font-medium">Business Partner</p>
                  <p className="text-sm text-gray-500">{user.businessPartnerName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="md:col-span-1">

          <ChangePassword />

        </div>
      </div>
    </div>
  );
};

export default UserProfile;