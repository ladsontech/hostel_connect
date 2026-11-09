'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import FaIcon from './FaIcon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { loginWithCredentials, loginWithGoogle, registerUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('student');
  const [university, setUniversity] = useState('Makerere University');
  const [course, setCourse] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [idNumber, setIdNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginWithCredentials(loginIdentifier, loginPassword);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Google sign-in failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setError('Please provide your full name');
      return;
    }
    if (!regEmail.trim()) {
      setError('Please provide your email address for Google sign-in and account access');
      return;
    }
    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    const res = await registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim() || undefined,
      phoneOrEmail: regEmail.trim(),
      password: regPassword,
      role,
      university: role === 'student' ? university : undefined,
      course: role === 'student' ? course : undefined,
      businessName: role !== 'student' ? businessName : undefined,
      idNumber: role !== 'student' ? idNumber : undefined
    });

    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center py-6 sm:py-8 animate-in fade-in">
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 flex flex-col font-sans max-h-[90vh] my-auto overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#0f3a98] hover:bg-[#0a2666] text-white flex items-center justify-center transition shadow-sm"
          aria-label="Close dialog"
        >
          <FaIcon icon="fa-solid fa-xmark" className="text-xs text-white" />
        </button>

        {/* Top Header with Hostel Connect Logo & Switcher */}
        <div className="pt-6 pb-3 px-6 sm:px-8 text-center bg-white border-b border-slate-100 shrink-0">
          <div className="flex justify-center mb-2.5">
            <img
              src="/logo.png"
              alt="Hostel Connect"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-[#0f3a98] tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-xs mx-auto">
            {mode === 'login' 
              ? 'Sign in to access verified student accommodations' 
              : 'Join as a Student, Custodian, or Broker in Uganda'}
          </p>

          {/* Mode Tabs (Sign In / Register) */}
          <div className="flex rounded-xl bg-slate-100 p-1 mt-3">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#0f3a98] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-[#0f3a98] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="px-6 sm:px-8 py-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <FaIcon icon="fa-solid fa-triangle-exclamation" className="shrink-0 text-sm" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= LOGIN MODE ================= */}
          {mode === 'login' ? (
            <div className="space-y-4">
              {/* One-Click Google Authentication (Only in Login) */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-[#0f3a98] hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow-sm bg-white"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
              </button>

              {/* Clean Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-normal text-slate-400 uppercase tracking-normal whitespace-nowrap shrink-0">
                  or with credentials
                </span>
                <div className="border-t border-slate-200 w-full"></div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number or Email
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <FaIcon icon="fa-solid fa-user" className="text-xs" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="+256 700 000 000 or email@domain.com"
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] focus:border-transparent font-normal bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-slate-700">Password</label>
                    <span className="text-[11px] text-slate-400 font-normal">Optional for demo</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <FaIcon icon="fa-solid fa-lock" className="text-xs" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] focus:border-transparent font-normal bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <FaIcon
                        icon={showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}
                        className="text-xs"
                      />
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot Password */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-[#0f3a98] focus:ring-[#0f3a98]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset link will be sent to your email or phone number.')}
                    className="text-[#0f3a98] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white font-medium text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
                >
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                  <FaIcon icon="fa-solid fa-arrow-right" className="text-xs text-white" />
                </button>
              </form>
            </div>
          ) : (
            /* ================= REGISTER MODE (NO GOOGLE BUTTON, COLLECTS EMAIL) ================= */
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaIcon icon="fa-solid fa-id-card" className="text-xs" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mary Atuhaire"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-normal"
                  />
                </div>
              </div>

              {/* Role Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">I am joining as a</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      role === 'student'
                        ? 'border-[#0f3a98] bg-[#0f3a98] text-white shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <FaIcon
                      icon="fa-solid fa-graduation-cap"
                      className={`text-sm ${role === 'student' ? 'text-white' : 'text-slate-500'}`}
                    />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('custodian')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      role === 'custodian'
                        ? 'border-[#0f3a98] bg-[#0f3a98] text-white shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <FaIcon
                      icon="fa-solid fa-hotel"
                      className={`text-sm ${role === 'custodian' ? 'text-white' : 'text-slate-500'}`}
                    />
                    <span>Custodian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('broker')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                      role === 'broker'
                        ? 'border-[#0f3a98] bg-[#0f3a98] text-white shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <FaIcon
                      icon="fa-solid fa-handshake"
                      className={`text-sm ${role === 'broker' ? 'text-white' : 'text-slate-500'}`}
                    />
                    <span>Broker</span>
                  </button>
                </div>
              </div>

              {/* Email Address (Used for Google Authentication later) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-slate-700">Email Address</label>
                  <span className="text-[11px] text-[#0f3a98] font-normal">Used for Google sign-in</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaIcon icon="fa-solid fa-envelope" className="text-xs" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@gmail.com or student@mak.ac.ug"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-normal bg-white"
                  />
                </div>
              </div>

              {/* Phone Number (Optional / Direct Contact) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Uganda Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaIcon icon="fa-solid fa-phone" className="text-xs" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. +256 700 000 000 (for WhatsApp & calls)"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-normal bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <FaIcon icon="fa-solid fa-lock" className="text-xs" />
                  </span>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-normal bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    <FaIcon
                      icon={showRegPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}
                      className="text-xs"
                    />
                  </button>
                </div>
              </div>

              {/* Student specific fields */}
              {role === 'student' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">University & Course</label>
                  <div className="space-y-2">
                    <select
                      value={university}
                      onChange={e => setUniversity(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-normal bg-white"
                    >
                      <option>Makerere University</option>
                      <option>MUBS (Makerere Business School)</option>
                      <option>Kyambogo University</option>
                      <option>Uganda Christian University (UCU)</option>
                      <option>KIU (Kampala International University)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Course name (e.g. B. Education)"
                      value={course}
                      onChange={e => setCourse(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-normal"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Business Name & NIN / ID</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Hostel or Agency Business Name"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-normal"
                    />
                    <input
                      type="text"
                      placeholder="National ID Number (NIN)"
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-normal"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white font-medium text-sm shadow-md transition flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                <FaIcon icon="fa-solid fa-arrow-right" className="text-xs text-white" />
              </button>
            </form>
          )}

          {/* Mode switch footer */}
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="font-medium text-[#0f3a98] hover:underline"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-medium text-[#0f3a98] hover:underline"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
