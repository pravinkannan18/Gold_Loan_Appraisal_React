/**
 * Bank Management Component
 * Comprehensive interface for viewing and managing bank details
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Bank, BankCreate } from '../../types/tenant';
import { tenantApi } from '../../services/tenantApi';
import { toast } from '../../hooks/use-toast';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  Settings,
  Save,
  X
} from 'lucide-react';

interface BankManagementProps {
  selectedBankId?: number;
  onBankChange?: (bank: Bank | null) => void;
}

export const BankManagement: React.FC<BankManagementProps> = ({
  selectedBankId,
  onBankChange,
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankCreate | null>(null);

  // Load banks on component mount
  useEffect(() => {
    loadBanks();
  }, []);

  // Select bank when selectedBankId changes
  useEffect(() => {
    if (selectedBankId && banks.length > 0) {
      const bank = banks.find(b => b.id === selectedBankId);
      setSelectedBank(bank || null);
    }
  }, [selectedBankId, banks]);

  const loadBanks = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    if (onBankChange) {
      onBankChange(bank);
    }
  };

  const handleCreateBank = () => {
    setEditingBank({
      bank_code: '',
      bank_name: '',
      bank_short_name: '',
      headquarters_address: '',
      contact_email: '',
      contact_phone: '',
      rbi_license_number: '',
      system_configuration: {
        max_loan_amount: 10000000,
        min_loan_amount: 5000,
        interest_rate_range: { min: 8.5, max: 15.0 },
        loan_to_value_ratio: 0.75
      },
      tenant_settings: {
        allow_online_appraisal: true,
        require_customer_photo: true,
        gps_verification_required: true,
        facial_recognition_enabled: true
      }
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditBank = (bank: Bank) => {
    setEditingBank({
      bank_code: bank.bank_code,
      bank_name: bank.bank_name,
      bank_short_name: bank.bank_short_name,
      headquarters_address: bank.headquarters_address,
      contact_email: bank.contact_email,
      contact_phone: bank.contact_phone,
      rbi_license_number: bank.rbi_license_number,
      system_configuration: bank.system_configuration || {},
      tenant_settings: bank.tenant_settings || {}
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveBank = async () => {
    if (!editingBank) return;

    try {
      if (isCreateDialogOpen) {
        // Create new bank
        const response = await tenantApi.createBank(editingBank);
        if (response.success) {
          await loadBanks();
          setIsCreateDialogOpen(false);
          toast({
            title: "Bank created successfully",
            description: `${editingBank.bank_short_name} has been added.`,
          });
        }
      } else {
        // Update existing bank
        if (selectedBank) {
          const response = await tenantApi.updateBank(selectedBank.id, editingBank);
          if (response.success) {
            await loadBanks();
            setIsEditDialogOpen(false);
            toast({
              title: "Bank updated successfully",
              description: `${editingBank.bank_short_name} has been updated.`,
            });
          }
        }
      }
      setEditingBank(null);
    } catch (error) {
      toast({
        title: "Error saving bank",
        description: `Failed to save bank: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBank = async (bank: Bank) => {
    if (!confirm(`Are you sure you want to delete ${bank.bank_short_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await tenantApi.deleteBank(bank.id);
      await loadBanks();
      if (selectedBank?.id === bank.id) {
        setSelectedBank(null);
      }
      toast({
        title: "Bank deleted successfully",
        description: `${bank.bank_short_name} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting bank",
        description: `Failed to delete bank: ${error}`,
        variant: "destructive",
      });
    }
  };

  const BankForm = () => {
    if (!editingBank) return null;

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank_code">Bank Code *</Label>
                <Input
                  id="bank_code"
                  value={editingBank.bank_code}
                  onChange={(e) => setEditingBank({...editingBank, bank_code: e.target.value})}
                  placeholder="e.g., SBI, HDFC, ICICI"
                />
              </div>
              <div>
                <Label htmlFor="bank_short_name">Short Name *</Label>
                <Input
                  id="bank_short_name"
                  value={editingBank.bank_short_name}
                  onChange={(e) => setEditingBank({...editingBank, bank_short_name: e.target.value})}
                  placeholder="e.g., SBI, HDFC Bank"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bank_name">Full Bank Name *</Label>
              <Input
                id="bank_name"
                value={editingBank.bank_name}
                onChange={(e) => setEditingBank({...editingBank, bank_name: e.target.value})}
                placeholder="e.g., State Bank of India"
              />
            </div>

            <div>
              <Label htmlFor="rbi_license_number">RBI License Number *</Label>
              <Input
                id="rbi_license_number"
                value={editingBank.rbi_license_number}
                onChange={(e) => setEditingBank({...editingBank, rbi_license_number: e.target.value})}
                placeholder="e.g., RBI-SBI-001"
              />
            </div>

            <div>
              <Label htmlFor="headquarters_address">Headquarters Address *</Label>
              <Textarea
                id="headquarters_address"
                value={editingBank.headquarters_address}
                onChange={(e) => setEditingBank({...editingBank, headquarters_address: e.target.value})}
                placeholder="Complete headquarters address"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <div>
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={editingBank.contact_email}
                onChange={(e) => setEditingBank({...editingBank, contact_email: e.target.value})}
                placeholder="goldloans@bank.com"
              />
            </div>

            <div>
              <Label htmlFor="contact_phone">Contact Phone *</Label>
              <Input
                id="contact_phone"
                type="tel"
                value={editingBank.contact_phone}
                onChange={(e) => setEditingBank({...editingBank, contact_phone: e.target.value})}
                placeholder="+91-22-2285-5000"
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Loan Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_loan_amount">Max Loan Amount (₹)</Label>
                  <Input
                    id="max_loan_amount"
                    type="number"
                    value={editingBank.system_configuration?.max_loan_amount || ''}
                    onChange={(e) => setEditingBank({
                      ...editingBank,
                      system_configuration: {
                        ...editingBank.system_configuration,
                        max_loan_amount: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="min_loan_amount">Min Loan Amount (₹)</Label>
                  <Input
                    id="min_loan_amount"
                    type="number"
                    value={editingBank.system_configuration?.min_loan_amount || ''}
                    onChange={(e) => setEditingBank({
                      ...editingBank,
                      system_configuration: {
                        ...editingBank.system_configuration,
                        min_loan_amount: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="loan_to_value_ratio">Loan to Value Ratio</Label>
                <Input
                  id="loan_to_value_ratio"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={editingBank.system_configuration?.loan_to_value_ratio || ''}
                  onChange={(e) => setEditingBank({
                    ...editingBank,
                    system_configuration: {
                      ...editingBank.system_configuration,
                      loan_to_value_ratio: parseFloat(e.target.value) || 0
                    }
                  })}
                />
              </div>

              <h4 className="font-medium mt-6">Tenant Settings</h4>
              <div className="space-y-3">
                {[
                  { key: 'allow_online_appraisal', label: 'Allow Online Appraisal' },
                  { key: 'require_customer_photo', label: 'Require Customer Photo' },
                  { key: 'gps_verification_required', label: 'GPS Verification Required' },
                  { key: 'facial_recognition_enabled', label: 'Facial Recognition Enabled' }
                ].map(setting => (
                  <div key={setting.key} className="flex items-center justify-between">
                    <Label htmlFor={setting.key}>{setting.label}</Label>
                    <Switch
                      id={setting.key}
                      checked={editingBank.tenant_settings?.[setting.key] || false}
                      onCheckedChange={(checked) => setEditingBank({
                        ...editingBank,
                        tenant_settings: {
                          ...editingBank.tenant_settings,
                          [setting.key]: checked
                        }
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSaveBank} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Bank
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setEditingBank(null);
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
          <h2 className="text-2xl font-bold">Bank Management</h2>
          <p className="text-gray-600">Manage bank information and configurations</p>
        </div>
        <Button onClick={handleCreateBank}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bank
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banks List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Banks ({banks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {banks.map((bank) => (
                  <div
                    key={bank.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedBank?.id === bank.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => handleBankSelect(bank)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{bank.bank_short_name}</h3>
                        <p className="text-sm text-gray-600">{bank.bank_code}</p>
                        <p className="text-xs text-gray-500 truncate">{bank.bank_name}</p>
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
        </div>

        {/* Bank Details */}
        <div className="lg:col-span-2">
          {selectedBank ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-6 h-6" />
                        {selectedBank.bank_short_name}
                      </CardTitle>
                      <p className="text-gray-600">{selectedBank.bank_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBank(selectedBank)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteBank(selectedBank)}
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
                      <TabsTrigger value="config">Configuration</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700">Bank Code</h4>
                          <p>{selectedBank.bank_code}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700">RBI License</h4>
                          <p>{selectedBank.rbi_license_number}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Headquarters Address
                        </h4>
                        <p className="text-gray-600">{selectedBank.headquarters_address}</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </h4>
                          <p>{selectedBank.contact_email}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone
                          </h4>
                          <p>{selectedBank.contact_phone}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="config" className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Loan Configuration</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Max Loan Amount:</span>
                            <p className="font-medium">₹{selectedBank.system_configuration?.max_loan_amount?.toLocaleString() || 'Not set'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Min Loan Amount:</span>
                            <p className="font-medium">₹{selectedBank.system_configuration?.min_loan_amount?.toLocaleString() || 'Not set'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">LTV Ratio:</span>
                            <p className="font-medium">{(selectedBank.system_configuration?.loan_to_value_ratio || 0) * 100}%</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Settings</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(selectedBank.tenant_settings || {}).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-gray-600">{key.replace(/_/g, ' ')}</span>
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
                <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No Bank Selected</h3>
                <p className="text-gray-600">Select a bank from the list to view its details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Bank Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Bank</DialogTitle>
          </DialogHeader>
          <BankForm />
        </DialogContent>
      </Dialog>

      {/* Edit Bank Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bank Details</DialogTitle>
          </DialogHeader>
          <BankForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankManagement;