/**
 * Tenant Management Page
 * Allows admin users to manage the tenant hierarchy
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useTenant } from '../contexts/TenantContext';
import { TenantSelector } from '../components/tenant';
import { Bank, Branch, TenantUser, UserRole } from '../types/tenant';

const TenantManagement: React.FC = () => {
  const { state, loadBanks, loadBranches, loadUsers } = useTenant();
  const { 
    availableBanks, 
    availableBranches, 
    availableUsers,
    currentBank,
    currentBranch,
    currentUser,
    permissions,
    isLoadingBanks,
    isLoadingBranches,
    isLoadingUsers 
  } = state;

  const [activeTab, setActiveTab] = useState('overview');

  const handleTenantSelection = (selection: {
    bank: Bank | null;
    branch: Branch | null;
    user: TenantUser | null;
  }) => {
    console.log('Tenant selection changed:', selection);
  };

  const refreshData = async () => {
    await loadBanks();
    if (currentBank) {
      await loadBranches(currentBank.id);
      if (currentBranch) {
        await loadUsers(currentBank.id, currentBranch.id);
      }
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.BANK_ADMIN: return 'bg-purple-100 text-purple-800';
      case UserRole.BRANCH_MANAGER: return 'bg-blue-100 text-blue-800';
      case UserRole.SENIOR_APPRAISER: return 'bg-green-100 text-green-800';
      case UserRole.GOLD_APPRAISER: return 'bg-yellow-100 text-yellow-800';
      case UserRole.TRAINEE_APPRAISER: return 'bg-orange-100 text-orange-800';
      case UserRole.AUDITOR: return 'bg-red-100 text-red-800';
      case UserRole.VIEWER: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user has permission to manage tenants
  if (!permissions.canManageUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to manage tenant hierarchies.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tenant Management
          </h1>
          <p className="text-gray-600">
            Manage banks, branches, and users in the tenant hierarchy
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tenant Selector */}
          <div className="lg:col-span-1">
            <TenantSelector
              onSelectionChange={handleTenantSelection}
              title="Select Tenant"
              description="Choose bank, branch, and user to manage"
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="banks">Banks</TabsTrigger>
                  <TabsTrigger value="branches">Branches</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>
                <Button onClick={refreshData} size="sm">
                  Refresh Data
                </Button>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium text-gray-900">Total Banks</h3>
                      <p className="text-3xl font-bold text-blue-600">
                        {isLoadingBanks ? '...' : availableBanks.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium text-gray-900">Total Branches</h3>
                      <p className="text-3xl font-bold text-green-600">
                        {isLoadingBranches ? '...' : availableBranches.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
                      <p className="text-3xl font-bold text-purple-600">
                        {isLoadingUsers ? '...' : availableUsers.length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {currentBank && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Bank Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank Code:</span>
                          <span className="font-medium">{currentBank.bank_code}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Full Name:</span>
                          <span className="font-medium">{currentBank.bank_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">RBI License:</span>
                          <span className="font-medium">{currentBank.rbi_license_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contact:</span>
                          <span className="font-medium">{currentBank.contact_email}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Banks Tab */}
              <TabsContent value="banks">
                <Card>
                  <CardHeader>
                    <CardTitle>Banks ({availableBanks.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {availableBanks.map((bank) => (
                        <div key={bank.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{bank.bank_name}</h3>
                              <p className="text-sm text-gray-600">
                                Code: {bank.bank_code} | RBI: {bank.rbi_license_number}
                              </p>
                              <p className="text-sm text-gray-600">{bank.headquarters_address}</p>
                            </div>
                            <Badge variant={bank.is_active ? 'default' : 'secondary'}>
                              {bank.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Branches Tab */}
              <TabsContent value="branches">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Branches ({availableBranches.length})
                      {currentBank && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          for {currentBank.bank_short_name}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {availableBranches.map((branch) => (
                        <div key={branch.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{branch.branch_name}</h3>
                              <p className="text-sm text-gray-600">
                                Code: {branch.branch_code}
                              </p>
                              <p className="text-sm text-gray-600">
                                {branch.branch_address}, {branch.branch_city}, {branch.branch_state} - {branch.branch_pincode}
                              </p>
                              {branch.manager_name && (
                                <p className="text-sm text-gray-600">
                                  Manager: {branch.manager_name}
                                </p>
                              )}
                            </div>
                            <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                              {branch.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {availableBranches.length === 0 && currentBank && (
                        <p className="text-gray-500 text-center py-8">
                          No branches found for {currentBank.bank_short_name}
                        </p>
                      )}
                      {!currentBank && (
                        <p className="text-gray-500 text-center py-8">
                          Select a bank to view its branches
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Users ({availableUsers.length})
                      {currentBranch && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          for {currentBranch.branch_name}
                        </span>
                      )}
                      {currentBank && !currentBranch && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          for {currentBank.bank_short_name}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {availableUsers.map((user) => (
                        <div key={user.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{user.full_name}</h3>
                              <p className="text-sm text-gray-600">
                                ID: {user.user_id} | Employee: {user.employee_id || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {user.phone && (
                                <p className="text-sm text-gray-600">Phone: {user.phone}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Badge className={getRoleColor(user.role)}>
                                  {user.role.replace('_', ' ').toUpperCase()}
                                </Badge>
                                <Badge className={getStatusColor(user.status)}>
                                  {user.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {availableUsers.length === 0 && currentBank && (
                        <p className="text-gray-500 text-center py-8">
                          No users found for the selected {currentBranch ? 'branch' : 'bank'}
                        </p>
                      )}
                      {!currentBank && (
                        <p className="text-gray-500 text-center py-8">
                          Select a bank and branch to view users
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;