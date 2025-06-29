import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onToggleMode: () => void;
  isRegisterMode: boolean;
  onClose: () => void;
}

export default function LoginForm({ onToggleMode, isRegisterMode, onClose }: LoginFormProps) {
  const { signIn, signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        // Validation for registration
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }

        await signUp(formData.email, formData.password, {
          display_name: formData.displayName || formData.email.split('@')[0]
        });
        
        // Show success message for registration
        setError('Registration successful! Please check your email to verify your account.');
      } else {
        await signIn(formData.email, formData.password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          {isRegisterMode ? (
            <UserPlus className="w-8 h-8 text-white" />
          ) : (
            <LogIn className="w-8 h-8 text-white" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {isRegisterMode ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-slate-600">
          {isRegisterMode 
            ? 'Join the community of shower thinkers' 
            : 'Sign in to save and sync your thoughts'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isRegisterMode && (
          <div>
            <label htmlFor="displayName" className="block text-sm font-semibold text-slate-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="How should we call you?"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              className="w-full pl-10 pr-12 py-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isRegisterMode && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirm your password"
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 transition-all duration-300 outline-none"
              />
            </div>
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-2xl border-2 ${
            error.includes('successful') 
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 disabled:cursor-not-allowed shadow-xl hover:shadow-blue-500/25 transform hover:scale-105 disabled:transform-none"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>{isRegisterMode ? 'Creating Account...' : 'Signing In...'}</span>
            </>
          ) : (
            <>
              {isRegisterMode ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-slate-600">
          {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
        </p>
        <button
          onClick={onToggleMode}
          className="mt-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
        >
          {isRegisterMode ? 'Sign In' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}