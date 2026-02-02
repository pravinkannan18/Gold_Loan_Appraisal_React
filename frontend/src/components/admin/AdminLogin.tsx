import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Lock, 
  Mail, 
  User,
  Loader2,
  AlertCircle,
  Shield,
  GitBranch
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Bank {
  id: number;
  bank_name: string;
  bank_code: string;
}

interface Branch {
  id: number;
  branch_name: string;
  branch_code: string;
  bank_id: number;
}

interface AdminLoginProps {
  onLoginSuccess: (adminData: {
    email: string;
    role: string;
    bankId: number;
    bankName: string;
    branchId?: number;
    branchName?: string;
  }) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  
  const [selectedBankId, setSelectedBankId] = useState<number | ''>('');
  const [adminType, setAdminType] = useState<'bank_admin' | 'branch_admin'>('bank_admin');
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanksAndBranches();
  }, []);

  useEffect(() => {
    if (selectedBankId && adminType === 'branch_admin') {
      const bankBranches = branches.filter(b => b.bank_id === selectedBankId);
      setFilteredBranches(bankBranches);
      setSelectedBranchId('');
    } else {
      setFilteredBranches([]);
      setSelectedBranchId('');
    }
  }, [selectedBankId, adminType, branches]);

  const fetchBanksAndBranches = async () => {
    try {
      setLoading(true);
      const [banksRes, branchesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/bank`),
        fetch(`${API_BASE_URL}/api/branch`)
      ]);

      if (banksRes.ok) {
        const banksData = await banksRes.json();
        setBanks(Array.isArray(banksData) ? banksData : []);
      }

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedBankId) {
      setError('Please select a bank');
      return;
    }

    if (adminType === 'branch_admin') {
      if (!selectedBranchId) {
        setError('Please select a branch');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }
    } else {
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Call login API
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          bank_id: selectedBankId || null,
          branch_id: adminType === 'branch_admin' ? selectedBranchId : null,
          role: adminType
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Use data from API response
          onLoginSuccess({
            email: data.user.email,
            role: data.user.role,
            bankId: data.user.bank_id,
            bankName: data.user.bank_name || '',
            branchId: data.user.branch_id,
            branchName: data.user.branch_name || ''
          });
        } else {
          setError(data.message || 'Login failed');
        }
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border-gray-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Login</CardTitle>
          <p className="text-gray-600 text-sm mt-2">Gold Loan Appraisal System</p>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Bank Selection */}
            <div className="space-y-2">
              <Label htmlFor="bank" className="text-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Bank Name
              </Label>
              <select
                id="bank"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="" className="bg-white">Select Bank</option>
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id} className="bg-white">
                    {bank.bank_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Selection (for branch admin) */}
            {adminType === 'branch_admin' && (
              <div className="space-y-2">
                <Label htmlFor="branch" className="text-gray-700 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Branch Name
                </Label>
                <select
                  id="branch"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={!selectedBankId}
                >
                  <option value="" className="bg-white">
                    {selectedBankId ? 'Select Branch' : 'Select bank first'}
                  </option>
                  {filteredBranches.map(branch => (
                    <option key={branch.id} value={branch.id} className="bg-white">
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            

            {/* Admin Type Selection */}
            <div className="space-y-2">
              <Label className="text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Admin Type
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdminType('bank_admin')}
                  className={`px-4 py-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    adminType === 'bank_admin'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Bank Admin
                </button>
                <button
                  type="button"
                  onClick={() => setAdminType('branch_admin')}
                  className={`px-4 py-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    adminType === 'branch_admin'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Branch Admin
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email ID
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={adminType === 'branch_admin' ? 'your@email.com' : 'admin@bank.com'}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" />
                  Login
                </span>
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center pt-2">
              <Link 
                to="/forgot-password" 
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
