'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';
import { 
  Building2, 
  Search, 
  Heart, 
  Layers, 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  Menu, 
  X,
  PhoneCall,
  Sparkles
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Uganda Notice & Role Switcher Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Uganda University Hostel Marketplace
            </span>
            <span className="hidden md:inline text-slate-400">• Makerere, MUBS, Kyambogo & more</span>
          </div>

          {/* Quick Role Switcher for seamless testing of all 4 roles per SRS */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-[11px] text-slate-400 px-1.5 hidden sm:inline">Role View:</span>
            <button
              onClick={() => switchRole('student')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentUser?.role === 'student' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => switchRole('custodian')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentUser?.role === 'custodian' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Custodian
            </button>
            <button
              onClick={() => switchRole('broker')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentUser?.role === 'broker' ? 'bg-amber-600 text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Broker
            </button>
            <button
              onClick={() => switchRole('admin')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                currentUser?.role === 'admin' ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:text-white'
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Hostel Connect</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Uganda
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-1">Verified campus accommodations</p>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-emerald-700 transition flex items-center gap-1.5">
            <Search className="w-4 h-4" />
            Find Hostels
          </Link>

          {shortlistCount > 0 && onOpenCompare && (
            <button
              onClick={onOpenCompare}
              className="hover:text-emerald-700 transition flex items-center gap-1.5 relative text-emerald-800 font-semibold"
            >
              <Layers className="w-4 h-4" />
              Compare ({shortlistCount})
            </button>
          )}

          <Link href="/seller" className="hover:text-emerald-700 transition flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Seller Portal
            {currentUser?.role === 'custodian' || currentUser?.role === 'broker' ? (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            ) : null}
          </Link>

          <Link href="/admin" className="hover:text-purple-700 transition flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Admin Panel
          </Link>
        </nav>

        {/* User Account / Login Action */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 flex items-center justify-end gap-1">
                  {currentUser.name}
                  {currentUser.isVerified && (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 capitalize flex items-center justify-end gap-1">
                  <span>{currentUser.role}</span>
                  {currentUser.university && (
                    <span className="text-slate-400">• {currentUser.university}</span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition"
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
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700"
          >
            <Search className="w-4 h-4 text-emerald-600" />
            Explore Hostels
          </Link>
          <Link
            href="/seller"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            Seller Portal (Custodians & Brokers)
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Admin Panel (Verification & Merge Tool)
          </Link>
        </div>
      )}
    </header>
  );
}
