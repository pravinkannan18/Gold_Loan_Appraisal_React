import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Lock, 
  Loader2, 
  AlertCircle, 
  Shield,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [adminType, setAdminType] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('No reset token provided. Please use the link from your email.');
      setValidating(false);
      return;
    }

    validateToken();
  }, [token]);

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    });
  }, [newPassword]);

  const validateToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/password-reset/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (data.valid) {
        setTokenValid(true);
        setEmail(data.email || '');
        setAdminType(data.admin_type || '');
        setRequiresOtp(data.requires_otp || false);
      } else {
        setTokenError(data.message || 'Invalid or expired reset link.');
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setTokenError('Failed to validate reset link. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const handleResendOtp = async () => {
    if (!token) return;
    
    setResendingOtp(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/password-reset/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (data.success) {
        setError(null);
        alert('A new OTP has been sent to your registered phone number.');
      } else {
        setError(data.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (requiresOtp && !otp.trim()) {
      setError('Please enter the OTP sent to your phone.');
      return;
    }

    if (requiresOtp && otp.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/password-reset/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          otp: requiresOtp ? otp : null,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.detail || data.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length;
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length;
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
        <Card className="w-full max-w-md bg-white shadow-lg border-gray-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Invalid Link</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-4 text-center">
            <p className="text-gray-600 mb-6">
              {tokenError}
            </p>
            
            <Link to="/forgot-password">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                Request New Reset Link
              </Button>
            </Link>
            
            <Link to="/admin" className="block mt-3">
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
        <Card className="w-full max-w-md bg-white shadow-lg border-gray-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Password Reset Successful!</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-4 text-center">
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now login with your new password.
            </p>
            
            <Button
              onClick={() => navigate('/admin')}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Lock className="w-4 h-4 mr-2" />
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border-gray-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Reset Password</CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            {email && <span className="block">Resetting password for: <strong>{email}</strong></span>}
          </p>
        </CardHeader>
        
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP Input (for bank admin) */}
            {requiresOtp && (
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  OTP (sent to your phone)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest font-mono text-lg"
                    maxLength={6}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendOtp}
                    disabled={resendingOtp}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {resendingOtp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-gray-500 text-xs">
                  OTP expires in 5 minutes. Click refresh to resend.
                </p>
              </div>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(Object.values(passwordStrength).filter(Boolean).length / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{getStrengthText()}</span>
                  </div>
                  <ul className="text-xs space-y-1">
                    <li className={passwordStrength.length ? 'text-green-600' : 'text-gray-400'}>
                      ✓ At least 8 characters
                    </li>
                    <li className={passwordStrength.uppercase ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Uppercase letter
                    </li>
                    <li className={passwordStrength.lowercase ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Lowercase letter
                    </li>
                    <li className={passwordStrength.number ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Number
                    </li>
                    <li className={passwordStrength.special ? 'text-green-600' : 'text-gray-400'}>
                      ✓ Special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`w-full px-4 py-3 pr-10 bg-white border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    confirmPassword && confirmPassword !== newPassword 
                      ? 'border-red-300' 
                      : confirmPassword && confirmPassword === newPassword
                        ? 'border-green-300'
                        : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-red-600 text-xs">Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-green-600 text-xs">Passwords match ✓</p>
              )}
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
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting Password...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Reset Password
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
