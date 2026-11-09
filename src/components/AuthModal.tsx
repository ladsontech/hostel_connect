'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { 
  X, 
  Smartphone, 
  KeyRound, 
  Building, 
  Briefcase, 
  GraduationCap, 
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { loginWithPhone, registerUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  // Reset mode when opened
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep('phone');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialMode]);
  
  // Form fields
  const [phone, setPhone] = useState('+256 ');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [university, setUniversity] = useState('Makerere University');
  const [course, setCourse] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [idNumber, setIdNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      setError('Please provide a valid Ugandan phone number');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      setSuccessMsg('SMS verification code sent! (Use demo code: 123456)');
    }, 600);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const res = await loginWithPhone(phone, otp);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Verification failed');
      }
    } else {
      if (otp !== '123456' && otp.length !== 6) {
        setLoading(false);
        setError('Invalid OTP code. (Demo code: 123456)');
        return;
      }
      const res = await registerUser({
        name,
        phone,
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
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header (No gradients) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-extrabold text-[#0f3a98] text-lg">
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h3>
            <p className="text-xs text-slate-500">
              {mode === 'login' ? 'Sign in with your phone & SMS OTP' : 'Register as a Student, Broker or Custodian'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-[#0f3a98] text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-[#0f3a98]" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mary Atuhaire"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition ${
                          role === 'student' ? 'border-[#0f3a98] bg-[#e8effc] text-[#0f3a98]' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('custodian')}
                        className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition ${
                          role === 'custodian' ? 'border-[#0f3a98] bg-[#0f3a98] text-[#ffbe00]' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        Custodian
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('broker')}
                        className={`p-2 rounded-lg border text-xs font-bold flex flex-col items-center gap-1 transition ${
                          role === 'broker' ? 'border-[#ffbe00] bg-amber-50 text-amber-900' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                        Broker
                      </button>
                    </div>
                  </div>

                  {role === 'student' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">University & Course</label>
                      <div className="space-y-2">
                        <select
                          value={university}
                          onChange={e => setUniversity(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98]"
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
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uganda Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="+256 700 000 000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standard MTN / Airtel numbers supported.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-1.5"
              >
                {loading ? 'Sending SMS OTP...' : 'Send 6-Digit Code'}
                <ArrowRight className="w-4 h-4 text-[#ffbe00]" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 6-Digit SMS Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] font-mono text-center tracking-widest text-lg font-bold"
                  />
                </div>
                <p className="text-[11px] text-[#0f3a98] mt-1 font-bold">
                  Demo code: 123456
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white font-bold text-sm shadow-sm transition"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Change Phone Number
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
                    setStep('phone');
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
                    setStep('phone');
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
