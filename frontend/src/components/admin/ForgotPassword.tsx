import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Mail, 
  Loader2, 
  AlertCircle, 
  Shield,
  ArrowLeft,
  Building2,
  GitBranch,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ForgotPasswordProps {
  onBack?: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [adminType, setAdminType] = useState<'bank_admin' | 'branch_admin'>('bank_admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/password-reset/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          admin_type: adminType
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setRequiresOtp(data.requires_otp);
      } else {
        setError(data.detail || data.message || 'Failed to send reset link');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
        <Card className="w-full max-w-md bg-white shadow-lg border-gray-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-4 text-center">
            <p className="text-gray-600 mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            
            {requiresOtp && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm">
                  <strong>Bank Admin:</strong> An OTP has also been sent to your registered phone number. 
                  You'll need both the link and OTP to reset your password.
                </p>
              </div>
            )}
            
            <p className="text-gray-500 text-sm mb-6">
              The link will expire in 10 minutes. If you don't see the email, check your spam folder.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Send to a different email
              </Button>
              
              <Link to="/admin" className="block">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
          <CardTitle className="text-2xl font-bold text-gray-900">Forgot Password</CardTitle>
          <p className="text-gray-600 text-sm mt-2">Enter your email to reset your password</p>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Admin Type Selection */}
            <div className="space-y-2">
              <Label className="text-gray-700">Admin Type</Label>
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

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                {adminType === 'bank_admin' 
                  ? 'You will receive a reset link via email and an OTP via SMS for additional security.'
                  : 'You will receive a reset link via email to reset your branch password.'}
              </p>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Reset Link...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Send Reset Link
                </span>
              )}
            </Button>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <Link 
                to="/admin" 
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
