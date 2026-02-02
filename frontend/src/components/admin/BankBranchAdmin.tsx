import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  AlertCircle,
  X,
  Save,
  GitBranch,
  Camera,
  UserPlus,
  RefreshCw,
  CheckCircle,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Bank {
  id: number;
  bank_name: string;
  bank_code: string;
  bank_short_name: string;
  headquarters_address?: string;
  contact_email?: string;
  contact_phone?: string;
  rbi_license_number?: string;
  is_active: boolean;
  created_at: string;
}

interface Branch {
  id: number;
  branch_name: string;
  branch_code: string;
  branch_address?: string;
  branch_city?: string;
  branch_state?: string;
  branch_pincode?: string;
  contact_phone?: string;
  contact_email?: string;
  manager_name?: string;
  operational_hours?: Record<string, any>;
  is_active: boolean;
  bank_id: number;
  bank_name?: string;
  created_at: string;
}

interface BankBranchAdminProps {
  adminRole?: string;
  adminBankId?: number;
  adminBankName?: string;
  adminBranchId?: number;
  adminBranchName?: string;
}

interface BranchFormData {
  branch_name: string;
  branch_code: string;
  branch_address: string;
  branch_city: string;
  branch_state: string;
  branch_pincode: string;
  contact_phone: string;
  contact_email: string;
  manager_name: string;
}

interface AppraiserFormData {
  full_name: string;
  email: string;
  phone: string;
}

interface BranchAdmin {
  id: number;
  user_id: string;
  branch_id: number;
  bank_id: number;
  email: string;
  phone?: string;
  full_name: string;
  is_active: boolean;
  created_at?: string;
  branch_name?: string;
  bank_name?: string;
}

interface BranchAdminFormData {
  branch_id: string;
  email: string;
  password: string;
  full_name: string;
  phone: string;
}

const initialBranchForm: BranchFormData = {
  branch_name: '',
  branch_code: '',
  branch_address: '',
  branch_city: '',
  branch_state: '',
  branch_pincode: '',
  contact_phone: '',
  contact_email: '',
  manager_name: ''
};

const initialAppraiserForm: AppraiserFormData = {
  full_name: '',
  email: '',
  phone: ''
};

const initialBranchAdminForm: BranchAdminFormData = {
  branch_id: '',
  email: '',
  password: '',
  full_name: '',
  phone: ''
};

export const BankBranchAdmin: React.FC<BankBranchAdminProps> = ({
  adminRole,
  adminBankId,
  adminBankName,
  adminBranchId,
  adminBranchName
}) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState<BranchFormData>(initialBranchForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Appraiser Registration states (for Branch Admin)
  const [showAppraiserModal, setShowAppraiserModal] = useState(false);
  const [appraiserForm, setAppraiserForm] = useState<AppraiserFormData>(initialAppraiserForm);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  
  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Branch Admin Management states (for Bank Admin)
  const [branchAdmins, setBranchAdmins] = useState<BranchAdmin[]>([]);
  const [showBranchAdminModal, setShowBranchAdminModal] = useState(false);
  const [branchAdminForm, setBranchAdminForm] = useState<BranchAdminFormData>(initialBranchAdminForm);
  const [savingBranchAdmin, setSavingBranchAdmin] = useState(false);
  const [deletingBranchAdminId, setDeletingBranchAdminId] = useState<number | null>(null);
  const [showBranchAdminPassword, setShowBranchAdminPassword] = useState(false);

  // Check if user is a bank admin (restricted access)
  const isBankAdmin = adminRole === 'bank_admin';
  const isBranchAdmin = adminRole === 'branch_admin';

  // Fetch banks and branches on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter branches based on admin role and search
  useEffect(() => {
    let filtered = branches;
    
    // Bank Admin: Only show branches for their bank
    if (isBankAdmin && adminBankId) {
      filtered = filtered.filter(branch => branch.bank_id === adminBankId);
    }
    
    // Branch Admin: Only show their specific branch
    if (isBranchAdmin && adminBranchId) {
      filtered = filtered.filter(branch => branch.id === adminBranchId);
    }
    
    // Apply manual bank filter (only for non-restricted users)
    if (!isBankAdmin && !isBranchAdmin && selectedBankId) {
      filtered = filtered.filter(branch => branch.bank_id === selectedBankId);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(branch => 
        branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branch_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branch_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branch_state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        branch.branch_pincode?.includes(searchTerm)
      );
    }
    
    setFilteredBranches(filtered);
  }, [branches, selectedBankId, searchTerm, isBankAdmin, isBranchAdmin, adminBankId, adminBranchId]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [
        fetch(`${API_BASE_URL}/api/bank`),
        fetch(`${API_BASE_URL}/api/branch`)
      ];
      
      // For bank admin, also fetch branch admins
      if (isBankAdmin && adminBankId) {
        promises.push(fetch(`${API_BASE_URL}/api/admin/branch-admins/${adminBankId}`));
      }
      
      const responses = await Promise.all(promises);
      
      if (!responses[0].ok || !responses[1].ok) {
        throw new Error('Failed to fetch data from server');
      }
      
      const banksData = await responses[0].json();
      const branchesData = await responses[1].json();
      
      // For bank admin, filter banks to only show their bank
      if (isBankAdmin && adminBankId) {
        setBanks(Array.isArray(banksData) ? banksData.filter((b: Bank) => b.id === adminBankId) : []);
        
        // Fetch branch admins
        if (responses[2] && responses[2].ok) {
          const branchAdminsData = await responses[2].json();
          setBranchAdmins(Array.isArray(branchAdminsData) ? branchAdminsData : []);
        }
      } else {
        setBanks(Array.isArray(banksData) ? banksData : []);
      }
      
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelect = (bankId: number | null) => {
    if (!isBankAdmin && !isBranchAdmin) {
      setSelectedBankId(bankId);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // =========================================================================
  // Branch CRUD Operations (Bank Admin)
  // =========================================================================
  
  const openAddBranchModal = () => {
    setBranchForm(initialBranchForm);
    setEditingBranch(null);
    setShowBranchModal(true);
  };

  const openEditBranchModal = (branch: Branch) => {
    setBranchForm({
      branch_name: branch.branch_name,
      branch_code: branch.branch_code,
      branch_address: branch.branch_address || '',
      branch_city: branch.branch_city || '',
      branch_state: branch.branch_state || '',
      branch_pincode: branch.branch_pincode || '',
      contact_phone: branch.contact_phone || '',
      contact_email: branch.contact_email || '',
      manager_name: branch.manager_name || ''
    });
    setEditingBranch(branch);
    setShowBranchModal(true);
  };

  const closeBranchModal = () => {
    setShowBranchModal(false);
    setEditingBranch(null);
    setBranchForm(initialBranchForm);
  };

  const handleBranchFormChange = (field: keyof BranchFormData, value: string) => {
    setBranchForm(prev => ({ ...prev, [field]: value }));
  };

  const saveBranch = async () => {
    if (!branchForm.branch_name || !branchForm.branch_code) {
      alert('Branch name and code are required');
      return;
    }

    if (!branchForm.contact_email || !branchForm.contact_phone) {
      alert('Contact email and phone are required for branch admin login');
      return;
    }

    setSaving(true);
    try {
      const url = editingBranch 
        ? `${API_BASE_URL}/api/branch/${editingBranch.id}`
        : `${API_BASE_URL}/api/branch`;
      
      const method = editingBranch ? 'PUT' : 'POST';
      
      // For bank admin, use their bank_id
      const bankId = isBankAdmin ? adminBankId : (editingBranch?.bank_id || adminBankId);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...branchForm,
          bank_id: bankId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to ${editingBranch ? 'update' : 'create'} branch`);
      }
      
      await fetchData();
      closeBranchModal();
    } catch (error) {
      console.error('Error saving branch:', error);
      alert(error instanceof Error ? error.message : 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const deleteBranch = async (branchId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/branch/${branchId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete branch');
      }
      
      await fetchData();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete branch');
    }
  };

  // =========================================================================
  // Appraiser Registration (Branch Admin)
  // =========================================================================

  const openAppraiserModal = () => {
    setAppraiserForm(initialAppraiserForm);
    setCapturedPhoto(null);
    setRegistrationSuccess(false);
    setRegistrationMessage('');
    setShowAppraiserModal(true);
  };

  const closeAppraiserModal = () => {
    stopCamera();
    setShowAppraiserModal(false);
    setAppraiserForm(initialAppraiserForm);
    setCapturedPhoto(null);
    setRegistrationSuccess(false);
    setRegistrationMessage('');
  };

  const handleAppraiserFormChange = (field: keyof AppraiserFormData, value: string) => {
    setAppraiserForm(prev => ({ ...prev, [field]: value }));
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  const generateAppraiserId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    return `APP-${timestamp}-${randomStr}`.toUpperCase();
  };

  const registerAppraiser = async () => {
    // Validation
    if (!appraiserForm.full_name.trim()) {
      alert('Full name is required');
      return;
    }
    if (!appraiserForm.email.trim()) {
      alert('Email is required');
      return;
    }
    if (!appraiserForm.phone.trim()) {
      alert('Phone number is required');
      return;
    }
    if (!capturedPhoto) {
      alert('Please capture a face photo');
      return;
    }

    setSaving(true);
    setRegistrationSuccess(false);
    setRegistrationMessage('');

    try {
      const appraiserId = generateAppraiserId();
      const timestamp = new Date().toISOString();

      const payload = {
        name: appraiserForm.full_name.trim(),
        id: appraiserId,
        image: capturedPhoto,
        timestamp: timestamp,
        bank: adminBankName || '',
        branch: adminBranchName || '',
        email: appraiserForm.email.trim(),
        phone: appraiserForm.phone.trim()
      };

      const response = await fetch(`${API_BASE_URL}/api/appraiser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to register appraiser');
      }

      const result = await response.json();
      
      setRegistrationSuccess(true);
      setRegistrationMessage(`Appraiser registered successfully! ID: ${appraiserId}`);
      
      // Reset form after successful registration
      setTimeout(() => {
        setAppraiserForm(initialAppraiserForm);
        setCapturedPhoto(null);
        setRegistrationSuccess(false);
        setRegistrationMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error registering appraiser:', error);
      setRegistrationMessage(error instanceof Error ? error.message : 'Failed to register appraiser');
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // Get Bank Name helper
  // =========================================================================
  
  const getBankName = (bankId: number): string => {
    const bank = banks.find(b => b.id === bankId);
    return bank?.bank_name || 'Unknown Bank';
  };

  // =========================================================================
  // Branch Admin Management Functions (for Bank Admin)
  // =========================================================================

  const openAddBranchAdminModal = () => {
    setBranchAdminForm(initialBranchAdminForm);
    setShowBranchAdminModal(true);
    setShowBranchAdminPassword(false);
  };

  const closeBranchAdminModal = () => {
    setShowBranchAdminModal(false);
    setBranchAdminForm(initialBranchAdminForm);
    setShowBranchAdminPassword(false);
  };

  const handleBranchAdminFormChange = (field: keyof BranchAdminFormData, value: string) => {
    setBranchAdminForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBranchAdmin = async () => {
    if (!branchAdminForm.branch_id || !branchAdminForm.email || !branchAdminForm.password || !branchAdminForm.full_name) {
      setError('Please fill in all required fields');
      return;
    }

    setSavingBranchAdmin(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/branch-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: parseInt(branchAdminForm.branch_id),
          email: branchAdminForm.email,
          password: branchAdminForm.password,
          full_name: branchAdminForm.full_name,
          phone: branchAdminForm.phone || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create branch admin');
      }

      await fetchData();
      closeBranchAdminModal();
      setError(null);
    } catch (err) {
      console.error('Error creating branch admin:', err);
      setError(err instanceof Error ? err.message : 'Failed to create branch admin');
    } finally {
      setSavingBranchAdmin(false);
    }
  };

  const handleDeleteBranchAdmin = async (adminId: number) => {
    if (!confirm('Are you sure you want to delete this branch admin? This action cannot be undone.')) {
      return;
    }

    setDeletingBranchAdminId(adminId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/branch-admin/${adminId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete branch admin');
      }

      await fetchData();
      setError(null);
    } catch (err) {
      console.error('Error deleting branch admin:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete branch admin');
    } finally {
      setDeletingBranchAdminId(null);
    }
  };

  // =========================================================================
  // Render
  // =========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Data</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {isBankAdmin ? `${adminBankName} - Branch Management` : 
             isBranchAdmin ? `${adminBranchName} - Appraiser Management` :
             'Bank & Branch Administration'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isBankAdmin ? 'Manage branches for your bank' :
             isBranchAdmin ? 'Register and manage appraisers for your branch' :
             'Manage banks and branches across the system'}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {isBankAdmin && (
            <Button onClick={openAddBranchModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Branch
            </Button>
          )}
          {isBranchAdmin && (
              <Button onClick={openAppraiserModal} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="h-4 w-4" />
              Register Appraiser
            </Button>
          )}
        </div>
      </div>

      {/* Role Badge */}
      <div className="flex gap-2">
        {isBankAdmin && (
          <Badge className="bg-blue-100 text-blue-800 gap-1">
            <Building2 className="h-3 w-3" />
            Bank Admin: {adminBankName}
          </Badge>
        )}
        {isBranchAdmin && (
          <>
            <Badge className="bg-green-100 text-green-800 gap-1">
              <GitBranch className="h-3 w-3" />
              Branch Admin: {adminBranchName}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 gap-1">
              <Building2 className="h-3 w-3" />
              Bank: {adminBankName}
            </Badge>
          </>
        )}
      </div>

      {/* Search and Filter (only for Bank Admin) */}
      {isBankAdmin && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue={isBranchAdmin ? "appraisers" : "branches"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="branches" className="gap-2">
            <GitBranch className="h-4 w-4" />
            {isBranchAdmin ? 'Branch Info' : 'Branches'}
          </TabsTrigger>
          {isBankAdmin && (
            <TabsTrigger value="branch-admins" className="gap-2">
              <Users className="h-4 w-4" />
              Branch Admins
            </TabsTrigger>
          )}
          {isBranchAdmin && (
            <TabsTrigger value="appraisers" className="gap-2">
              <User className="h-4 w-4" />
              Appraiser Registration
            </TabsTrigger>
          )}
        </TabsList>

        {/* Branches Tab */}
        {/* Appraiser Registration Tab (Branch Admin Only) */}
        {isBranchAdmin && (
          <TabsContent value="appraisers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Register New Appraiser
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Form Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={appraiserForm.full_name}
                        onChange={(e) => handleAppraiserFormChange('full_name', e.target.value)}
                        placeholder="Enter appraiser's full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bank_name_display">Bank Name</Label>
                      <Input
                        id="bank_name_display"
                        value={adminBankName || ''}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch_name_display">Branch Name</Label>
                      <Input
                        id="branch_name_display"
                        value={adminBranchName || ''}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email ID *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={appraiserForm.email}
                        onChange={(e) => handleAppraiserFormChange('email', e.target.value)}
                        placeholder="appraiser@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={appraiserForm.phone}
                        onChange={(e) => handleAppraiserFormChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  {/* Camera Section */}
                  <div className="space-y-4">
                    <Label>Face Photo *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {!capturedPhoto ? (
                        <div className="space-y-4">
                          {isCameraActive ? (
                            <>
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full rounded-lg bg-black"
                              />
                              <Button 
                                onClick={capturePhoto} 
                                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                              >
                                <Camera className="h-4 w-4" />
                                Capture Photo
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Camera className="h-16 w-16 text-gray-400 mb-4" />
                              <p className="text-gray-600 mb-4">Click to start camera</p>
                              <Button onClick={startCamera} className="gap-2">
                                <Camera className="h-4 w-4" />
                                Start Camera
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <img
                            src={capturedPhoto}
                            alt="Captured face"
                            className="w-full rounded-lg"
                          />
                          <Button 
                            onClick={retakePhoto} 
                            variant="outline" 
                            className="w-full gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Retake Photo
                          </Button>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                  </div>
                </div>

                {/* Success/Error Message */}
                {registrationMessage && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    registrationSuccess 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {registrationSuccess ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                      {registrationMessage}
                    </div>
                  </div>
                )}

                {/* Register Button */}
                <div className="mt-6 flex justify-end">
                  <Button 
                    onClick={registerAppraiser} 
                    disabled={saving}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Register Appraiser
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Branches Tab */}
        <TabsContent value="branches" className="space-y-4">
          {filteredBranches.length === 0 ? (
            <Card className="p-8 text-center">
              <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No Branches Found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm ? 'Try adjusting your search' : 'No branches available'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBranches.map((branch) => (
                <Card key={branch.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          {branch.branch_name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {branch.branch_code}
                        </Badge>
                      </div>
                      <Badge className={branch.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!isBranchAdmin && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{getBankName(branch.bank_id)}</span>
                      </div>
                    )}
                    {branch.branch_address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span>
                          {branch.branch_address}
                          {branch.branch_city && `, ${branch.branch_city}`}
                          {branch.branch_state && `, ${branch.branch_state}`}
                          {branch.branch_pincode && ` - ${branch.branch_pincode}`}
                        </span>
                      </div>
                    )}
                    {branch.manager_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{branch.manager_name}</span>
                      </div>
                    )}
                    {branch.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{branch.contact_phone}</span>
                      </div>
                    )}
                    {branch.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{branch.contact_email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Created: {formatDate(branch.created_at)}</span>
                    </div>
                    
                    {/* Action Buttons - Only for Bank Admin */}
                    {isBankAdmin && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEditBranchModal(branch)}
                          className="flex-1 gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        {deleteConfirm === branch.id ? (
                          <div className="flex gap-1">
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => deleteBranch(branch.id)}
                            >
                              Confirm
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setDeleteConfirm(branch.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Branch Admins Tab (Bank Admin Only) */}
        {isBankAdmin && (
          <TabsContent value="branch-admins" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Branch Administrators
                  </CardTitle>
                  <Button onClick={openAddBranchAdminModal} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Branch Admin
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {branchAdmins.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Branch Admins</h3>
                    <p className="text-gray-600 mb-4">Get started by creating your first branch administrator.</p>
                    <Button onClick={openAddBranchAdminModal} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Branch Admin
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {branchAdmins.map((admin) => (
                      <Card key={admin.id} className="relative">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">{admin.full_name}</h3>
                              <Badge variant={admin.is_active ? "default" : "secondary"}>
                                {admin.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span>{admin.email}</span>
                              </div>
                              {admin.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  <span>{admin.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-3 w-3" />
                                <span>{admin.branch_name || 'Unknown Branch'}</span>
                              </div>
                              {admin.created_at && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>Created: {formatDate(admin.created_at)}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-end pt-2">
                              <Button
                                onClick={() => handleDeleteBranchAdmin(admin.id)}
                                variant="destructive"
                                size="sm"
                                disabled={deletingBranchAdminId === admin.id}
                                className="gap-1"
                              >
                                {deletingBranchAdminId === admin.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Branch Add/Edit Modal (Bank Admin) */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeBranchModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch_name">Branch Name *</Label>
                  <Input
                    id="branch_name"
                    value={branchForm.branch_name}
                    onChange={(e) => handleBranchFormChange('branch_name', e.target.value)}
                    placeholder="Enter branch name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch_code">Branch Code *</Label>
                  <Input
                    id="branch_code"
                    value={branchForm.branch_code}
                    onChange={(e) => handleBranchFormChange('branch_code', e.target.value)}
                    placeholder="e.g., BR001"
                    disabled={!!editingBranch}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="branch_address">Address</Label>
                  <Input
                    id="branch_address"
                    value={branchForm.branch_address}
                    onChange={(e) => handleBranchFormChange('branch_address', e.target.value)}
                    placeholder="Enter full address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch_city">City</Label>
                  <Input
                    id="branch_city"
                    value={branchForm.branch_city}
                    onChange={(e) => handleBranchFormChange('branch_city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch_state">State</Label>
                  <Input
                    id="branch_state"
                    value={branchForm.branch_state}
                    onChange={(e) => handleBranchFormChange('branch_state', e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch_pincode">Pincode</Label>
                  <Input
                    id="branch_pincode"
                    value={branchForm.branch_pincode}
                    onChange={(e) => handleBranchFormChange('branch_pincode', e.target.value)}
                    placeholder="6-digit pincode"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager_name">Manager Name</Label>
                  <Input
                    id="manager_name"
                    value={branchForm.manager_name}
                    onChange={(e) => handleBranchFormChange('manager_name', e.target.value)}
                    placeholder="Branch manager name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={branchForm.contact_email}
                    onChange={(e) => handleBranchFormChange('contact_email', e.target.value)}
                    placeholder="branch@bank.com"
                  />
                  <p className="text-xs text-blue-600">This email will be used for Branch Admin login</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone *</Label>
                  <Input
                    id="contact_phone"
                    value={branchForm.contact_phone}
                    onChange={(e) => handleBranchFormChange('contact_phone', e.target.value)}
                    placeholder="Phone number"
                  />
                  <p className="text-xs text-blue-600">This phone will be used as Branch Admin password</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={closeBranchModal}>
                  Cancel
                </Button>
                <Button onClick={saveBranch} disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingBranch ? 'Update Branch' : 'Create Branch'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appraiser Registration Modal (Alternative - if opened from button) */}
      {showAppraiserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Register New Appraiser
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={closeAppraiserModal}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="modal_full_name">Full Name *</Label>
                    <Input
                      id="modal_full_name"
                      value={appraiserForm.full_name}
                      onChange={(e) => handleAppraiserFormChange('full_name', e.target.value)}
                      placeholder="Enter appraiser's full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modal_bank_name">Bank Name</Label>
                    <Input
                      id="modal_bank_name"
                      value={adminBankName || ''}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modal_branch_name">Branch Name</Label>
                    <Input
                      id="modal_branch_name"
                      value={adminBranchName || ''}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modal_email">Email ID *</Label>
                    <Input
                      id="modal_email"
                      type="email"
                      value={appraiserForm.email}
                      onChange={(e) => handleAppraiserFormChange('email', e.target.value)}
                      placeholder="appraiser@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modal_phone">Phone Number *</Label>
                    <Input
                      id="modal_phone"
                      type="tel"
                      value={appraiserForm.phone}
                      onChange={(e) => handleAppraiserFormChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                {/* Camera Section */}
                <div className="space-y-4">
                  <Label>Face Photo *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {!capturedPhoto ? (
                      <div className="space-y-4">
                        {isCameraActive ? (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full rounded-lg bg-black"
                            />
                            <Button 
                              onClick={capturePhoto} 
                              className="w-full gap-2 bg-green-600 hover:bg-green-700"
                            >
                              <Camera className="h-4 w-4" />
                              Capture Photo
                            </Button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8">
                            <Camera className="h-16 w-16 text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-4">Click to start camera</p>
                            <Button onClick={startCamera} className="gap-2">
                              <Camera className="h-4 w-4" />
                              Start Camera
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <img
                          src={capturedPhoto}
                          alt="Captured face"
                          className="w-full rounded-lg"
                        />
                        <Button 
                          onClick={retakePhoto} 
                          variant="outline" 
                          className="w-full gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Retake Photo
                        </Button>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                </div>
              </div>

              {/* Success/Error Message */}
              {registrationMessage && (
                <div className={`mt-4 p-4 rounded-lg ${
                  registrationSuccess 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {registrationSuccess ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                    {registrationMessage}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={closeAppraiserModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={registerAppraiser} 
                  disabled={saving}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Register Appraiser
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Branch Admin Add Modal (Bank Admin Only) */}
      {showBranchAdminModal && isBankAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Add Branch Administrator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="branch_select">Branch *</Label>
                <select
                  id="branch_select"
                  value={branchAdminForm.branch_id}
                  onChange={(e) => handleBranchAdminFormChange('branch_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a branch</option>
                  {branches
                    .filter(branch => branch.bank_id === adminBankId)
                    .map((branch) => (
                      <option key={branch.id} value={branch.id.toString()}>
                        {branch.branch_name} ({branch.branch_code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_full_name">Full Name *</Label>
                <Input
                  id="admin_full_name"
                  value={branchAdminForm.full_name}
                  onChange={(e) => handleBranchAdminFormChange('full_name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email">Email *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={branchAdminForm.email}
                  onChange={(e) => handleBranchAdminFormChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_password">Password *</Label>
                <div className="relative">
                  <Input
                    id="admin_password"
                    type={showBranchAdminPassword ? "text" : "password"}
                    value={branchAdminForm.password}
                    onChange={(e) => handleBranchAdminFormChange('password', e.target.value)}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowBranchAdminPassword(!showBranchAdminPassword)}
                  >
                    {showBranchAdminPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_phone">Phone</Label>
                <Input
                  id="admin_phone"
                  value={branchAdminForm.phone}
                  onChange={(e) => handleBranchAdminFormChange('phone', e.target.value)}
                  placeholder="Enter phone number (optional)"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeBranchAdminModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveBranchAdmin} 
                  disabled={savingBranchAdmin}
                  className="gap-2"
                >
                  {savingBranchAdmin ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Branch Admin
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BankBranchAdmin;
