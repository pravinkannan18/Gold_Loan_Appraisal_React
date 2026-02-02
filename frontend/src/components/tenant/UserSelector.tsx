/**
 * User Selector Component
 * Allows users to select a tenant user from available options for a given bank/branch
 */

import React, { useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { TenantUser, UserRole } from '../../types/tenant';
import { useTenant } from '../../contexts/TenantContext';

interface UserSelectorProps {
  bankId?: number;
  branchId?: number;
  selectedUserId?: number;
  onUserChange?: (user: TenantUser | null) => void;
  roleFilter?: UserRole[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  bankId,
  branchId,
  selectedUserId,
  onUserChange,
  roleFilter,
  disabled = false,
  placeholder = "Select a user...",
  className = "",
}) => {
  const { state, loadUsers, selectUser } = useTenant();
  const { availableUsers, isLoadingUsers, currentBank, currentBranch } = state;

  const targetBankId = bankId || currentBank?.id;
  const targetBranchId = branchId || currentBranch?.id;
  const isDisabled = disabled || !targetBankId || isLoadingUsers;

  // Load users when bank or branch changes
  useEffect(() => {
    if (targetBankId) {
      loadUsers(targetBankId, targetBranchId);
    }
  }, [targetBankId, targetBranchId, loadUsers]);

  const handleUserSelect = async (userId: string) => {
    const selectedTenantUser = availableUsers.find(user => user.id.toString() === userId) || null;
    
    // Update internal state
    await selectUser(selectedTenantUser);
    
    // Call external handler if provided
    if (onUserChange) {
      onUserChange(selectedTenantUser);
    }
  };

  const currentValue = selectedUserId?.toString() || state.currentUser?.id?.toString() || "";

  // Filter users by role if specified
  const filteredUsers = roleFilter 
    ? availableUsers.filter(user => roleFilter.includes(user.role))
    : availableUsers;

  const getPlaceholderText = () => {
    if (!targetBankId) return "Select a bank first";
    if (isLoadingUsers) return "Loading users...";
    return placeholder;
  };

  const getRoleDisplay = (role: UserRole) => {
    const roleDisplayMap = {
      [UserRole.BANK_ADMIN]: 'Bank Admin',
      [UserRole.BRANCH_MANAGER]: 'Branch Manager',
      [UserRole.SENIOR_APPRAISER]: 'Senior Appraiser',
      [UserRole.GOLD_APPRAISER]: 'Gold Appraiser',
      [UserRole.TRAINEE_APPRAISER]: 'Trainee Appraiser',
      [UserRole.AUDITOR]: 'Auditor',
      [UserRole.VIEWER]: 'Viewer',
    };
    return roleDisplayMap[role] || role;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-red-600';
      case 'pending_verification': return 'text-yellow-600';
      case 'training': return 'text-blue-600';
      case 'suspended': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        User
        {roleFilter && (
          <span className="text-xs text-gray-500 ml-2">
            (Roles: {roleFilter.map(role => getRoleDisplay(role)).join(', ')})
          </span>
        )}
      </label>
      <Select
        value={currentValue}
        onValueChange={handleUserSelect}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={getPlaceholderText()} />
        </SelectTrigger>
        <SelectContent>
          {filteredUsers.map((user) => (
            <SelectItem key={user.id} value={user.id.toString()}>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{user.full_name}</span>
                  <span className={`text-xs ${getStatusColor(user.status)}`}>
                    {user.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  <span>{getRoleDisplay(user.role)}</span>
                  <span className="mx-2">•</span>
                  <span>{user.user_id}</span>
                  {user.employee_id && (
                    <>
                      <span className="mx-2">•</span>
                      <span>EMP: {user.employee_id}</span>
                    </>
                  )}
                </div>
                {user.email && (
                  <div className="text-xs text-gray-400">{user.email}</div>
                )}
              </div>
            </SelectItem>
          ))}
          {filteredUsers.length === 0 && !isLoadingUsers && targetBankId && (
            <SelectItem value="no-users" disabled>
              {roleFilter ? 
                `No users with roles: ${roleFilter.map(r => getRoleDisplay(r)).join(', ')}` :
                'No users available'
              }
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelector;