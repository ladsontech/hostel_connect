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
  
  // Form fields
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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

    const res = await loginWithCredentials(phoneOrEmail, password);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Login failed');
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
    if (!name.trim()) {
      setError('Please provide your name');
      return;
    }
    if (!phoneOrEmail.trim()) {
      setError('Please provide your phone number or email');
      return;
    }

    setError('');
    setLoading(true);

    const res = await registerUser({
      name,
      phoneOrEmail,
      password,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col font-sans">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-extrabold text-[#0f3a98] text-lg">
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {mode === 'login' 
                ? 'Sign in using phone number, email or Google' 
                : 'Join Hostel Connect as a Student, Broker or Custodian'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
          >
            <FaIcon icon="fa-solid fa-xmark" className="text-sm" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <FaIcon icon="fa-solid fa-triangle-exclamation" className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* One-Click Google Authentication */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 rounded-xl border-2 border-slate-200 hover:border-[#0f3a98] hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow-sm"
          >
            <FaIcon icon="fa-brands fa-google" className="text-red-500 text-base" />
            <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or with credentials
            </span>
            <div className="border-t border-slate-200 w-full"></div>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number or Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <FaIcon icon="fa-solid fa-user" className="text-xs" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="+256 700 000 000 or name@domain.com"
                    value={phoneOrEmail}
                    onChange={e => setPhoneOrEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <span className="text-[11px] text-slate-400 font-medium">Optional for demo</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <FaIcon icon="fa-solid fa-lock" className="text-xs" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <FaIcon icon="fa-solid fa-arrow-right" className="text-xs" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <FaIcon icon="fa-solid fa-id-card" className="text-xs" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mary Atuhaire"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      role === 'student'
                        ? 'border-[#0f3a98] bg-[#e8effc] text-[#0f3a98] ring-1 ring-[#0f3a98]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <FaIcon icon="fa-solid fa-graduation-cap" className="text-sm" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('custodian')}
                    className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      role === 'custodian'
                        ? 'border-[#0f3a98] bg-[#0f3a98] text-[#ffbe00]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <FaIcon icon="fa-solid fa-hotel" className="text-sm" />
                    Custodian
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('broker')}
                    className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      role === 'broker'
                        ? 'border-[#ffbe00] bg-amber-50 text-amber-900 ring-1 ring-[#ffbe00]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <FaIcon icon="fa-solid fa-handshake" className="text-sm" />
                    Broker
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number or Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <FaIcon icon="fa-solid fa-envelope" className="text-xs" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="+256 700 000 000 or student@mak.ac.ug"
                    value={phoneOrEmail}
                    onChange={e => setPhoneOrEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
                  />
                </div>
              </div>

              {role === 'student' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">University & Course</label>
                  <div className="space-y-2">
                    <select
                      value={university}
                      onChange={e => setUniversity(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-medium"
                    >
                      <option>Makerere University</option>
                      <option>MUBS (Makerere Business School)</option>
                      <option>Kyambogo University</option>
                      <option>Uganda Christian University (UCU)</option>
                      <option>KIU (Kampala International University)</option>
                    </select>
                    <input
                      type="text"
                      placeholder="e.g. Bachelor of Commerce (Year 1)"
                      value={course}
                      onChange={e => setCourse(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Business Name & NIN / ID</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Hostel / Agency Business Name"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
                    />
                    <input
                      type="text"
                      placeholder="National ID Number (NIN)"
                      value={idNumber}
                      onChange={e => setIdNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Registering...' : 'Create Account'}</span>
                <FaIcon icon="fa-solid fa-arrow-right" className="text-xs" />
              </button>
            </form>
          )}

          {/* Mode switch */}
          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-600">
            {mode === 'login' ? (
              <span>
                New to Hostel Connect?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="font-bold text-[#0f3a98] hover:underline"
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
                  className="font-bold text-[#0f3a98] hover:underline"
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
