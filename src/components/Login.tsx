import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { ApiService } from '../services/api';

interface LoginProps {
  onLogin: (token: string) => void;
  onOTPRequired: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onOTPRequired }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await ApiService.login(email, password);
      
      if (response.success) {
        onOTPRequired(email);
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-3xl mb-6 shadow-soft">
            <img 
              src="https://i.ibb.co/zTbbXj00/Adobe-Express-file.png" 
              alt="Elite Sports" 
              className="w-12 h-12 object-contain filter brightness-0 invert"
            />
          </div>
          <h1 className="font-display text-2xl font-semibold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-accent-400 text-sm">Sign in to your Elite Sports account</p>
        </div>

        {/* Login Form */}
        <div className="card p-8 animate-slide-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-accent-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-accent-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-accent-400 hover:text-accent-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
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
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-accent-400 text-sm">
            © 2025 Elite Sports POS
          </p>
        </div>
      </div>
    </div>
  );
};