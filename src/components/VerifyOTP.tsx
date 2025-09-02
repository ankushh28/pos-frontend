import React, { useState, useRef, useEffect } from 'react';
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';

interface VerifyOTPProps {
  email: string;
  onVerified: (token: string) => void;
  onBack: () => void;
}

export const VerifyOTP: React.FC<VerifyOTPProps> = ({ email, onVerified, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await ApiService.verifyOTP(email, otpString);
      
      if (response.success && response.token) {
        ApiService.setToken(response.token);
        onVerified(response.token);
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (error) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError('');
    
    try {
      await ApiService.login(email, '');
      alert('Code resent successfully!');
    } catch (error) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-6 shadow-soft">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-gray-900 mb-3">Verify your email</h1>
          <p className="text-accent-400 text-sm leading-relaxed">
            We've sent a 6-digit code to<br />
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        {/* OTP Form */}
        <div className="card p-8 animate-slide-in">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-6 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center space-x-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-semibold border border-gray-200 rounded-xl focus-ring bg-white"
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 ${
                isLoading
                  ? 'bg-accent-200 text-accent-500 cursor-not-allowed'
                  : 'btn-primary shadow-soft hover:shadow-medium'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify Code'
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-accent-400 text-sm">Didn't receive the code?</p>
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-primary hover:text-primary/80 font-medium text-sm flex items-center justify-center space-x-2 mx-auto disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              <span>{isResending ? 'Resending...' : 'Resend code'}</span>
            </button>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-accent-400 hover:text-accent-600 font-medium text-sm flex items-center justify-center space-x-2 mx-auto transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};