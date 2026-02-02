# Frontend Tenant Integration

This document outlines the frontend integration for the multi-bank, multi-branch tenant hierarchy system.

## Overview

The frontend has been updated to support the tenant hierarchy with the following components:

- **Tenant Context Management**: React context for managing tenant state
- **Tenant Selectors**: Components for selecting banks, branches, and users
- **Tenant-aware Pages**: Updated pages with tenant context integration
- **Permission System**: Role-based permissions and access control

## Key Features

### 1. Tenant Context Provider (`TenantProvider`)
- Manages global tenant state (bank, branch, user selection)
- Provides tenant context to all child components
- Handles API calls for tenant hierarchy data
- Calculates user permissions based on roles

### 2. Tenant Selector Components
- **BankSelector**: Select from available banks
- **BranchSelector**: Select branches for a given bank
- **UserSelector**: Select users with optional role filtering
- **TenantSelector**: Combined selector with cascading dropdowns

### 3. Updated Pages

#### Dashboard
- Shows current tenant context
- Displays tenant-specific information
- Links to tenant management for admin users

#### New Appraisal
- Requires tenant selection before starting
- Stores tenant context for the appraisal session
- Validates required selections

#### Tenant Management
- Admin interface for managing tenant hierarchy
- View banks, branches, and users
- Role-based access control

### 4. Types and API Integration

#### Types (`types/tenant.ts`)
- Complete TypeScript definitions for tenant hierarchy
- Enums for user roles, statuses, and permissions
- API request/response interfaces

#### API Service (`services/tenantApi.ts`)
- Comprehensive API client for tenant operations
- CRUD operations for banks, branches, and users
- Search and analytics endpoints

#### Custom Hooks (`hooks/useTenantHooks.ts`)
- `useTenantContext`: Get current tenant context for API calls
- `useTenantPermissions`: Access user permissions
- `useTenantDisplay`: Format tenant info for display

## Usage Examples

### Using Tenant Context in Components

```tsx
import { useTenant } from '@/contexts/TenantContext';
import { useTenantContext } from '@/hooks/useTenantHooks';

const MyComponent = () => {
  const { state } = useTenant();
  const { tenantContext } = useTenantContext();
  
  // Access current selections
  const { currentBank, currentBranch, currentUser, permissions } = state;
  
  // Get tenant context for API calls
  const apiData = {
    ...myData,
    ...tenantContext, // Adds bank_id, branch_id, tenant_user_id
  };
  
  return (
    <div>
      {currentBank && <p>Bank: {currentBank.bank_short_name}</p>}
      {permissions.canCreateSession && <Button>Create Session</Button>}
    </div>
  );
};
```

### Adding Tenant Selection to a Page

```tsx
import { TenantSelector } from '@/components/tenant';

const MyPage = () => {
  const handleSelection = (selection) => {
    console.log('Selected:', selection);
  };

  return (
    <TenantSelector
      onSelectionChange={handleSelection}
      roleFilter={[UserRole.GOLD_APPRAISER]}
    />
  );
};
```

### Role-based Access Control

```tsx
import { useTenantPermissions } from '@/hooks/useTenantHooks';

const AdminPanel = () => {
  const { canManageUsers, canViewReports } = useTenantPermissions();
  
  if (!canManageUsers) {
    return <div>Access denied</div>;
  }
  
  return (
    <div>
      {canViewReports && <ReportsSection />}
      <UserManagement />
    </div>
  );
};
```

## User Roles and Permissions

### Role Hierarchy
1. **BANK_ADMIN**: Full access to all bank operations
2. **BRANCH_MANAGER**: Manage branch operations and users
3. **SENIOR_APPRAISER**: Advanced appraisal capabilities
4. **GOLD_APPRAISER**: Standard appraisal operations
5. **TRAINEE_APPRAISER**: Limited appraisal access
6. **AUDITOR**: View-only access for compliance
7. **VIEWER**: Basic read-only access

### Permission Matrix
| Permission | Bank Admin | Branch Manager | Senior Appraiser | Gold Appraiser | Trainee | Auditor | Viewer |
|------------|------------|----------------|------------------|----------------|---------|---------|--------|
| Create Session | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Edit Session | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete Session | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| View Reports | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| Manage Users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Settings | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Approve Appraisals | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Export Data | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |

## Integration with Existing Code

### API Requests
All API requests should include tenant context:

```tsx
const { tenantContext } = useTenantContext();

const saveAppraiser = async (appraiserData) => {
  const data = {
    ...appraiserData,
    ...tenantContext, // Adds tenant fields
  };
  
  return apiService.saveAppraiser(data);
};
```

### Session Storage
Tenant context is stored for appraisal sessions:

```tsx
// Store tenant context when starting appraisal
localStorage.setItem('appraisalTenantContext', JSON.stringify({
  bank_id: selectedBank.id,
  branch_id: selectedBranch?.id,
  tenant_user_id: selectedUser.id,
  // Additional context...
}));

// Retrieve in other components
const tenantContext = JSON.parse(
  localStorage.getItem('appraisalTenantContext') || '{}'
);
```

## Migration from Legacy Code

### Backward Compatibility
- Legacy bank/branch string fields are still supported
- New tenant fields supplement existing data
- Gradual migration path for existing components

### Updated Interfaces
```tsx
// Old interface
interface AppraiserData {
  name: string;
  bank?: string;
  branch?: string;
}

// Updated interface (backward compatible)
interface AppraiserData extends TenantMixin {
  name: string;
  bank?: string;  // Legacy field
  branch?: string; // Legacy field
  // New tenant fields from TenantMixin:
  // bank_id?: number;
  // branch_id?: number;
  // tenant_user_id?: number;
}
```

## Development Notes

### Environment Setup
Make sure your `.env` file includes:
```
VITE_API_URL=http://localhost:8000
```

### Testing
The tenant system can be tested with the sample data created by the backend tenant setup utility.

### Production Considerations
- Implement proper authentication before deploying
- Configure CORS for your production API URL
- Set up proper error handling and logging
- Consider implementing tenant data caching for performance

## Next Steps

1. **Authentication Integration**: Add login/logout with tenant context
2. **Audit Logging**: Track tenant-specific actions
3. **Data Filtering**: Implement tenant-scoped data queries
4. **Mobile Responsiveness**: Optimize tenant selectors for mobile
5. **Performance Optimization**: Add tenant data caching and lazy loading