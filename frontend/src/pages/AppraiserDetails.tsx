import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ImageIcon, ArrowLeft, ArrowRight, UserCircle, Shield, AlertCircle, Loader2, CheckCircle, Building, Mail, MapPin, Phone, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ModernDashboardLayout } from '@/components/layouts/ModernDashboardLayout';
import { cn } from '@/lib/utils';
import { StepIndicator } from '../components/journey/StepIndicator';
import { LiveCamera, LiveCameraHandle } from '../components/journey/LiveCamera';
import { apiService } from '../services/api';
import { generateAppraiserId, showToast } from '../lib/utils';

export function AppraiserDetails() {
  const navigate = useNavigate();
  const cameraRef = useRef<LiveCameraHandle>(null);
  const [name, setName] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [banks, setBanks] = useState<Array<{id: number, bank_name: string}>>([]);
  const [branches, setBranches] = useState<Array<{id: number, branch_name: string, bank_id: number}>>([]);
  const [filteredBranches, setFilteredBranches] = useState<Array<{id: number, branch_name: string, bank_id: number}>>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [appraiserData, setAppraiserData] = useState<any>(null);

  // Load banks and branches data
  useEffect(() => {
    const fetchBanksAndBranches = async () => {
      try {
        const [banksResponse, branchesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/banks`),
          fetch(`${import.meta.env.VITE_API_URL}/api/admin/branches`)
        ]);
        
        if (banksResponse.ok && branchesResponse.ok) {
          const banksData = await banksResponse.json();
          const branchesData = await branchesResponse.json();
          setBanks(banksData.banks || []);
          setBranches(branchesData.branches || []);
        }
      } catch (error) {
        console.error('Error loading banks/branches:', error);
        showToast('Failed to load banks and branches data', 'error');
      }
    };
    
    fetchBanksAndBranches();
  }, []);

  // Filter branches when bank selection changes
  useEffect(() => {
    if (selectedBankId) {
      const bankId = parseInt(selectedBankId);
      const filtered = branches.filter(branch => branch.bank_id === bankId);
      setFilteredBranches(filtered);
      setSelectedBranchId(''); // Reset branch selection
    } else {
      setFilteredBranches([]);
      setSelectedBranchId('');
    }
  }, [selectedBankId, branches]);

  const handleOpenCamera = () => {
    setCameraError('');
    setIsCameraReady(false);
    cameraRef.current?.openCamera();
    setIsCameraOpen(true);
  };

  const handleCloseCamera = () => {
    cameraRef.current?.closeCamera();
    setIsCameraOpen(false);
    setIsCameraReady(false);
  };

  const handleCapture = () => {
    if (!isCameraReady) {
      showToast('Camera is still starting. Please wait until the preview is ready.', 'info');
      return;
    }
    const imageData = cameraRef.current?.captureImage();
    if (imageData && imageData !== 'data:,' && imageData.length > 100) {
      setPhoto(imageData);
      cameraRef.current?.closeCamera();
      setIsCameraOpen(false);
      showToast('Photo captured successfully!', 'success');
    } else {
      showToast('Failed to capture photo. Please wait for camera to fully load and try again.', 'error');
    }
  };

  const handleRetake = () => {
    setPhoto('');
    handleOpenCamera();
  };

  const handleVerifyAppraiser = async () => {
    if (!name.trim()) {
      showToast('Please enter appraiser name', 'error');
      return;
    }

    if (!selectedBankId) {
      showToast('Please select a bank', 'error');
      return;
    }

    if (!selectedBranchId) {
      showToast('Please select a branch', 'error');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('idle');
    setVerificationMessage('');

    try {
      // Verify appraiser is registered in the selected bank/branch
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/verify-appraiser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          bank_id: parseInt(selectedBankId),
          branch_id: parseInt(selectedBranchId)
        })
      });

      const data = await response.json();

      if (response.ok && data.exists) {
        setVerificationStatus('success');
        setVerificationMessage('Appraiser verified successfully!');
        setAppraiserData(data.appraiser);
        
        // Store verified appraiser data
        localStorage.setItem('currentAppraiser', JSON.stringify({
          ...data.appraiser,
          bankName: banks.find(b => b.id === parseInt(selectedBankId))?.bank_name,
          branchName: branches.find(b => b.id === parseInt(selectedBranchId))?.branch_name
        }));
        
        showToast('Appraiser verification successful!', 'success');
        
        // Navigate to next step after verification
        setTimeout(() => {
          navigate('/dashboard'); // or wherever the next step should be
        }, 1500);
      } else {
        setVerificationStatus('error');
        setVerificationMessage('Appraiser not found in the selected bank/branch. Only branch admin can add appraisers to this system.');
        showToast('Appraiser not registered in selected bank/branch', 'error');
      }
    } catch (error) {
      console.error('Error verifying appraiser:', error);
      setVerificationStatus('error');
      setVerificationMessage('Failed to verify appraiser. Please try again.');
      showToast('Verification failed. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleNext = async () => {
    if (!photo) {
      showToast('Please capture appraiser photo for facial recognition', 'error');
      return;
    }

    // Validate photo data
    if (photo === 'data:,' || photo.length < 100) {
      showToast('Invalid photo data. Please retake the photo.', 'error');
      setPhoto('');
      return;
    }

    setIsLoading(true);

    try {
      if (!appraiserData) {
        showToast('Please verify appraiser details first', 'error');
        setIsLoading(false);
        return;
      }

      console.log('=== APPRAISER FACIAL RECOGNITION ===');
      console.log('Photo length:', photo.length);
      console.log('Appraiser:', appraiserData);

      // Use facial recognition for identification
      const formData = new FormData();
      formData.append('image', photo);
      formData.append('appraiser_id', appraiserData.id || appraiserData.appraiser_id);
      formData.append('name', appraiserData.name);

      const faceResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/face/identify`, {
        method: 'POST',
        body: formData
      });

      const faceData = await faceResponse.json();

      if (faceResponse.ok && faceData.matches) {
        console.log('=== FACIAL RECOGNITION SUCCESS ===');
        console.log('Match confidence:', faceData.confidence);
        
        // Create a new session for this appraisal workflow
        const sessionResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/session/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to create appraisal session');
        }

        const sessionData = await sessionResponse.json();
        console.log('Session created:', sessionData.session_id);

        // Save verified appraiser to session
        localStorage.setItem('currentSession', JSON.stringify({
          sessionId: sessionData.session_id,
          appraiser: appraiserData,
          verified: true,
          timestamp: new Date().toISOString()
        }));

        showToast('Appraiser identification successful!', 'success');
        navigate('/camera-settings'); // Continue to next step
      } else {
        showToast('Facial recognition failed. Photo does not match registered appraiser.', 'error');
      }
    } catch (error) {
      console.error('Error during identification:', error);
      showToast('Identification failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModernDashboardLayout
      title="Appraiser Identification"
      showSidebar
      headerContent={<StepIndicator currentStep={1} />}
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-20">

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Live Camera / Photo Panel */}
          <div className="space-y-6">
            <Card className="h-full border-2 overflow-hidden shadow-lg flex flex-col">
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <Camera className="w-5 h-5 text-primary" />
                  {photo ? 'Captured Photo' : 'Live Application Camera'}
                </div>
                {!photo && (
                  <StatusBadge variant={isCameraOpen ? (isCameraReady ? "success" : "warning") : "default"}>
                    {isCameraOpen ? "Live" : "Idle"}
                  </StatusBadge>
                )}
                {photo && (
                  <StatusBadge variant="success">
                    Captured
                  </StatusBadge>
                )}
              </div>
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="bg-black/5 min-h-[400px] relative flex flex-col flex-1">
                  {/* Captured Image View */}
                  {photo && (
                    <div className="absolute inset-0 z-20 bg-background flex items-center justify-center">
                      <img src={photo} alt="Appraiser" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {/* Live Camera - Always mounted, hidden properly via CSS when photo exists or camera closed */}
                  <div className={cn("flex-1 flex flex-col", (photo || !isCameraOpen) && "hidden")}>
                    <LiveCamera
                      ref={cameraRef}
                      currentStepKey={1}
                      displayMode="inline"
                      className="flex-1"
                      onOpen={() => setIsCameraOpen(true)}
                      onClose={() => {
                        setIsCameraOpen(false);
                        setIsCameraReady(false);
                      }}
                      onReadyChange={setIsCameraReady}
                      onError={(message) => {
                        setCameraError(message);
                        showToast(message, 'error');
                      }}
                    />
                  </div>

                  {/* Empty State / Placeholder when camera is closed and no photo */}
                  {!isCameraOpen && !photo && (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 p-8">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                        <UserCircle className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-lg">Appraiser Facial Recognition</p>
                      <p className="text-sm mt-2 max-w-xs text-center">Please capture your photo for facial identification after verification.</p>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="p-6 bg-background border-t mt-auto">
                  {cameraError && !photo && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                      {cameraError}
                    </div>
                  )}

                  <div className="flex justify-center gap-4">
                    {photo ? (
                      <Button
                        onClick={handleRetake}
                        variant="outline"
                        size="lg"
                        className="min-w-[140px]"
                      >
                        <Camera className="w-4 h-4 mr-2" /> Retake Photo
                      </Button>
                    ) : (
                      <>
                        {isCameraOpen ? (
                          <>
                            <Button
                              onClick={handleCapture}
                              disabled={!isCameraReady}
                              className="min-w-[140px] shadow-lg shadow-primary/20"
                              size="lg"
                            >
                              <Camera className="w-4 h-4 mr-2" /> Capture
                            </Button>
                            <Button
                              variant="outline"
                              onClick={handleCloseCamera}
                              size="lg"
                            >
                              Close
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={handleOpenCamera}
                            size="lg"
                            className="min-w-[140px]"
                          >
                            <Camera className="w-4 h-4 mr-2" /> Open Camera
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Appraiser Details Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Appraiser Identification
                </CardTitle>
                <CardDescription>Select your bank and branch, then verify your identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {name && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Bank <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBankId}
                        onChange={(e) => setSelectedBankId(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select Bank</option>
                        {banks.map((bank) => (
                          <option key={bank.id} value={bank.id.toString()}>
                            {bank.bank_name}
                          </option>
                        ))}
                      </select>
                      {selectedBankId && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Building className="w-4 h-4 text-muted-foreground" /></div>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Branch <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        disabled={!selectedBankId}
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select Branch</option>
                        {filteredBranches.map((branch) => (
                          <option key={branch.id} value={branch.id.toString()}>
                            {branch.branch_name}
                          </option>
                        ))}
                      </select>
                      {selectedBranchId && <div className="absolute right-3 top-1/2 -translate-y-1/2"><MapPin className="w-4 h-4 text-muted-foreground" /></div>}
                    </div>
                  </div>
                </div>

                {/* Verification Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleVerifyAppraiser}
                    disabled={isVerifying || !name.trim() || !selectedBankId || !selectedBranchId}
                    className="w-full h-11"
                    variant={verificationStatus === 'success' ? 'default' : 'outline'}
                  >
                    {isVerifying ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                    ) : verificationStatus === 'success' ? (
                      <><CheckCircle className="w-4 h-4 mr-2" /> Verified</>
                    ) : (
                      <><Search className="w-4 h-4 mr-2" /> Verify Appraiser</>
                    )}
                  </Button>
                </div>

                {/* Verification Status Message */}
                {verificationMessage && (
                  <div className={cn(
                    "p-3 rounded-lg text-sm flex items-start gap-2",
                    verificationStatus === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                  )}>
                    {verificationStatus === 'success' ? (
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{verificationMessage}</span>
                  </div>
                )}

                {/* Appraiser Details Display */}
                {appraiserData && verificationStatus === 'success' && (
                  <div className="border rounded-xl p-4 bg-muted/30">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      Verified Appraiser Details
                    </h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {appraiserData.email || 'No email on record'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {appraiserData.phone || 'No phone on record'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-3 h-3" />
                        {banks.find(b => b.id === parseInt(selectedBankId))?.bank_name} - {filteredBranches.find(b => b.id === parseInt(selectedBranchId))?.branch_name}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={isLoading || verificationStatus !== 'success' || !photo}
                size="lg"
                className="shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-0 min-w-[150px]"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Identifying...</>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModernDashboardLayout>
  );
}
