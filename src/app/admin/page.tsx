'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { Hostel } from '@/types';
import FaIcon from '@/components/FaIcon';

export default function AdminPanelPage() {
  const { currentUser, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'kpis' | 'merge' | 'reports' | 'hostels'>('kpis');

  // Data states
  const [hostels, setHostels] = useState<Hostel[]>([]);

  // Duplicate Merge Tool Form (FR-10.4)
  const [primaryHostelId, setPrimaryHostelId] = useState('');
  const [duplicateHostelId, setDuplicateHostelId] = useState('');
  const [mergeReason, setMergeReason] = useState('Duplicate physical building verified by admin');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeSuccessMsg, setMergeSuccessMsg] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      switchRole('admin');
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/v1/hostels');
      const data = await res.json();
      if (data.success) {
        setHostels(data.hostels);
        if (data.hostels.length >= 2) {
          setPrimaryHostelId(data.hostels[0].id);
          setDuplicateHostelId(data.hostels[1].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMergeHostels = async (e: React.FormEvent) => {
    e.preventDefault();
    if (primaryHostelId === duplicateHostelId) {
      alert('Primary hostel and duplicate hostel cannot be the same!');
      return;
    }

    if (!confirm('Are you sure you want to merge these two hostels? All offers, reviews, and lead history will be preserved into the primary hostel.')) {
      return;
    }

    setMergeLoading(true);
    setMergeSuccessMsg('');

    try {
      const res = await fetch('/api/v1/admin/duplicates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryHostelId,
          duplicateHostelId,
          adminId: currentUser?.id,
          reason: mergeReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setMergeSuccessMsg(data.message);
        loadData();
      } else {
        alert(data.error || 'Merge failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMergeLoading(false);
    }
  };

  const handleExportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Hostel Name,Campus,Area,Status,Rating,Available Rooms\n" +
      hostels.map(h => `"${h.name}","${h.campus}","${h.area}","${h.status}",${h.ratingAvg},${h.rooms.reduce((a,r)=>a+r.roomsAvailable,0)}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hostel_connect_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        
        {/* Admin Header (Solid #0f3a98 background, NO gradients) */}
        <div className="bg-[#0f3a98] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-blue-900">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded bg-[#0a2666] text-[#ffbe00] border border-blue-800">
                SuperAdmin Console
              </span>
              <span className="text-xs text-blue-200 font-medium">• Role-Based Access Control Active</span>
            </div>
            <h1 className="text-2xl font-medium mt-1 text-white">Hostel Marketplace Operations Panel</h1>
            <p className="text-xs text-blue-100 font-medium">
              Verify claims, merge duplicate building listings, moderate scam reports, and review MoMo finance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-[#0a2666] hover:bg-[#081e52] text-[#ffbe00] text-xs font-medium flex items-center gap-1.5 border border-blue-800 transition shadow-sm"
            >
              <FaIcon icon="fa-solid fa-download" className="text-xs" />
              Export CSV (FR-10.9)
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'kpis' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            Dashboard KPIs (FR-10.7)
          </button>
          <button
            onClick={() => setActiveTab('merge')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'merge' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FaIcon icon="fa-solid fa-code-merge" className="text-xs" />
            Duplicate Merge Tool (FR-10.4)
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'reports' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FaIcon icon="fa-solid fa-triangle-exclamation" className="text-xs" />
            Moderation Queue (FR-10.5)
          </button>
          <button
            onClick={() => setActiveTab('hostels')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'hostels' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            Manage Hostels (FR-10.3)
          </button>
        </div>

        {/* TAB 1: DASHBOARD KPIS */}
        {activeTab === 'kpis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-400 mb-1">Total Users by Role</div>
                <div className="text-2xl font-medium text-[#0f3a98]">4,820</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">4,200 Students • 480 Brokers • 140 Custodians</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-400 mb-1">Active Listings</div>
                <div className="text-2xl font-medium text-[#0f3a98]">{hostels.length} Hostels</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">38 Claimed & Verified</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-400 mb-1">Total Leads Recorded</div>
                <div className="text-2xl font-medium text-[#0f3a98]">12,480</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">WhatsApp & Call taps (FR-3.3)</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-400 mb-1">Semester MoMo Revenue</div>
                <div className="text-2xl font-medium text-[#0f3a98]">UGX 18.4M</div>
                <div className="text-[11px] text-[#0f3a98] font-medium mt-1">MTN & Airtel Collections</div>
              </div>
            </div>

            {/* Quick KPI Overview Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <h3 className="font-medium text-base text-[#0f3a98]">
                Intake Launch Readiness Matrix
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="font-medium text-[#0f3a98]">Makerere University (Kikoni Zone)</div>
                  <div className="text-slate-600 mt-1 font-medium">Target: 30-50 hostels (Risk Mitigation 13)</div>
                  <div className="text-[#0f3a98] font-medium text-sm mt-2">Status: 34 Signed Up (Ready)</div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-[#ffbe00]/60">
                  <div className="font-medium text-amber-950">MUBS (Nakawa Zone)</div>
                  <div className="text-amber-800 mt-1 font-medium">Scout onboarding in progress</div>
                  <div className="text-amber-950 font-medium text-sm mt-2">Status: 18 Hostels (On Track)</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-medium text-slate-900">Kyambogo (Banda Zone)</div>
                  <div className="text-slate-600 mt-1 font-medium">Initial mapping underway</div>
                  <div className="text-slate-900 font-medium text-sm mt-2">Status: 12 Hostels</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DUPLICATE MERGE TOOL */}
        {activeTab === 'merge' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#e8effc] text-[#0f3a98]">
                  FR-10.4 Specification
                </span>
                <span className="text-xs text-slate-500 font-medium">Audit-Logged Operation</span>
              </div>
              <h2 className="text-xl font-medium text-[#0f3a98] mt-1">
                Admin Duplicate Hostel Merge Tool
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-medium">
                Combines two duplicate physical building listings into one authoritative building entity while preserving all photos, student reviews, attached offers, and immutable lead history in an audit log.
              </p>
            </div>

            {mergeSuccessMsg && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-[#0f3a98] text-xs font-medium flex items-center gap-2">
                <FaIcon icon="fa-solid fa-circle-check" className="text-base text-[#0f3a98] shrink-0" />
                <span>{mergeSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleMergeHostels} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Target 1: Authoritative Primary Hostel */}
                <div className="p-5 rounded-2xl border-2 border-[#0f3a98] bg-[#e8effc]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#0f3a98] uppercase tracking-wider">
                      1. Master Hostel (To Keep)
                    </span>
                    <FaIcon icon="fa-solid fa-shield-halved" className="text-sm text-[#0f3a98]" />
                  </div>
                  <select
                    value={primaryHostelId}
                    onChange={e => setPrimaryHostelId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-blue-300 bg-white font-medium text-[#0f3a98]"
                  >
                    {hostels.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.area} - {h.campus})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 font-medium">
                    This building entry will be retained as the primary physical listing.
                  </p>
                </div>

                {/* Target 2: Duplicate Hostel to Absorb & Remove */}
                <div className="p-5 rounded-2xl border-2 border-rose-300 bg-rose-50/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-rose-800 uppercase tracking-wider">
                      2. Duplicate Entry (To Merge & Absorb)
                    </span>
                    <FaIcon icon="fa-solid fa-triangle-exclamation" className="text-sm text-rose-600" />
                  </div>
                  <select
                    value={duplicateHostelId}
                    onChange={e => setDuplicateHostelId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-rose-300 bg-white font-medium text-rose-900"
                  >
                    {hostels.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.area} - {h.campus})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 font-medium">
                    All offers, reviews, photos, and leads from this entry will be transferred to Master.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for Merge (Logged in Immutable Audit Trail)
                </label>
                <input
                  type="text"
                  required
                  value={mergeReason}
                  onChange={e => setMergeReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={mergeLoading || primaryHostelId === duplicateHostelId}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] font-medium text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FaIcon icon="fa-solid fa-code-merge" className="text-sm text-[#ffbe00]" />
                  {mergeLoading ? 'Executing Merge Algorithm...' : 'Execute Merge (FR-10.4)'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: MODERATION QUEUE */}
        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-medium text-[#0f3a98]">Scam & Inaccuracy Moderation Queue (FR-10.5)</h2>
              <p className="text-xs text-slate-500 font-medium">Student reports regarding fake listings, false pricing, or already occupied rooms</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      Wrong Price Flagged
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Reporter: +256 788 555 666</span>
                  </div>
                  <h4 className="font-medium text-slate-900 text-sm mt-1">Brian Kigozi on Dream World Hostel</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    "Broker quoted 1.2M on phone but listed at 1.3M on the app."
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert('Warning issued to broker. Recorded against 3-strike rule (BR-6).')}
                    className="px-3 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium"
                  >
                    Issue Strike
                  </button>
                  <button
                    onClick={() => alert('Report dismissed.')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MANAGE HOSTELS */}
        {activeTab === 'hostels' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-medium text-[#0f3a98]">Registered Hostel Buildings ({hostels.length})</h2>
            <div className="divide-y divide-slate-100">
              {hostels.map(h => (
                <div key={h.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-slate-900 text-sm">{h.name}</span>
                    <span className="text-slate-400 ml-2 font-medium">({h.area} • {h.campus})</span>
                    <div className="text-slate-500 text-[11px] mt-0.5 font-medium">
                      Status: <strong className="text-[#0f3a98]">{h.status}</strong> • Views: {h.viewCount} • Saves: {h.saveCount}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {h.status === 'unclaimed' && (
                      <button
                        onClick={() => {
                          h.status = 'claimed';
                          setHostels([...hostels]);
                          alert(`Hostel "${h.name}" marked as Custodian Claimed!`);
                        }}
                        className="px-3 py-1 bg-[#0f3a98] text-[#ffbe00] rounded font-medium"
                      >
                        Approve Owner Claim
                      </button>
                    )}
                    <button
                      onClick={() => alert(`Suspending ${h.name}`)}
                      className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-medium"
                    >
                      Suspend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
