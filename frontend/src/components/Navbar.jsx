import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { APP_NAME } from '../config/env';

// shadcn components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Lucide icons
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Determine the home route based on user role
  const getHomeRoute = () => {
    if (!user) return '/login';
    return user.role === 'admin' ? '/admin' : '/dashboard';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo/Brand - Links to role-specific home */}
          <div>
            <Link to={getHomeRoute()} className="text-lg font-bold text-gray-800 hover:text-primary">
              {APP_NAME}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-gray-600 hover:text-primary"
                  >
                    Admin Panel
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-gray-600 hover:text-primary"
                >
                  Dashboard
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1">
                      {`${user.firstName} ${user.lastName}`}
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      {user.businessPartnerName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-gray-200 mt-3">
            <div className="flex flex-col space-y-3">
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-2 py-1 text-sm font-medium text-gray-600 hover:text-primary"
                      onClick={toggleMenu}
                    >
                      Admin Panel
                    </Link>
                  )}

                  <Link
                    to="/dashboard"
                    className="px-2 py-1 text-sm font-medium text-gray-600 hover:text-primary"
                    onClick={toggleMenu}
                  >
                    Dashboard
                  </Link>

                  <div className="px-2 py-1 text-sm font-medium text-gray-600">
                    {`${user.firstName} ${user.lastName}`}
                  </div>

                  <div className="px-2 py-1 text-xs text-gray-500">
                    {user.email}
                  </div>

                  <div className="px-2 py-1 text-xs text-gray-500">
                    {user.businessPartnerName}
                  </div>

                  <Link
                    to="/profile"
                    className="px-2 py-1 text-sm font-medium text-gray-600 hover:text-primary"
                    onClick={toggleMenu}
                  >
                    My Profile
                  </Link>

                  <Button
                    variant="ghost"
                    className="justify-start px-2"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button asChild onClick={toggleMenu}>
                  <Link to="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;