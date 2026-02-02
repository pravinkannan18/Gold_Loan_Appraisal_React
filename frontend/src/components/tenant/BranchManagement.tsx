/**
 * Branch Management Component
 * Comprehensive interface for viewing and managing branch details
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Bank, Branch, BranchCreate } from '../../types/tenant';
import { tenantApi } from '../../services/tenantApi';
import { toast } from '../../hooks/use-toast';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Clock,
  Save,
  X,
  Building,
  Users
} from 'lucide-react';

interface BranchManagementProps {
  selectedBankId?: number;
  selectedBranchId?: number;
  onBranchChange?: (branch: Branch | null) => void;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({
  selectedBankId,
  selectedBranchId,
  onBranchChange,
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchCreate | null>(null);

  // Load banks and branches on component mount
  useEffect(() => {
    loadBanks();
  }, []);

  useEffect(() => {
    if (selectedBankId) {
      loadBranches(selectedBankId);
      const bank = banks.find(b => b.id === selectedBankId);
      setSelectedBank(bank || null);
    }
  }, [selectedBankId, banks]);

  useEffect(() => {
    if (selectedBranchId && branches.length > 0) {
      const branch = branches.find(b => b.id === selectedBranchId);
      setSelectedBranch(branch || null);
    }
  }, [selectedBranchId, branches]);

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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    if (onBranchChange) {
      onBranchChange(branch);
    }
  };

  const handleCreateBranch = () => {
    if (!selectedBankId) {
      toast({
        title: "No bank selected",
        description: "Please select a bank first to create a branch.",
        variant: "destructive",
      });
      return;
    }

    setEditingBranch({
      bank_id: selectedBankId,
      branch_code: '',
      branch_name: '',
      branch_address: '',
      pincode: '',
      contact_email: '',
      contact_phone: '',
      branch_manager_name: '',
      branch_manager_phone: '',
      operational_hours: {
        monday: { open: '09:00', close: '17:00', is_open: true },
        tuesday: { open: '09:00', close: '17:00', is_open: true },
        wednesday: { open: '09:00', close: '17:00', is_open: true },
        thursday: { open: '09:00', close: '17:00', is_open: true },
        friday: { open: '09:00', close: '17:00', is_open: true },
        saturday: { open: '09:00', close: '14:00', is_open: true },
        sunday: { open: '10:00', close: '14:00', is_open: false }
      },
      services_offered: {
        gold_loan: true,
        appraisal_service: true,
        document_verification: true,
        customer_support: true
      }
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch({
      bank_id: branch.bank_id,
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      branch_address: branch.branch_address,
      pincode: branch.pincode,
      contact_email: branch.contact_email,
      contact_phone: branch.contact_phone,
      branch_manager_name: branch.branch_manager_name || '',
      branch_manager_phone: branch.branch_manager_phone || '',
      operational_hours: branch.operational_hours || {},
      services_offered: branch.services_offered || {}
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveBranch = async () => {
    if (!editingBranch) return;

    try {
      if (isCreateDialogOpen) {
        // Create new branch
        const response = await tenantApi.createBranch(editingBranch);
        if (response.success) {
          await loadBranches(editingBranch.bank_id);
          setIsCreateDialogOpen(false);
          toast({
            title: "Branch created successfully",
            description: `${editingBranch.branch_name} has been added.`,
          });
        }
      } else {
        // Update existing branch
        if (selectedBranch) {
          const response = await tenantApi.updateBranch(selectedBranch.id, editingBranch);
          if (response.success) {
            await loadBranches(editingBranch.bank_id);
            setIsEditDialogOpen(false);
            toast({
              title: "Branch updated successfully",
              description: `${editingBranch.branch_name} has been updated.`,
            });
          }
        }
      }
      setEditingBranch(null);
    } catch (error) {
      toast({
        title: "Error saving branch",
        description: `Failed to save branch: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!confirm(`Are you sure you want to delete ${branch.branch_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await tenantApi.deleteBranch(branch.id);
      await loadBranches(branch.bank_id);
      if (selectedBranch?.id === branch.id) {
        setSelectedBranch(null);
      }
      toast({
        title: "Branch deleted successfully",
        description: `${branch.branch_name} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting branch",
        description: `Failed to delete branch: ${error}`,
        variant: "destructive",
      });
    }
  };

  const BranchForm = () => {
    if (!editingBranch) return null;

    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekdayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch_code">Branch Code *</Label>
                <Input
                  id="branch_code"
                  value={editingBranch.branch_code}
                  onChange={(e) => setEditingBranch({...editingBranch, branch_code: e.target.value})}
                  placeholder="e.g., SBI001, HDFC002"
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={editingBranch.pincode}
                  onChange={(e) => setEditingBranch({...editingBranch, pincode: e.target.value})}
                  placeholder="e.g., 600001"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="branch_name">Branch Name *</Label>
              <Input
                id="branch_name"
                value={editingBranch.branch_name}
                onChange={(e) => setEditingBranch({...editingBranch, branch_name: e.target.value})}
                placeholder="e.g., Anna Nagar Branch, Connaught Place Branch"
              />
            </div>

            <div>
              <Label htmlFor="branch_address">Branch Address *</Label>
              <Textarea
                id="branch_address"
                value={editingBranch.branch_address}
                onChange={(e) => setEditingBranch({...editingBranch, branch_address: e.target.value})}
                placeholder="Complete branch address with landmark"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Branch Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={editingBranch.contact_email}
                  onChange={(e) => setEditingBranch({...editingBranch, contact_email: e.target.value})}
                  placeholder="branch@bank.com"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Branch Phone *</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={editingBranch.contact_phone}
                  onChange={(e) => setEditingBranch({...editingBranch, contact_phone: e.target.value})}
                  placeholder="+91-44-2628-5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch_manager_name">Branch Manager</Label>
                <Input
                  id="branch_manager_name"
                  value={editingBranch.branch_manager_name}
                  onChange={(e) => setEditingBranch({...editingBranch, branch_manager_name: e.target.value})}
                  placeholder="Manager's full name"
                />
              </div>
              <div>
                <Label htmlFor="branch_manager_phone">Manager Phone</Label>
                <Input
                  id="branch_manager_phone"
                  type="tel"
                  value={editingBranch.branch_manager_phone}
                  onChange={(e) => setEditingBranch({...editingBranch, branch_manager_phone: e.target.value})}
                  placeholder="+91-98765-43210"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <h4 className="font-medium">Operational Hours</h4>
            <div className="space-y-3">
              {weekdays.map((day, index) => (
                <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-20">
                    <span className="font-medium">{weekdayLabels[index]}</span>
                  </div>
                  <Switch
                    checked={editingBranch.operational_hours?.[day]?.is_open || false}
                    onCheckedChange={(checked) => setEditingBranch({
                      ...editingBranch,
                      operational_hours: {
                        ...editingBranch.operational_hours,
                        [day]: {
                          ...editingBranch.operational_hours?.[day],
                          is_open: checked
                        }
                      }
                    })}
                  />
                  {editingBranch.operational_hours?.[day]?.is_open && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={editingBranch.operational_hours[day]?.open || '09:00'}
                        onChange={(e) => setEditingBranch({
                          ...editingBranch,
                          operational_hours: {
                            ...editingBranch.operational_hours,
                            [day]: {
                              ...editingBranch.operational_hours[day],
                              open: e.target.value
                            }
                          }
                        })}
                        className="w-24"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={editingBranch.operational_hours[day]?.close || '17:00'}
                        onChange={(e) => setEditingBranch({
                          ...editingBranch,
                          operational_hours: {
                            ...editingBranch.operational_hours,
                            [day]: {
                              ...editingBranch.operational_hours[day],
                              close: e.target.value
                            }
                          }
                        })}
                        className="w-24"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <h4 className="font-medium">Services Offered</h4>
            <div className="space-y-3">
              {[
                { key: 'gold_loan', label: 'Gold Loan Services' },
                { key: 'appraisal_service', label: 'Gold Appraisal Service' },
                { key: 'document_verification', label: 'Document Verification' },
                { key: 'customer_support', label: 'Customer Support' }
              ].map(service => (
                <div key={service.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor={service.key} className="font-medium">{service.label}</Label>
                  <Switch
                    id={service.key}
                    checked={editingBranch.services_offered?.[service.key] || false}
                    onCheckedChange={(checked) => setEditingBranch({
                      ...editingBranch,
                      services_offered: {
                        ...editingBranch.services_offered,
                        [service.key]: checked
                      }
                    })}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSaveBranch} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Branch
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingBranch(null);
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
          <h2 className="text-2xl font-bold">Branch Management</h2>
          <p className="text-gray-600">
            {selectedBank 
              ? `Managing branches for ${selectedBank.bank_short_name}`
              : 'Select a bank to manage its branches'
            }
          </p>
        </div>
        {selectedBankId && (
          <Button onClick={handleCreateBranch}>
            <Plus className="w-4 h-4 mr-2" />
            Add Branch
          </Button>
        )}
      </div>

      {/* Bank Selection */}
      {!selectedBankId && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Building className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Select a Bank</h3>
              <p className="text-gray-600 mb-4">Choose a bank to view and manage its branches</p>
              <Select onValueChange={(value) => {
                const bankId = parseInt(value);
                const bank = banks.find(b => b.id === bankId);
                setSelectedBank(bank || null);
                loadBranches(bankId);
              }}>
                <SelectTrigger className="w-64 mx-auto">
                  <SelectValue placeholder="Select Bank" />
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
          </CardContent>
        </Card>
      )}

      {selectedBankId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branches List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Branches ({branches.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedBranch?.id === branch.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleBranchSelect(branch)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium">{branch.branch_name}</h3>
                          <p className="text-sm text-gray-600">{branch.branch_code}</p>
                          <p className="text-xs text-gray-500">{branch.pincode}</p>
                        </div>
                        <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Branch Details */}
          <div className="lg:col-span-2">
            {selectedBranch ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-6 h-6" />
                          {selectedBranch.branch_name}
                        </CardTitle>
                        <p className="text-gray-600">{selectedBranch.branch_code}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditBranch(selectedBranch)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBranch(selectedBranch)}
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
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="hours">Hours</TabsTrigger>
                        <TabsTrigger value="services">Services</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-700">Branch Code</h4>
                            <p>{selectedBranch.branch_code}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700">Pincode</h4>
                            <p>{selectedBranch.pincode}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Address
                          </h4>
                          <p className="text-gray-600">{selectedBranch.branch_address}</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="contact" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email
                            </h4>
                            <p>{selectedBranch.contact_email}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Phone
                            </h4>
                            <p>{selectedBranch.contact_phone}</p>
                          </div>
                          {selectedBranch.branch_manager_name && (
                            <div>
                              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Branch Manager
                              </h4>
                              <p>{selectedBranch.branch_manager_name}</p>
                              {selectedBranch.branch_manager_phone && (
                                <p className="text-sm text-gray-600">{selectedBranch.branch_manager_phone}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="hours" className="space-y-4 mt-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Operational Hours
                          </h4>
                          <div className="space-y-2">
                            {Object.entries(selectedBranch.operational_hours || {}).map(([day, hours]) => (
                              <div key={day} className="flex justify-between text-sm">
                                <span className="capitalize font-medium">{day}</span>
                                <span className={hours.is_open ? 'text-green-600' : 'text-red-500'}>
                                  {hours.is_open ? `${hours.open} - ${hours.close}` : 'Closed'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="services" className="space-y-4 mt-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Services Offered</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(selectedBranch.services_offered || {}).map(([service, available]) => (
                              <div key={service} className="flex items-center gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full ${available ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-gray-600">{service.replace(/_/g, ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No Branch Selected</h3>
                  <p className="text-gray-600">Select a branch from the list to view its details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Create Branch Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
          </DialogHeader>
          <BranchForm />
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Branch Details</DialogTitle>
          </DialogHeader>
          <BranchForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchManagement;