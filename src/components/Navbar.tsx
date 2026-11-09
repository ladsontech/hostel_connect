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
            <span className="inline-flex items-center gap-1.5 font-bold text-[#ffbe00]">
              <FaIcon icon="fa-solid fa-location-dot" className="text-xs text-[#ffbe00]" />
              Uganda University Hostel Marketplace
            </span>
            <span className="hidden md:inline text-blue-100 font-medium">• Makerere, MUBS, Kyambogo & more</span>
          </div>

          {/* Quick Role Switcher for testing all 4 roles */}
          <div className="flex items-center gap-1 bg-[#0a2666] p-1 rounded-lg border border-blue-900 text-xs">
            <span className="text-[11px] text-blue-200 px-1.5 hidden sm:inline font-semibold">Role View:</span>
            <button
              onClick={() => switchRole('student')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                currentUser?.role === 'student' ? 'bg-[#ffbe00] text-[#0f3a98] font-bold' : 'text-blue-100 hover:text-white'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => switchRole('custodian')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                currentUser?.role === 'custodian' ? 'bg-[#ffbe00] text-[#0f3a98] font-bold' : 'text-blue-100 hover:text-white'
              }`}
            >
              Custodian
            </button>
            <button
              onClick={() => switchRole('broker')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                currentUser?.role === 'broker' ? 'bg-[#ffbe00] text-[#0f3a98] font-bold' : 'text-blue-100 hover:text-white'
              }`}
            >
              Broker
            </button>
            <button
              onClick={() => switchRole('admin')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                currentUser?.role === 'admin' ? 'bg-[#ffbe00] text-[#0f3a98] font-bold' : 'text-blue-100 hover:text-white'
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
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
          <Link href="/" className="hover:text-[#0f3a98] transition flex items-center gap-2">
            <FaIcon icon="fa-solid fa-magnifying-glass" className="text-xs text-[#0f3a98]" />
            Find Hostels
          </Link>

          {shortlistCount > 0 && onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className="text-[#0f3a98] bg-[#e8effc] px-3 py-1.5 rounded-lg transition flex items-center gap-2 font-bold"
            >
              <FaIcon icon="fa-solid fa-layer-group" className="text-xs text-[#ffbe00]" />
              Compare ({shortlistCount})
            </button>
          )}

          <Link href="/seller" className="hover:text-[#0f3a98] transition flex items-center gap-2">
            <FaIcon icon="fa-solid fa-building-user" className="text-xs text-[#0f3a98]" />
            Seller Portal
            {currentUser?.role === 'custodian' || currentUser?.role === 'broker' ? (
              <span className="w-2 h-2 rounded-full bg-[#ffbe00]"></span>
            ) : null}
          </Link>

          <Link href="/admin" className="hover:text-[#0f3a98] transition flex items-center gap-2">
            <FaIcon icon="fa-solid fa-user-shield" className="text-xs text-[#0f3a98]" />
            Admin Panel
          </Link>
        </nav>

        {/* User Account / Login & Register Action */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1.5">
                  {currentUser.name}
                  {currentUser.isVerified && (
                    <FaIcon icon="fa-solid fa-circle-check" className="text-xs text-[#0f3a98]" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 capitalize flex items-center justify-end gap-1 font-medium">
                  <span className="text-[#0f3a98] font-bold">{currentUser.role}</span>
                  {currentUser.university && (
                    <span className="text-slate-400">• {currentUser.university}</span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition"
              >
                <FaIcon icon="fa-solid fa-right-from-bracket" className="text-xs" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth?.('login')}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:border-[#0f3a98] text-[#0f3a98] hover:bg-[#e8effc] text-xs sm:text-sm font-bold transition flex items-center gap-1.5"
              >
                <FaIcon icon="fa-solid fa-arrow-right-to-bracket" className="text-xs text-[#0f3a98]" />
                Login
              </button>
              <button
                onClick={() => onOpenAuth?.('register')}
                className="px-3.5 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <FaIcon icon="fa-solid fa-user-plus" className="text-xs text-[#ffbe00]" />
                Register
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700"
          >
            <FaIcon icon={mobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'} className="text-sm" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-800"
          >
            <FaIcon icon="fa-solid fa-magnifying-glass" className="text-sm text-[#0f3a98]" />
            Explore Hostels
          </Link>
          <Link
            href="/seller"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-800"
          >
            <FaIcon icon="fa-solid fa-building-user" className="text-sm text-[#0f3a98]" />
            Seller Portal (Custodians & Brokers)
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-800"
          >
            <FaIcon icon="fa-solid fa-user-shield" className="text-sm text-[#0f3a98]" />
            Admin Panel (Verification & Merge Tool)
          </Link>
        </div>
      )}
    </header>
  );
}
