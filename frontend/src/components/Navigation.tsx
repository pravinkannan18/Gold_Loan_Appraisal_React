/**
 * Enhanced Navigation Component with Admin Access
 */

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTenant } from '../contexts/TenantContext';
import { 
  Building2, 
  Users, 
  Settings, 
  Shield, 
  Home,
  Camera,
  FileText,
  BarChart3,
  LogOut
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, permissions } = useTenant();

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: Home,
      public: false
    },
    {
      path: '/new-appraisal',
      label: 'New Appraisal',
      icon: Camera,
      public: false
    },
    {
      path: '/bank-branch-admin',
      label: 'Admin',
      icon: Building2,
      public: false,
      requiresPermission: 'canViewTenants'
    },
    {
      path: '/records',
      label: 'Records',
      icon: FileText,
      public: false
    },
    {
      path: '/tenant-management',
      label: 'Tenant Setup',
      icon: Settings,
      public: false,
      requiresPermission: 'canManageTenants'
    },
    {
      path: '/admin',
      label: 'Administration',
      icon: Shield,
      public: false,
      requiresPermission: 'canManageTenants'
    }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.public) return true;
    if (!user) return false;
    if (item.requiresPermission) {
      return permissions[item.requiresPermission as keyof typeof permissions];
    }
    return true;
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">GL</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Gold Loan Appraisal</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Info and Tenant Selector */}
          <div className="flex items-center gap-4">
            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant={user.role === 'SUPER_ADMIN' ? 'destructive' : 
                               user.role === 'ADMIN' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // In a real app, this would handle logout
                    console.log('Logout clicked');
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex overflow-x-auto py-2 space-x-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;