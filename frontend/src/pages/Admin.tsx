/**
 * Admin Page - Admin login and dashboard interface
 */

import React, { useState } from 'react';
import AdminLogin from '../components/admin/AdminLogin';
import BankBranchAdmin from '../components/admin/BankBranchAdmin';
import { Button } from '../components/ui/button';
import { 
  Shield, 
  LogOut, 
  Building2, 
  GitBranch,
  User,
  Mail
} from 'lucide-react';

interface AdminData {
  email: string;
  role: string;
  bankId: number;
  bankName: string;
  branchId?: number;
  branchName?: string;
}

const Admin: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  const handleLoginSuccess = (data: AdminData) => {
    setAdminData(data);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminData(null);
  };

  // Show login page if not logged in
  if (!isLoggedIn || !adminData) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Show admin dashboard after login
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left - Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Gold Loan Appraisal System</p>
              </div>
            </div>

            {/* Center - Admin Info */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Bank:</span>
                <span className="font-medium text-gray-900">{adminData.bankName}</span>
              </div>
              
              {adminData.role === 'branch_admin' && adminData.branchName && (
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Branch:</span>
                  <span className="font-medium text-gray-900">{adminData.branchName}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900 capitalize">
                  {adminData.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Right - User & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{adminData.email}</span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Admin Info Bar */}
      <div className="md:hidden bg-blue-50 border-b px-4 py-2">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span>{adminData.bankName}</span>
          </div>
          {adminData.branchName && (
            <div className="flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-blue-600" />
              <span>{adminData.branchName}</span>
            </div>
          )}
          <div className="flex items-center gap-1 capitalize">
            <User className="w-3 h-3 text-blue-600" />
            <span>{adminData.role.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <BankBranchAdmin 
          adminRole={adminData.role}
          adminBankId={adminData.bankId}
          adminBankName={adminData.bankName}
          adminBranchId={adminData.branchId}
          adminBranchName={adminData.branchName}
        />
      </div>
    </div>
  );
};

export default Admin;