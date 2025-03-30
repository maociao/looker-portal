import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X } from 'lucide-react';

const ErrorAlert = ({ error, onDismiss }) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mb-6 relative">
      <AlertDescription>{error}</AlertDescription>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 text-white p-1 rounded-full hover:bg-red-700"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </Alert>
  );
};

export default ErrorAlert;