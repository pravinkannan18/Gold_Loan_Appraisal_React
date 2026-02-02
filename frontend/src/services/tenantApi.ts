/**
 * Tenant API Service
 * Handles all tenant hierarchy related API calls
 */

import { 
  Bank, 
  BankCreate, 
  Branch, 
  BranchCreate, 
  TenantUser, 
  TenantUserCreate, 
  TenantContext,
  TenantHierarchyResponse,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  SearchParams,
  TenantSearchFilters
} from '../types/tenant';

class TenantApiService {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Bank Management
  // ============================================================================

  async getBanks(params?: PaginationParams & SearchParams): Promise<PaginatedResponse<Bank>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/tenant/banks${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<Bank[]>(endpoint);
  }

  async getBank(bankId: number): Promise<ApiResponse<Bank>> {
    return this.makeRequest<Bank>(`/api/tenant/banks/${bankId}`);
  }

  async createBank(bank: BankCreate): Promise<ApiResponse<Bank>> {
    return this.makeRequest<Bank>('/api/tenant/banks', {
      method: 'POST',
      body: JSON.stringify(bank),
    });
  }

  async updateBank(bankId: number, bank: Partial<BankCreate>): Promise<ApiResponse<Bank>> {
    return this.makeRequest<Bank>(`/api/tenant/banks/${bankId}`, {
      method: 'PUT',
      body: JSON.stringify(bank),
    });
  }

  async deleteBank(bankId: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/api/tenant/banks/${bankId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // Branch Management
  // ============================================================================

  async getBranches(
    bankId?: number, 
    params?: PaginationParams & SearchParams
  ): Promise<PaginatedResponse<Branch>> {
    const searchParams = new URLSearchParams();
    if (bankId) {
      searchParams.append('bank_id', bankId.toString());
    }
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/tenant/branches${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<Branch[]>(endpoint);
  }

  async getBranch(branchId: number): Promise<ApiResponse<Branch>> {
    return this.makeRequest<Branch>(`/api/tenant/branches/${branchId}`);
  }

  async createBranch(branch: BranchCreate): Promise<ApiResponse<Branch>> {
    return this.makeRequest<Branch>('/api/tenant/branches', {
      method: 'POST',
      body: JSON.stringify(branch),
    });
  }

  async updateBranch(branchId: number, branch: Partial<BranchCreate>): Promise<ApiResponse<Branch>> {
    return this.makeRequest<Branch>(`/api/tenant/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(branch),
    });
  }

  async deleteBranch(branchId: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/api/tenant/branches/${branchId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // User Management
  // ============================================================================

  async getUsers(
    bankId?: number, 
    branchId?: number, 
    params?: PaginationParams & SearchParams & TenantSearchFilters
  ): Promise<PaginatedResponse<TenantUser>> {
    const searchParams = new URLSearchParams();
    if (bankId) {
      searchParams.append('bank_id', bankId.toString());
    }
    if (branchId) {
      searchParams.append('branch_id', branchId.toString());
    }
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/api/tenant/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.makeRequest<TenantUser[]>(endpoint);
  }

  async getUser(userId: number): Promise<ApiResponse<TenantUser>> {
    return this.makeRequest<TenantUser>(`/api/tenant/users/${userId}`);
  }

  async createUser(user: TenantUserCreate): Promise<ApiResponse<TenantUser>> {
    return this.makeRequest<TenantUser>('/api/tenant/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(userId: number, user: Partial<TenantUserCreate>): Promise<ApiResponse<TenantUser>> {
    return this.makeRequest<TenantUser>(`/api/tenant/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(userId: number): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/api/tenant/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // Hierarchy and Context
  // ============================================================================

  async getTenantHierarchy(): Promise<TenantHierarchyResponse> {
    return this.makeRequest<TenantHierarchyResponse['data']>('/api/tenant/hierarchy');
  }

  async getTenantContext(
    bankId: number, 
    branchId?: number, 
    userId?: number
  ): Promise<ApiResponse<TenantContext>> {
    const searchParams = new URLSearchParams();
    searchParams.append('bank_id', bankId.toString());
    if (branchId) {
      searchParams.append('branch_id', branchId.toString());
    }
    if (userId) {
      searchParams.append('user_id', userId.toString());
    }
    
    const endpoint = `/api/tenant/context?${searchParams.toString()}`;
    return this.makeRequest<TenantContext>(endpoint);
  }

  // ============================================================================
  // Search and Analytics
  // ============================================================================

  async searchBanks(query: string): Promise<ApiResponse<Bank[]>> {
    return this.makeRequest<Bank[]>(`/api/tenant/banks/search?q=${encodeURIComponent(query)}`);
  }

  async searchBranches(bankId: number, query: string): Promise<ApiResponse<Branch[]>> {
    return this.makeRequest<Branch[]>(
      `/api/tenant/branches/search?bank_id=${bankId}&q=${encodeURIComponent(query)}`
    );
  }

  async searchUsers(
    query: string, 
    bankId?: number, 
    branchId?: number
  ): Promise<ApiResponse<TenantUser[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (bankId) {
      searchParams.append('bank_id', bankId.toString());
    }
    if (branchId) {
      searchParams.append('branch_id', branchId.toString());
    }
    
    const endpoint = `/api/tenant/users/search?${searchParams.toString()}`;
    return this.makeRequest<TenantUser[]>(endpoint);
  }

  async getBankStats(bankId?: number): Promise<ApiResponse<any>> {
    const endpoint = bankId ? `/api/tenant/banks/${bankId}/stats` : '/api/tenant/stats';
    return this.makeRequest<any>(endpoint);
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  async bulkCreateUsers(users: TenantUserCreate[]): Promise<ApiResponse<TenantUser[]>> {
    return this.makeRequest<TenantUser[]>('/api/tenant/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ users }),
    });
  }

  async bulkUpdateUsers(
    userIds: number[], 
    updates: Partial<TenantUserCreate>
  ): Promise<ApiResponse<TenantUser[]>> {
    return this.makeRequest<TenantUser[]>('/api/tenant/users/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ user_ids: userIds, updates }),
    });
  }

  // ============================================================================
  // Migration and Setup
  // ============================================================================

  async migrateLegacyData(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/tenant/migrate-legacy', {
      method: 'POST',
    });
  }

  async setupTenantSystem(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>('/api/tenant/setup', {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const tenantApi = new TenantApiService();
export default TenantApiService;