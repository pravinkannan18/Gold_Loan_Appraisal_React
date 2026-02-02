/**
 * Custom hooks for tenant management
 */

import { useCallback } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { TenantMixin } from '../types/tenant';

/**
 * Hook to get current tenant context for API requests
 */
export const useTenantContext = () => {
  const { state } = useTenant();
  const { currentBank, currentBranch, currentUser } = state;

  const getTenantContext = useCallback((): TenantMixin => {
    return {
      bank_id: currentBank?.id,
      branch_id: currentBranch?.id,
      tenant_user_id: currentUser?.id,
    };
  }, [currentBank, currentBranch, currentUser]);

  const isValidTenantContext = useCallback((): boolean => {
    return !!(currentBank || currentBranch || currentUser);
  }, [currentBank, currentBranch, currentUser]);

  return {
    tenantContext: getTenantContext(),
    isValidTenantContext: isValidTenantContext(),
    currentBank,
    currentBranch,
    currentUser,
  };
};

/**
 * Hook to check tenant permissions
 */
export const useTenantPermissions = () => {
  const { state } = useTenant();
  const { permissions } = state;

  return {
    ...permissions,
    hasAnyPermission: Object.values(permissions).some(Boolean),
  };
};

/**
 * Hook to format tenant information for display
 */
export const useTenantDisplay = () => {
  const { state, getCurrentTenantInfo } = useTenant();
  const { currentBank, currentBranch, currentUser } = state;
  const tenantInfo = getCurrentTenantInfo();

  const getDisplayText = useCallback(() => {
    const parts = [];
    
    if (currentBank) {
      parts.push(currentBank.bank_short_name);
    }
    
    if (currentBranch) {
      parts.push(currentBranch.branch_name);
    }
    
    if (currentUser) {
      parts.push(`${currentUser.full_name} (${currentUser.role.replace('_', ' ')})`);
    }
    
    return parts.join(' → ');
  }, [currentBank, currentBranch, currentUser]);

  const getBreadcrumbs = useCallback(() => {
    const breadcrumbs = [];
    
    if (currentBank) {
      breadcrumbs.push({
        label: currentBank.bank_short_name,
        type: 'bank',
        id: currentBank.id,
      });
    }
    
    if (currentBranch) {
      breadcrumbs.push({
        label: currentBranch.branch_name,
        type: 'branch',
        id: currentBranch.id,
      });
    }
    
    if (currentUser) {
      breadcrumbs.push({
        label: currentUser.full_name,
        type: 'user',
        id: currentUser.id,
        role: currentUser.role,
      });
    }
    
    return breadcrumbs;
  }, [currentBank, currentBranch, currentUser]);

  return {
    displayText: getDisplayText(),
    breadcrumbs: getBreadcrumbs(),
    tenantInfo,
    hasSelection: !!(currentBank || currentBranch || currentUser),
  };
};

export default {
  useTenantContext,
  useTenantPermissions,
  useTenantDisplay,
};