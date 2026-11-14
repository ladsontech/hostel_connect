'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { Hostel } from '@/types';
import FaIcon from '@/components/FaIcon';
import BoundedSelect from '@/components/BoundedSelect';

export default function AdminPanelPage() {
  const { currentUser, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'kpis' | 'merge' | 'reports' | 'hostels'>('kpis');

  // Data states
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [adminActionMsg, setAdminActionMsg] = useState('');
  const [moderatingId, setModeratingId] = useState<string | null>(null);

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
      const res = await fetch('/api/v1/hostels?includeUnapproved=true');
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

  const handleModerateHostel = async (
    hostelId: string,
    updates: { approvalStatus?: 'pending' | 'approved' | 'rejected'; status?: 'claimed' | 'unclaimed' | 'suspended' },
    successText: string
  ) => {
    setModeratingId(hostelId);
    setAdminActionMsg('');
    try {
      const res = await fetch(`/api/v1/hostels/${hostelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_admin_1',
          userRole: 'admin',
          ...updates,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setHostels(prev => prev.map(h => (h.id === hostelId ? data.hostel : h)));
        setAdminActionMsg(successText);
      } else {
        alert(data.error || 'Failed to update hostel status');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setModeratingId(null);
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
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'hostels' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Manage Hostels (FR-10.3)</span>
            {hostels.filter(h => h.approvalStatus === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-[#ffbe00] text-[#0f3a98]">
                {hostels.filter(h => h.approvalStatus === 'pending').length} Pending
              </span>
            )}
          </button>
        </div>

        {adminActionMsg && (
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0f3a98] text-xs font-medium flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FaIcon icon="fa-solid fa-circle-check" className="text-sm text-[#0f3a98]" />
              <span>{adminActionMsg}</span>
            </div>
            <button onClick={() => setAdminActionMsg('')} className="text-slate-400 hover:text-slate-600">
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: DASHBOARD KPIS */}
        {activeTab === 'kpis' && (
          <div className="space-y-6">
            {hostels.filter(h => h.approvalStatus === 'pending').length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-[#ffbe00] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <FaIcon icon="fa-solid fa-clock" className="text-amber-700 text-lg mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-amber-950">
                      {hostels.filter(h => h.approvalStatus === 'pending').length} Hostel Upload(s) Awaiting Admin Approval
                    </div>
                    <p className="text-xs text-amber-800 font-medium mt-0.5">
                      Broker-uploaded hostels stay hidden from public student search until approved by an Admin.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('hostels')}
                  className="px-4 py-2 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] text-xs font-medium shrink-0 transition"
                >
                  Review &amp; Approve Hostels
                </button>
              </div>
            )}
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
                  <BoundedSelect
                    value={primaryHostelId}
                    onChange={setPrimaryHostelId}
                    className="text-sm"
                    buttonClassName="border-blue-300"
                    options={hostels.map(h => ({
                      value: h.id,
                      label: `${h.name} (${h.area} - ${h.campus})`,
                    }))}
                  />
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
                  <BoundedSelect
                    value={duplicateHostelId}
                    onChange={setDuplicateHostelId}
                    className="text-sm"
                    buttonClassName="border-rose-300"
                    options={hostels.map(h => ({
                      value: h.id,
                      label: `${h.name} (${h.area} - ${h.campus})`,
                    }))}
                  />
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
        {activeTab === 'hostels' && (() => {
          const pendingHostels = hostels.filter(h => h.approvalStatus === 'pending');
          const sortedHostels = [...hostels].sort((a, b) => {
            const rank = (h: Hostel) => (h.approvalStatus === 'pending' ? 0 : h.approvalStatus === 'rejected' ? 1 : 2);
            return rank(a) - rank(b);
          });

          return (
          <div className="space-y-5">
            {pendingHostels.length > 0 && (
              <div className="bg-amber-50/70 p-5 sm:p-6 rounded-2xl border-2 border-[#ffbe00] shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-medium text-[#0f3a98]">
                      Pending Broker Hostel Approvals ({pendingHostels.length})
                    </h2>
                    <p className="text-xs text-amber-900 font-medium">
                      Review newly uploaded hostels before they become visible on the student marketplace.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {pendingHostels.map(h => {
                    const photoCount = h.photos.filter(p => p.mediaType !== 'video').length;
                    const videoCount = h.photos.filter(p => p.mediaType === 'video').length;
                    return (
                      <div
                        key={h.id}
                        className="p-4 rounded-xl bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#ffbe00] text-white border border-[#ffbe00]">
                              Pending Approval
                            </span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#e8effc] text-[#0f3a98]">
                              {photoCount} Photos • {videoCount} Videos
                            </span>
                          </div>
                          <div className="font-medium text-slate-900 text-sm mt-1">
                            {h.name}{' '}
                            <span className="text-slate-400 font-normal">({h.area} • {h.campus})</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{h.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            disabled={moderatingId === h.id}
                            onClick={() =>
                              handleModerateHostel(
                                h.id,
                                { approvalStatus: 'approved' },
                                `Approved "${h.name}" — now live for students!`
                              )
                            }
                            className="px-3.5 py-2 bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] rounded-lg text-xs font-medium transition disabled:opacity-50"
                          >
                            Approve Hostel
                          </button>
                          <button
                            disabled={moderatingId === h.id}
                            onClick={() =>
                              handleModerateHostel(
                                h.id,
                                { approvalStatus: 'rejected' },
                                `Rejected "${h.name}". Broker can still see and edit it in their portal.`
                              )
                            }
                            className="px-3 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-medium text-[#0f3a98]">Registered Hostel Buildings ({hostels.length})</h2>
              <div className="divide-y divide-slate-100">
                {sortedHostels.map(h => {
                  const approval = h.approvalStatus || 'approved';
                  return (
                  <div key={h.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900 text-sm">{h.name}</span>
                        <span className="text-slate-400 font-medium">({h.area} • {h.campus})</span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            approval === 'pending'
                              ? 'bg-[#ffbe00] text-white border border-[#ffbe00]'
                              : approval === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {approval === 'pending'
                            ? 'Pending Approval'
                            : approval === 'rejected'
                              ? 'Rejected'
                              : 'Admin Approved'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-1 font-medium">
                        Ownership: <strong className="text-[#0f3a98]">{h.status}</strong> • Views: {h.viewCount} • Saves: {h.saveCount}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {approval !== 'approved' && (
                        <button
                          disabled={moderatingId === h.id}
                          onClick={() =>
                            handleModerateHostel(
                              h.id,
                              { approvalStatus: 'approved' },
                              `Approved "${h.name}" — now visible in student search.`
                            )
                          }
                          className="px-3 py-1 bg-[#0f3a98] text-[#ffbe00] rounded font-medium disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {approval === 'pending' && (
                        <button
                          disabled={moderatingId === h.id}
                          onClick={() =>
                            handleModerateHostel(
                              h.id,
                              { approvalStatus: 'rejected' },
                              `Marked "${h.name}" as rejected.`
                            )
                          }
                          className="px-2.5 py-1 text-rose-700 border border-rose-200 hover:bg-rose-50 rounded font-medium disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      {h.status === 'unclaimed' && (
                        <button
                          disabled={moderatingId === h.id}
                          onClick={() =>
                            handleModerateHostel(
                              h.id,
                              { status: 'claimed', approvalStatus: 'approved' },
                              `Hostel "${h.name}" marked as Custodian Claimed & Approved.`
                            )
                          }
                          className="px-3 py-1 border border-[#0f3a98] text-[#0f3a98] hover:bg-blue-50 rounded font-medium disabled:opacity-50"
                        >
                          Approve Owner Claim
                        </button>
                      )}
                      {h.status !== 'suspended' ? (
                        <button
                          disabled={moderatingId === h.id}
                          onClick={() =>
                            handleModerateHostel(
                              h.id,
                              { status: 'suspended' },
                              `Suspended "${h.name}".`
                            )
                          }
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded font-medium disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          disabled={moderatingId === h.id}
                          onClick={() =>
                            handleModerateHostel(
                              h.id,
                              { status: 'unclaimed' },
                              `Restored "${h.name}".`
                            )
                          }
                          className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded font-medium disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
          );
        })()}

      </main>

      <Footer />
    </div>
  );
}
