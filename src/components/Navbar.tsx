'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import FaIcon from './FaIcon';

interface NavbarProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
  shortlistCount?: number;
  onOpenCompare?: () => void;
}

export default function Navbar({ onOpenAuth, shortlistCount = 0, onOpenCompare }: NavbarProps) {
  const { currentUser, switchRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Top Uganda Notice & Role Switcher Bar */}
      <div className="bg-[#0f3a98] text-white text-xs py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-normal text-[#ffbe00]">
              <FaIcon icon="fa-solid fa-location-dot" className="text-xs text-[#ffbe00]" />
              Uganda University Hostel Marketplace
            </span>
            <span className="hidden md:inline text-blue-100 font-normal">• Makerere, MUBS, Kyambogo & more</span>
          </div>

          {/* Quick Role Switcher for testing all 4 roles */}
          <div className="flex items-center gap-1 bg-[#0a2666] p-1 rounded-lg border border-blue-900 text-xs">
            <span className="text-[11px] text-blue-200 px-1.5 hidden sm:inline font-normal">Role View:</span>
            <button
              onClick={() => switchRole('student')}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                currentUser?.role === 'student' ? 'bg-[#ffbe00] text-[#0f3a98] font-medium' : 'text-blue-100 hover:text-white font-normal'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => switchRole('custodian')}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                currentUser?.role === 'custodian' ? 'bg-[#ffbe00] text-[#0f3a98] font-medium' : 'text-blue-100 hover:text-white font-normal'
              }`}
            >
              Custodian
            </button>
            <button
              onClick={() => switchRole('broker')}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                currentUser?.role === 'broker' ? 'bg-[#ffbe00] text-[#0f3a98] font-medium' : 'text-blue-100 hover:text-white font-normal'
              }`}
            >
              Broker
            </button>
            <button
              onClick={() => switchRole('admin')}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                currentUser?.role === 'admin' ? 'bg-[#ffbe00] text-[#0f3a98] font-medium' : 'text-blue-100 hover:text-white font-normal'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center py-1">
          <img
            src="/logo.png"
            alt="Hostel Connect"
            className="h-10 sm:h-11 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav Items */}
        {shortlistCount > 0 && onOpenCompare && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-normal text-slate-700">
            <button
              onClick={onOpenCompare}
              className="text-[#0f3a98] bg-[#e8effc] px-3 py-1.5 rounded-lg transition flex items-center gap-2 font-normal"
            >
              <FaIcon icon="fa-solid fa-layer-group" className="text-xs text-[#ffbe00]" />
              Compare ({shortlistCount})
            </button>
          </nav>
        )}

        {/* User Account / Login & Register Action */}
        <div className="flex items-center gap-3">
          <Link
            href="/download"
            className="hidden lg:inline-flex px-3.5 py-1.5 rounded-lg bg-[#ffbe00] hover:bg-[#e5aa00] text-[#0f3a98] text-xs sm:text-sm font-medium shadow-sm transition items-center gap-1.5"
          >
            <FaIcon icon="fa-solid fa-download" className="text-xs" />
            <span>Download Our App</span>
          </Link>
          {currentUser ? (
            <div className="hidden md:flex items-center gap-2.5">
              {(currentUser.role === 'custodian' || currentUser.role === 'broker') && (
                <Link
                  href="/seller"
                  className="px-3 py-1.5 rounded-lg bg-[#e8effc] hover:bg-blue-100 text-[#0f3a98] text-xs font-medium border border-blue-200 transition flex items-center gap-1.5"
                >
                  <FaIcon
                    icon={currentUser.role === 'custodian' ? 'fa-solid fa-hotel' : 'fa-solid fa-person-walking'}
                    className="text-xs text-[#0f3a98]"
                  />
                  <span>{currentUser.role === 'custodian' ? 'Custodian Portal' : 'Broker Portal'}</span>
                </Link>
              )}
              {currentUser.role === 'admin' && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-lg bg-[#e8effc] hover:bg-blue-100 text-[#0f3a98] text-xs font-medium border border-blue-200 transition flex items-center gap-1.5"
                >
                  <FaIcon icon="fa-solid fa-shield-halved" className="text-xs text-[#0f3a98]" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <div className="text-right">
                <div className="text-xs font-medium text-slate-900 flex items-center justify-end gap-1.5">
                  {currentUser.name}
                  {currentUser.isVerified && (
                    <FaIcon icon="fa-solid fa-circle-check" className="text-xs text-[#0f3a98]" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 capitalize flex items-center justify-end gap-1 font-normal">
                  <span className="text-[#0f3a98] font-medium">{currentUser.role}</span>
                  {currentUser.university && (
                    <span className="text-slate-400">• {currentUser.university}</span>
                  )}
                </div>
              </div>
              {onOpenAuth && (
                <button
                  onClick={() => onOpenAuth('login')}
                  title="Switch Account Role"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#0f3a98] text-[#0f3a98] hover:bg-[#e8effc] text-xs font-medium transition flex items-center gap-1"
                >
                  <FaIcon icon="fa-solid fa-repeat" className="text-[11px]" />
                  <span>Switch</span>
                </button>
              )}
              <button
                onClick={logout}
                title="Log out"
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition"
              >
                <FaIcon icon="fa-solid fa-right-from-bracket" className="text-xs" />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => onOpenAuth?.('login')}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:border-[#0f3a98] text-[#0f3a98] hover:bg-[#e8effc] text-xs sm:text-sm font-normal transition flex items-center gap-1.5"
              >
                <FaIcon icon="fa-solid fa-arrow-right-to-bracket" className="text-xs text-[#0f3a98]" />
                Login
              </button>
              <button
                onClick={() => onOpenAuth?.('register')}
                className="px-3.5 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs sm:text-sm font-normal shadow-sm transition flex items-center gap-1.5"
              >
                <FaIcon icon="fa-solid fa-user-plus" className="text-xs text-white" />
                Register
              </button>
            </div>
          )}

          {/* Mobile 3-line menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="md:hidden w-9 h-9 rounded-lg border border-slate-200 hover:border-[#0f3a98] flex items-center justify-center text-[#0f3a98] hover:bg-[#e8effc] transition"
          >
            <FaIcon icon={mobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'} className="text-sm" />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu (Login & Register inside 3-line menu) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2.5 shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
          {currentUser ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#e8effc]/60 border border-blue-200/70 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-[#0f3a98] flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    {currentUser.isVerified && (
                      <FaIcon icon="fa-solid fa-circle-check" className="text-xs text-[#0f3a98]" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 capitalize mt-0.5">
                    <span className="text-[#0f3a98] font-medium">{currentUser.role}</span>
                    {currentUser.university && (
                      <span className="text-slate-500"> • {currentUser.university}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onOpenAuth && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth('login');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0f3a98] text-white text-xs font-medium flex items-center gap-1 hover:bg-[#0a2666] transition"
                    >
                      <FaIcon icon="fa-solid fa-repeat" className="text-[11px] text-[#ffbe00]" />
                      <span>Switch</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white text-[#0f3a98] text-xs font-medium flex items-center gap-1 hover:bg-blue-50 transition"
                  >
                    <FaIcon icon="fa-solid fa-right-from-bracket" className="text-xs" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>

              {(currentUser.role === 'custodian' || currentUser.role === 'broker') && (
                <Link
                  href="/seller"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white text-sm font-medium shadow-sm transition flex items-center justify-center gap-2"
                >
                  <FaIcon
                    icon={currentUser.role === 'custodian' ? 'fa-solid fa-hotel' : 'fa-solid fa-person-walking'}
                    className="text-xs text-[#ffbe00]"
                  />
                  <span>{currentUser.role === 'custodian' ? 'Open Custodian Portal' : 'Open Broker Portal'}</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth?.('login');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-[#0f3a98]/30 bg-[#e8effc]/40 hover:bg-[#e8effc] text-[#0f3a98] text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <FaIcon icon="fa-solid fa-arrow-right-to-bracket" className="text-xs text-[#0f3a98]" />
                <span>Login</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth?.('register');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white text-sm font-medium shadow-sm transition flex items-center justify-center gap-2"
              >
                <FaIcon icon="fa-solid fa-user-plus" className="text-xs text-[#ffbe00]" />
                <span>Register</span>
              </button>
            </div>
          )}

          <Link
            href="/download"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#ffbe00] hover:bg-[#e5aa00] text-[#0f3a98] text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
          >
            <FaIcon icon="fa-solid fa-download" className="text-xs text-[#0f3a98]" />
            <span>Download Our App</span>
          </Link>

          {shortlistCount > 0 && onOpenCompare && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCompare();
              }}
              className="w-full py-2 px-4 rounded-xl bg-[#e8effc] text-[#0f3a98] text-xs font-medium flex items-center justify-center gap-2 border border-blue-200"
            >
              <FaIcon icon="fa-solid fa-layer-group" className="text-xs text-[#ffbe00]" />
              <span>Compare ({shortlistCount})</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
