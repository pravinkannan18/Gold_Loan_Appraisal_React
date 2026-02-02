/**
 * Tenant Hierarchy Selector Component
 * Combines bank, branch, and user selectors in a cascading interface
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Bank, Branch, TenantUser, UserRole } from '../../types/tenant';
import { useTenant } from '../../contexts/TenantContext';
import BankSelector from './BankSelector';
import BranchSelector from './BranchSelector';
import UserSelector from './UserSelector';

interface TenantSelectorProps {
  onSelectionChange?: (selection: {
    bank: Bank | null;
    branch: Branch | null;
    user: TenantUser | null;
  }) => void;
  roleFilter?: UserRole[];
  allowBranchOptional?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  onSelectionChange,
  roleFilter,
  allowBranchOptional = false,
  className = "",
  title = "Tenant Selection",
  description = "Select the bank, branch, and user for this session",
}) => {
  const { state } = useTenant();
  const { currentBank, currentBranch, currentUser, permissions } = state;

  const handleBankChange = (bank: Bank | null) => {
    if (onSelectionChange) {
      onSelectionChange({
        bank,
        branch: null, // Reset branch when bank changes
        user: null,   // Reset user when bank changes
      });
    }
  };

  const handleBranchChange = (branch: Branch | null) => {
    if (onSelectionChange) {
      onSelectionChange({
        bank: currentBank,
        branch,
        user: null, // Reset user when branch changes
      });
    }
  };

  const handleUserChange = (user: TenantUser | null) => {
    if (onSelectionChange) {
      onSelectionChange({
        bank: currentBank,
        branch: currentBranch,
        user,
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          {currentUser && (
            <Badge variant={currentUser.status === 'active' ? 'default' : 'secondary'}>
              {currentUser.role.replace('_', ' ').toUpperCase()}
            </Badge>
          )}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bank Selection */}
        <BankSelector
          onBankChange={handleBankChange}
          className="w-full"
        />

        {/* Branch Selection */}
        {(currentBank || allowBranchOptional) && (
          <BranchSelector
            bankId={currentBank?.id}
            onBranchChange={handleBranchChange}
            className="w-full"
            disabled={!currentBank}
          />
        )}

        {/* User Selection */}
        {currentBank && (allowBranchOptional || currentBranch) && (
          <UserSelector
            bankId={currentBank.id}
            branchId={currentBranch?.id}
            onUserChange={handleUserChange}
            roleFilter={roleFilter}
            className="w-full"
          />
        )}

        {/* Selection Summary */}
        {(currentBank || currentBranch || currentUser) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Selection</h4>
            <div className="space-y-1 text-sm">
              {currentBank && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium">{currentBank.bank_short_name}</span>
                </div>
              )}
              {currentBranch && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Branch:</span>
                  <span className="font-medium">{currentBranch.branch_name}</span>
                </div>
              )}
              {currentUser && (
                <div className="flex justify-between">
                  <span className="text-gray-600">User:</span>
                  <span className="font-medium">{currentUser.full_name}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Permissions Summary */}
        {currentUser && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700 mb-2">User Permissions</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center ${permissions.canCreateSession ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-1">{permissions.canCreateSession ? '✓' : '✗'}</span>
                Create Sessions
              </div>
              <div className={`flex items-center ${permissions.canEditSession ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-1">{permissions.canEditSession ? '✓' : '✗'}</span>
                Edit Sessions
              </div>
              <div className={`flex items-center ${permissions.canViewReports ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-1">{permissions.canViewReports ? '✓' : '✗'}</span>
                View Reports
              </div>
              <div className={`flex items-center ${permissions.canManageUsers ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-1">{permissions.canManageUsers ? '✓' : '✗'}</span>
                Manage Users
              </div>
              <div className={`flex items-center ${permissions.canApproveAppraisals ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-1">{permissions.canApproveAppraisals ? '✓' : '✗'}</span>
                Approve Appraisals
              </div>
              <div className={`flex items-center ${permissions.canExportData ? 'text-green-600' : 'text-gray-400'}`}>
                <span className="mr-1">{permissions.canExportData ? '✓' : '✗'}</span>
                Export Data
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenantSelector;