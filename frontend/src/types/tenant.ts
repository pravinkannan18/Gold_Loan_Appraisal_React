/**
 * Tenant Hierarchy Types for Gold Loan Appraisal System
 * 
 * These types correspond to the backend tenant schemas
 */

// ============================================================================
// Enums
// ============================================================================

export enum UserRole {
  BANK_ADMIN = 'bank_admin',
  BRANCH_MANAGER = 'branch_manager',
  SENIOR_APPRAISER = 'senior_appraiser',
  GOLD_APPRAISER = 'gold_appraiser',
  TRAINEE_APPRAISER = 'trainee_appraiser',
  AUDITOR = 'auditor',
  VIEWER = 'viewer'
}

export enum AppraiserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_VERIFICATION = 'pending_verification',
  TRAINING = 'training',
  SUSPENDED = 'suspended'
}

export enum SessionStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  APPRAISER_COMPLETED = 'appraiser_completed',
  CUSTOMER_COMPLETED = 'customer_completed',
  RBI_COMPLETED = 'rbi_completed',
  PURITY_COMPLETED = 'purity_completed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

// ============================================================================
// Base Types
// ============================================================================

export interface TimestampMixin {
  created_at?: string;
  updated_at?: string;
}

export interface TenantMixin {
  bank_id?: number;
  branch_id?: number;
  tenant_user_id?: number;
}

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  mobile?: string;
  landline?: string;
  fax?: string;
}

// ============================================================================
// Bank & Branch Types
// ============================================================================

export interface Bank extends TimestampMixin {
  id: number;
  bank_code: string;
  bank_name: string;
  bank_short_name: string;
  headquarters_address: string;
  contact_email: string;
  contact_phone: string;
  rbi_license_number: string;
  is_active?: boolean;
  system_configuration?: Record<string, any>;
  tenant_settings?: Record<string, any>;
}

export interface BankCreate {
  bank_code: string;
  bank_name: string;
  bank_short_name: string;
  headquarters_address: string;
  contact_email: string;
  contact_phone: string;
  rbi_license_number: string;
  system_configuration?: Record<string, any>;
  tenant_settings?: Record<string, any>;
}

export interface OperationalHours {
  monday?: { open?: string; close?: string };
  tuesday?: { open?: string; close?: string };
  wednesday?: { open?: string; close?: string };
  thursday?: { open?: string; close?: string };
  friday?: { open?: string; close?: string };
  saturday?: { open?: string; close?: string };
  sunday?: { open?: string; close?: string };
}

export interface Branch extends TimestampMixin {
  id: number;
  bank_id: number;
  branch_code: string;
  branch_name: string;
  branch_address: string;
  branch_city: string;
  branch_state: string;
  branch_pincode: string;
  contact_phone?: string;
  manager_name?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  operational_hours?: OperationalHours;
  branch_settings?: Record<string, any>;
  
  // Relation data (when populated)
  bank?: Bank;
}

export interface BranchCreate {
  bank_id: number;
  branch_code: string;
  branch_name: string;
  branch_address: string;
  branch_city: string;
  branch_state: string;
  branch_pincode: string;
  contact_phone?: string;
  manager_name?: string;
  latitude?: number;
  longitude?: number;
  operational_hours?: OperationalHours;
  branch_settings?: Record<string, any>;
}

// ============================================================================
// User Types
// ============================================================================

export interface UserPermissions {
  can_create_session?: boolean;
  can_edit_session?: boolean;
  can_delete_session?: boolean;
  can_view_reports?: boolean;
  can_manage_users?: boolean;
  can_manage_settings?: boolean;
  can_approve_appraisals?: boolean;
  can_export_data?: boolean;
}

export interface TenantUser extends TimestampMixin {
  id: number;
  bank_id: number;
  branch_id?: number;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: AppraiserStatus;
  hire_date?: string;
  employee_id?: string;
  certification_level?: string;
  face_encoding_data?: string;
  last_login?: string;
  permissions?: UserPermissions;
  user_settings?: Record<string, any>;
  
  // Relation data (when populated)
  bank?: Bank;
  branch?: Branch;
}

export interface TenantUserCreate {
  bank_id: number;
  branch_id?: number;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  hire_date?: string;
  employee_id?: string;
  certification_level?: string;
  permissions?: UserPermissions;
  user_settings?: Record<string, any>;
}

// ============================================================================
// Tenant Context Types
// ============================================================================

export interface TenantContext {
  bank: Bank;
  branch?: Branch;
  user: TenantUser;
  permissions: UserPermissions;
  settings: {
    bank_settings: Record<string, any>;
    branch_settings?: Record<string, any>;
    user_settings: Record<string, any>;
  };
}

export interface TenantHierarchyResponse {
  success: boolean;
  data: {
    banks: Array<Bank & { 
      branches: Array<Branch & { 
        users: TenantUser[] 
      }> 
    }>;
    total_banks: number;
    total_branches: number;
    total_users: number;
  };
  message: string;
}

// ============================================================================
// Session Types (Updated with Tenant Context)
// ============================================================================

export interface Session extends TimestampMixin, TenantMixin {
  id: number;
  session_id: string;
  status: SessionStatus;
  
  // Legacy fields for backward compatibility
  name?: string;
  bank?: string;
  branch?: string;
  email?: string;
  phone?: string;
  appraiser_id?: string;
  image_data?: string;
  face_encoding?: string;
  
  // Relation data (when populated)
  tenant_bank?: Bank;
  tenant_branch?: Branch;
  tenant_user?: TenantUser;
}

export interface SessionCreate extends TenantMixin {
  session_id?: string;
  
  // Can be provided for backward compatibility
  name?: string;
  bank?: string;
  branch?: string;
  email?: string;
  phone?: string;
  appraiser_id?: string;
  image_data?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  message: string;
}

export interface ErrorResponse {
  success: false;
  error_code?: string;
  error_details?: Record<string, any>;
  message: string;
  timestamp: string;
}

// ============================================================================
// Search and Filter Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  date_from?: string;
  date_to?: string;
}

export interface TenantSearchFilters {
  bank_id?: number;
  branch_id?: number;
  role?: UserRole;
  status?: AppraiserStatus;
  city?: string;
  state?: string;
}

// ============================================================================
// Updated Legacy Types (for backward compatibility)
// ============================================================================

export interface AppraiserData extends TenantMixin {
  name: string;
  id: string;
  image: string;
  timestamp: string;
  bank?: string;
  branch?: string;
  email?: string;
  phone?: string;
  
  // New tenant fields
  tenant_bank?: Bank;
  tenant_branch?: Branch;
  tenant_user?: TenantUser;
}

export interface CustomerData extends TenantMixin {
  customer_image?: string;
  customer_name?: string;
  customer_id?: string;
  customer_phone?: string;
  customer_address?: string;
  
  // New tenant context
  tenant_bank?: Bank;
  tenant_branch?: Branch;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface TenantProviderProps {
  children: React.ReactNode;
  bankId?: number;
  branchId?: number;
  userId?: number;
}

export interface BankSelectorProps {
  selectedBankId?: number;
  onBankChange: (bank: Bank | null) => void;
  disabled?: boolean;
}

export interface BranchSelectorProps {
  bankId: number;
  selectedBranchId?: number;
  onBranchChange: (branch: Branch | null) => void;
  disabled?: boolean;
}

export interface UserSelectorProps {
  bankId: number;
  branchId?: number;
  selectedUserId?: number;
  onUserChange: (user: TenantUser | null) => void;
  roleFilter?: UserRole[];
  disabled?: boolean;
}