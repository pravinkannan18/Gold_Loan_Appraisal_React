/**
 * Tenant Context Provider
 * Manages tenant hierarchy state throughout the application
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  Bank, 
  Branch, 
  TenantUser, 
  TenantContext as TenantContextType,
  UserRole 
} from '../types/tenant';
import { tenantApi } from '../services/tenantApi';

// ============================================================================
// State Types
// ============================================================================

interface TenantState {
  // Current tenant context
  currentBank: Bank | null;
  currentBranch: Branch | null;
  currentUser: TenantUser | null;
  tenantContext: TenantContextType | null;
  
  // Available options
  availableBanks: Bank[];
  availableBranches: Branch[];
  availableUsers: TenantUser[];
  
  // Loading states
  isLoading: boolean;
  isLoadingBanks: boolean;
  isLoadingBranches: boolean;
  isLoadingUsers: boolean;
  
  // Error states
  error: string | null;
  
  // Permissions (derived from current user)
  permissions: {
    canCreateSession: boolean;
    canEditSession: boolean;
    canDeleteSession: boolean;
    canViewReports: boolean;
    canManageUsers: boolean;
    canManageSettings: boolean;
    canApproveAppraisals: boolean;
    canExportData: boolean;
  };
}

// ============================================================================
// Action Types
// ============================================================================

type TenantAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_BANKS'; payload: boolean }
  | { type: 'SET_LOADING_BRANCHES'; payload: boolean }
  | { type: 'SET_LOADING_USERS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BANKS'; payload: Bank[] }
  | { type: 'SET_BRANCHES'; payload: Branch[] }
  | { type: 'SET_USERS'; payload: TenantUser[] }
  | { type: 'SET_CURRENT_BANK'; payload: Bank | null }
  | { type: 'SET_CURRENT_BRANCH'; payload: Branch | null }
  | { type: 'SET_CURRENT_USER'; payload: TenantUser | null }
  | { type: 'SET_TENANT_CONTEXT'; payload: TenantContextType | null }
  | { type: 'RESET_STATE' };

// ============================================================================
// Initial State
// ============================================================================

const initialState: TenantState = {
  currentBank: null,
  currentBranch: null,
  currentUser: null,
  tenantContext: null,
  availableBanks: [],
  availableBranches: [],
  availableUsers: [],
  isLoading: false,
  isLoadingBanks: false,
  isLoadingBranches: false,
  isLoadingUsers: false,
  error: null,
  permissions: {
    canCreateSession: false,
    canEditSession: false,
    canDeleteSession: false,
    canViewReports: false,
    canManageUsers: false,
    canManageSettings: false,
    canApproveAppraisals: false,
    canExportData: false,
  },
};

// ============================================================================
// Reducer
// ============================================================================

const tenantReducer = (state: TenantState, action: TenantAction): TenantState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_LOADING_BANKS':
      return { ...state, isLoadingBanks: action.payload };
    
    case 'SET_LOADING_BRANCHES':
      return { ...state, isLoadingBranches: action.payload };
    
    case 'SET_LOADING_USERS':
      return { ...state, isLoadingUsers: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_BANKS':
      return { ...state, availableBanks: action.payload };
    
    case 'SET_BRANCHES':
      return { ...state, availableBranches: action.payload };
    
    case 'SET_USERS':
      return { ...state, availableUsers: action.payload };
    
    case 'SET_CURRENT_BANK':
      return { 
        ...state, 
        currentBank: action.payload,
        // Clear dependent selections
        currentBranch: null,
        currentUser: null,
        availableBranches: [],
        availableUsers: [],
      };
    
    case 'SET_CURRENT_BRANCH':
      return { 
        ...state, 
        currentBranch: action.payload,
        // Clear dependent selections
        currentUser: null,
        availableUsers: [],
      };
    
    case 'SET_CURRENT_USER':
      return { 
        ...state, 
        currentUser: action.payload,
        permissions: calculatePermissions(action.payload),
      };
    
    case 'SET_TENANT_CONTEXT':
      return { ...state, tenantContext: action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
};

// ============================================================================
// Permission Calculator
// ============================================================================

const calculatePermissions = (user: TenantUser | null) => {
  if (!user) {
    return initialState.permissions;
  }

  const role = user.role;
  const userPermissions = user.permissions || {};

  // Base permissions by role
  const basePermissions = {
    [UserRole.BANK_ADMIN]: {
      canCreateSession: true,
      canEditSession: true,
      canDeleteSession: true,
      canViewReports: true,
      canManageUsers: true,
      canManageSettings: true,
      canApproveAppraisals: true,
      canExportData: true,
    },
    [UserRole.BRANCH_MANAGER]: {
      canCreateSession: true,
      canEditSession: true,
      canDeleteSession: true,
      canViewReports: true,
      canManageUsers: true,
      canManageSettings: false,
      canApproveAppraisals: true,
      canExportData: true,
    },
    [UserRole.SENIOR_APPRAISER]: {
      canCreateSession: true,
      canEditSession: true,
      canDeleteSession: false,
      canViewReports: true,
      canManageUsers: false,
      canManageSettings: false,
      canApproveAppraisals: true,
      canExportData: false,
    },
    [UserRole.GOLD_APPRAISER]: {
      canCreateSession: true,
      canEditSession: true,
      canDeleteSession: false,
      canViewReports: false,
      canManageUsers: false,
      canManageSettings: false,
      canApproveAppraisals: false,
      canExportData: false,
    },
    [UserRole.TRAINEE_APPRAISER]: {
      canCreateSession: true,
      canEditSession: false,
      canDeleteSession: false,
      canViewReports: false,
      canManageUsers: false,
      canManageSettings: false,
      canApproveAppraisals: false,
      canExportData: false,
    },
    [UserRole.AUDITOR]: {
      canCreateSession: false,
      canEditSession: false,
      canDeleteSession: false,
      canViewReports: true,
      canManageUsers: false,
      canManageSettings: false,
      canApproveAppraisals: false,
      canExportData: true,
    },
    [UserRole.VIEWER]: {
      canCreateSession: false,
      canEditSession: false,
      canDeleteSession: false,
      canViewReports: true,
      canManageUsers: false,
      canManageSettings: false,
      canApproveAppraisals: false,
      canExportData: false,
    },
  };

  const rolePermissions = basePermissions[role] || initialState.permissions;
  
  // Override with user-specific permissions
  return {
    canCreateSession: userPermissions.can_create_session ?? rolePermissions.canCreateSession,
    canEditSession: userPermissions.can_edit_session ?? rolePermissions.canEditSession,
    canDeleteSession: userPermissions.can_delete_session ?? rolePermissions.canDeleteSession,
    canViewReports: userPermissions.can_view_reports ?? rolePermissions.canViewReports,
    canManageUsers: userPermissions.can_manage_users ?? rolePermissions.canManageUsers,
    canManageSettings: userPermissions.can_manage_settings ?? rolePermissions.canManageSettings,
    canApproveAppraisals: userPermissions.can_approve_appraisals ?? rolePermissions.canApproveAppraisals,
    canExportData: userPermissions.can_export_data ?? rolePermissions.canExportData,
  };
};

// ============================================================================
// Context
// ============================================================================

interface TenantContextValue {
  // State
  state: TenantState;
  
  // Actions
  loadBanks: () => Promise<void>;
  loadBranches: (bankId?: number) => Promise<void>;
  loadUsers: (bankId?: number, branchId?: number) => Promise<void>;
  selectBank: (bank: Bank | null) => Promise<void>;
  selectBranch: (branch: Branch | null) => Promise<void>;
  selectUser: (user: TenantUser | null) => Promise<void>;
  loadTenantContext: (bankId: number, branchId?: number, userId?: number) => Promise<void>;
  resetTenantState: () => void;
  
  // Convenience getters
  getCurrentTenantInfo: () => {
    bankCode: string | null;
    branchCode: string | null;
    userRole: UserRole | null;
    userId: string | null;
  };
}

const TenantContext = createContext<TenantContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface TenantProviderProps {
  children: ReactNode;
  autoLoadBanks?: boolean;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ 
  children, 
  autoLoadBanks = true 
}) => {
  const [state, dispatch] = useReducer(tenantReducer, initialState);

  // ============================================================================
  // Actions
  // ============================================================================

  const loadBanks = async () => {
    dispatch({ type: 'SET_LOADING_BANKS', payload: true });
    try {
      const response = await tenantApi.getBanks();
      if (response.success && response.data) {
        dispatch({ type: 'SET_BANKS', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load banks: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING_BANKS', payload: false });
    }
  };

  const loadBranches = async (bankId?: number) => {
    const targetBankId = bankId || state.currentBank?.id;
    if (!targetBankId) return;

    dispatch({ type: 'SET_LOADING_BRANCHES', payload: true });
    try {
      const response = await tenantApi.getBranches(targetBankId);
      if (response.success && response.data) {
        dispatch({ type: 'SET_BRANCHES', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load branches: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING_BRANCHES', payload: false });
    }
  };

  const loadUsers = async (bankId?: number, branchId?: number) => {
    const targetBankId = bankId || state.currentBank?.id;
    const targetBranchId = branchId || state.currentBranch?.id;
    
    if (!targetBankId) return;

    dispatch({ type: 'SET_LOADING_USERS', payload: true });
    try {
      const response = await tenantApi.getUsers(targetBankId, targetBranchId);
      if (response.success && response.data) {
        dispatch({ type: 'SET_USERS', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load users: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING_USERS', payload: false });
    }
  };

  const selectBank = async (bank: Bank | null) => {
    dispatch({ type: 'SET_CURRENT_BANK', payload: bank });
    if (bank) {
      await loadBranches(bank.id);
    }
  };

  const selectBranch = async (branch: Branch | null) => {
    dispatch({ type: 'SET_CURRENT_BRANCH', payload: branch });
    if (branch && state.currentBank) {
      await loadUsers(state.currentBank.id, branch.id);
    }
  };

  const selectUser = async (user: TenantUser | null) => {
    dispatch({ type: 'SET_CURRENT_USER', payload: user });
    
    if (user && state.currentBank) {
      await loadTenantContext(
        state.currentBank.id,
        state.currentBranch?.id,
        user.id
      );
    }
  };

  const loadTenantContext = async (
    bankId: number, 
    branchId?: number, 
    userId?: number
  ) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await tenantApi.getTenantContext(bankId, branchId, userId);
      if (response.success && response.data) {
        dispatch({ type: 'SET_TENANT_CONTEXT', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to load tenant context: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const resetTenantState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const getCurrentTenantInfo = () => ({
    bankCode: state.currentBank?.bank_code || null,
    branchCode: state.currentBranch?.branch_code || null,
    userRole: state.currentUser?.role || null,
    userId: state.currentUser?.user_id || null,
  });

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (autoLoadBanks) {
      loadBanks();
    }
  }, [autoLoadBanks]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: TenantContextValue = {
    state,
    loadBanks,
    loadBranches,
    loadUsers,
    selectBank,
    selectBranch,
    selectUser,
    loadTenantContext,
    resetTenantState,
    getCurrentTenantInfo,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export default TenantProvider;