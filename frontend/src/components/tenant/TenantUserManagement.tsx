/**
 * Tenant User Management Component
 * Comprehensive interface for managing users within the tenant hierarchy
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Bank, Branch, TenantUser, TenantUserCreate, UserRole } from '../../types/tenant';
import { tenantApi } from '../../services/tenantApi';
import { toast } from '../../hooks/use-toast';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Shield,
  Save,
  X,
  Building,
  MapPin,
  Eye,
  EyeOff
} from 'lucide-react';

interface TenantUserManagementProps {
  selectedBankId?: number;
  selectedBranchId?: number;
}

export const TenantUserManagement: React.FC<TenantUserManagementProps> = ({
  selectedBankId,
  selectedBranchId,
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<TenantUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUserCreate | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  useEffect(() => {
    loadBanks();
  }, []);

  useEffect(() => {
    if (selectedBankId) {
      loadBranches(selectedBankId);
    }
  }, [selectedBankId]);

  useEffect(() => {
    loadUsers();
  }, [selectedBankId, selectedBranchId]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, selectedBankId, selectedBranchId]);

  const loadBanks = async () => {
    try {
      const response = await tenantApi.getBanks();
      if (response.success && response.data) {
        setBanks(response.data);
      }
    } catch (error) {
      toast({
        title: "Error loading banks",
        description: `Failed to load banks: ${error}`,
        variant: "destructive",
      });
    }
  };

  const loadBranches = async (bankId: number) => {
    try {
      const response = await tenantApi.getBranches(bankId);
      if (response.success && response.data) {
        setBranches(response.data);
      }
    } catch (error) {
      toast({
        title: "Error loading branches",
        description: `Failed to load branches: ${error}`,
        variant: "destructive",
      });
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await tenantApi.getTenantUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      toast({
        title: "Error loading users",
        description: `Failed to load users: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by bank
    if (selectedBankId) {
      filtered = filtered.filter(user => user.bank_id === selectedBankId);
    }

    // Filter by branch
    if (selectedBranchId) {
      filtered = filtered.filter(user => user.branch_id === selectedBranchId);
    }

    setFilteredUsers(filtered);
  };

  const handleUserSelect = (user: TenantUser) => {
    setSelectedUser(user);
  };

  const handleCreateUser = () => {
    setEditingUser({
      username: '',
      full_name: '',
      email: '',
      phone_number: '',
      password: '',
      role: UserRole.APPRAISER,
      bank_id: selectedBankId || 0,
      branch_id: selectedBranchId || undefined,
      permissions: {
        can_create_appraisal: true,
        can_view_appraisal: true,
        can_edit_appraisal: false,
        can_delete_appraisal: false,
        can_approve_appraisal: false,
        can_manage_customers: true,
        can_view_reports: false,
        can_manage_users: false,
        can_manage_branches: false,
        can_manage_system_settings: false
      }
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditUser = (user: TenantUser) => {
    setEditingUser({
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      password: '', // Don't pre-fill password for security
      role: user.role,
      bank_id: user.bank_id,
      branch_id: user.branch_id,
      permissions: user.permissions || {}
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      if (isCreateDialogOpen) {
        // Create new user
        const response = await tenantApi.createTenantUser(editingUser);
        if (response.success) {
          await loadUsers();
          setIsCreateDialogOpen(false);
          toast({
            title: "User created successfully",
            description: `${editingUser.full_name} has been added.`,
          });
        }
      } else {
        // Update existing user
        if (selectedUser) {
          const response = await tenantApi.updateTenantUser(selectedUser.id, editingUser);
          if (response.success) {
            await loadUsers();
            setIsEditDialogOpen(false);
            toast({
              title: "User updated successfully",
              description: `${editingUser.full_name} has been updated.`,
            });
          }
        }
      }
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "Error saving user",
        description: `Failed to save user: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: TenantUser) => {
    if (!confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await tenantApi.deleteTenantUser(user.id);
      await loadUsers();
      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
      toast({
        title: "User deleted successfully",
        description: `${user.full_name} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting user",
        description: `Failed to delete user: ${error}`,
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-100 text-red-800';
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.MANAGER:
        return 'bg-blue-100 text-blue-800';
      case UserRole.APPRAISER:
        return 'bg-green-100 text-green-800';
      case UserRole.CUSTOMER_SERVICE:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const UserForm = () => {
    if (!editingUser) return null;

    const availableBranches = branches.filter(branch => 
      !editingUser.bank_id || branch.bank_id === editingUser.bank_id
    );

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="role">Role & Access</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  placeholder="john.doe"
                />
              </div>
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  placeholder="john.doe@bank.com"
                />
              </div>
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={editingUser.phone_number}
                  onChange={(e) => setEditingUser({...editingUser, phone_number: e.target.value})}
                  placeholder="+91-98765-43210"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">
                {isCreateDialogOpen ? 'Password *' : 'New Password (leave blank to keep current)'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  placeholder={isCreateDialogOpen ? 'Enter secure password' : 'Enter new password or leave blank'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="role" className="space-y-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={editingUser.role} 
                onValueChange={(value: UserRole) => setEditingUser({...editingUser, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bank_id">Bank *</Label>
              <Select 
                value={editingUser.bank_id.toString()} 
                onValueChange={(value) => {
                  const bankId = parseInt(value);
                  setEditingUser({
                    ...editingUser, 
                    bank_id: bankId,
                    branch_id: undefined // Reset branch when bank changes
                  });
                  loadBranches(bankId);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id.toString()}>
                      {bank.bank_short_name} ({bank.bank_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableBranches.length > 0 && (
              <div>
                <Label htmlFor="branch_id">Branch (Optional)</Label>
                <Select 
                  value={editingUser.branch_id?.toString() || 'none'} 
                  onValueChange={(value) => setEditingUser({
                    ...editingUser, 
                    branch_id: value === 'none' ? undefined : parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific branch</SelectItem>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.branch_name} ({branch.branch_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <h4 className="font-medium">User Permissions</h4>
            <div className="space-y-3">
              {[
                { key: 'can_create_appraisal', label: 'Create Appraisals' },
                { key: 'can_view_appraisal', label: 'View Appraisals' },
                { key: 'can_edit_appraisal', label: 'Edit Appraisals' },
                { key: 'can_delete_appraisal', label: 'Delete Appraisals' },
                { key: 'can_approve_appraisal', label: 'Approve Appraisals' },
                { key: 'can_manage_customers', label: 'Manage Customers' },
                { key: 'can_view_reports', label: 'View Reports' },
                { key: 'can_manage_users', label: 'Manage Users' },
                { key: 'can_manage_branches', label: 'Manage Branches' },
                { key: 'can_manage_system_settings', label: 'Manage System Settings' }
              ].map(permission => (
                <div key={permission.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor={permission.key} className="font-medium">
                    {permission.label}
                  </Label>
                  <Switch
                    id={permission.key}
                    checked={editingUser.permissions?.[permission.key] || false}
                    onCheckedChange={(checked) => setEditingUser({
                      ...editingUser,
                      permissions: {
                        ...editingUser.permissions,
                        [permission.key]: checked
                      }
                    })}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSaveUser} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save User
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingUser(null);
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage tenant users and their permissions</p>
        </div>
        <Button onClick={handleCreateUser}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select value={roleFilter} onValueChange={(value: UserRole | 'all') => setRoleFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users ({filteredUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}`} />
                        <AvatarFallback>
                          {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">{user.full_name}</h3>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                        <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Details */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.full_name}`} />
                        <AvatarFallback>
                          {selectedUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{selectedUser.full_name}</CardTitle>
                        <p className="text-gray-600">@{selectedUser.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(selectedUser)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(selectedUser)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details">
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="permissions">Permissions</TabsTrigger>
                      <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Role
                          </h4>
                          <Badge className={getRoleColor(selectedUser.role)}>
                            {selectedUser.role.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700">Status</h4>
                          <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                            {selectedUser.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </h4>
                          <p>{selectedUser.email}</p>
                        </div>
                        {selectedUser.phone_number && (
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Phone
                            </h4>
                            <p>{selectedUser.phone_number}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Bank
                          </h4>
                          <p>{selectedUser.bank_name}</p>
                        </div>
                        {selectedUser.branch_name && (
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Branch
                            </h4>
                            <p>{selectedUser.branch_name}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="permissions" className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">User Permissions</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(selectedUser.permissions || {}).map(([permission, hasAccess]) => (
                            <div key={permission} className="flex items-center gap-2 text-sm">
                              <div className={`w-2 h-2 rounded-full ${hasAccess ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-gray-600">{permission.replace(/_/g, ' ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Recent Activity</h4>
                        <p className="text-gray-500 text-sm">No recent activity available</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No User Selected</h3>
                <p className="text-gray-600">Select a user from the list to view their details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <UserForm />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          <UserForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantUserManagement;