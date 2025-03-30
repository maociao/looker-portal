import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Check, X } from 'lucide-react';

const PasswordField = ({ 
  value, 
  onChange, 
  label = "Password", 
  id = "password",
  name = "password",
  placeholder = "Enter password",
  showRequirements = true,
  required = false,
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Password requirements
  const requirements = [
    { id: 'length', text: 'At least 10 characters', regex: /.{10,}/ },
    { id: 'uppercase', text: 'At least one uppercase letter', regex: /[A-Z]/ },
    { id: 'lowercase', text: 'At least one lowercase letter', regex: /[a-z]/ },
    { id: 'number', text: 'At least one number', regex: /[0-9]/ },
    { id: 'special', text: 'At least one special character', regex: /[^A-Za-z0-9]/ }
  ];
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  // Check if the requirement is met
  const requirementMet = (regex) => {
    return value && regex.test(value);
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="pr-10" // Make room for the toggle button
        />
        <button
          type="button"
          onClick={toggleShowPassword}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex="-1" // Prevent tab focus
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      
      {showRequirements && value && (
        <div className="text-xs space-y-1 mt-2">
          <p className="font-medium text-gray-600">Password requirements:</p>
          <ul className="space-y-1">
            {requirements.map((req) => (
              <li key={req.id} className="flex items-center">
                {requirementMet(req.regex) ? (
                  <Check size={14} className="text-green-500 mr-1 flex-shrink-0" />
                ) : (
                  <X size={14} className="text-red-500 mr-1 flex-shrink-0" />
                )}
                <span className={requirementMet(req.regex) ? "text-green-600" : "text-gray-600"}>
                  {req.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordField;