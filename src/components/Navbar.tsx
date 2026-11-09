'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { 
  Building2, 
  Search, 
  Layers, 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth?: () => void;
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
              <span className="w-2 h-2 rounded-full bg-[#ffbe00]"></span>
              Uganda University Hostel Marketplace
            </span>
            <span className="hidden md:inline text-blue-100">• Makerere, MUBS, Kyambogo & more</span>
          </div>

          {/* Quick Role Switcher for testing all 4 roles */}
          <div className="flex items-center gap-1 bg-[#0a2666] p-1 rounded-lg border border-blue-900 text-xs">
            <span className="text-[11px] text-blue-200 px-1.5 hidden sm:inline">Role View:</span>
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
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#0f3a98] flex items-center justify-center text-[#ffbe00] shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-[#0f3a98] tracking-tight">Hostel Connect</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#ffbe00] text-[#0f3a98]">
                Uganda
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium -mt-1">Verified campus accommodations</p>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
          <Link href="/" className="hover:text-[#0f3a98] transition flex items-center gap-1.5">
            <Search className="w-4 h-4 text-[#0f3a98]" />
            Find Hostels
          </Link>

          {shortlistCount > 0 && onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className="text-[#0f3a98] bg-[#e8effc] px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 font-bold"
            >
              <Layers className="w-4 h-4 text-[#ffbe00]" />
              Compare ({shortlistCount})
            </button>
          )}

          <Link href="/seller" className="hover:text-[#0f3a98] transition flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#0f3a98]" />
            Seller Portal
            {currentUser?.role === 'custodian' || currentUser?.role === 'broker' ? (
              <span className="w-2 h-2 rounded-full bg-[#ffbe00]"></span>
            ) : null}
          </Link>

          <Link href="/admin" className="hover:text-[#0f3a98] transition flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0f3a98]" />
            Admin Panel
          </Link>
        </nav>

        {/* User Account / Login Action */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                  {currentUser.name}
                  {currentUser.isVerified && (
                    <UserCheck className="w-3.5 h-3.5 text-[#0f3a98]" />
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
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-sm font-bold shadow-sm transition"
            >
              Sign In / Register
            </button>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            <Search className="w-4 h-4 text-[#0f3a98]" />
            Explore Hostels
          </Link>
          <Link
            href="/seller"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-800"
          >
            <Building2 className="w-4 h-4 text-[#0f3a98]" />
            Seller Portal (Custodians & Brokers)
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-semibold text-slate-800"
          >
            <ShieldCheck className="w-4 h-4 text-[#0f3a98]" />
            Admin Panel (Verification & Merge Tool)
          </Link>
        </div>
      )}
    </header>
  );
}
