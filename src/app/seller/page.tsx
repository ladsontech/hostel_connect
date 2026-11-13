'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { Hostel, SubscriptionPlan, UserSubscription } from '@/types';
import { formatUGX } from '@/lib/utils';
import FaIcon from '@/components/FaIcon';

export default function SellerPortalPage() {
  const { currentUser, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'analytics' | 'subscription' | 'add'>('listings');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Data states
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'today' | '7days' | 'semester'>('semester');
  const [selectedHostelForAnalytics, setSelectedHostelForAnalytics] = useState<string>('hst_olympia');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // New Hostel Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCampus, setFormCampus] = useState('Makerere University');
  const [formArea, setFormArea] = useState('Kikoni');
  const [formAddress, setFormAddress] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formLat, setFormLat] = useState('0.3345');
  const [formLng, setFormLng] = useState('32.5621');
  const [formAccessFee, setFormAccessFee] = useState('20000');
  const [formPhone, setFormPhone] = useState('+256 700 123 456');
  const [formSingleRent, setFormSingleRent] = useState('1200000');
  const [formDoubleRent, setFormDoubleRent] = useState('850000');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Duplicate Check Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [bypassReason, setBypassReason] = useState('');

  // Payment State
  const [selectedPlanId, setSelectedPlanId] = useState('plan_custodian_standard');
  const [momoPhone, setMomoPhone] = useState('+256 772 111 222');
  const [momoProvider, setMomoProvider] = useState<'mtn_momo' | 'airtel_money'>('mtn_momo');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Editing rooms
  const [editSingleRoomsAvailable, setEditSingleRoomsAvailable] = useState<number>(5);
  const [editDoubleRoomsAvailable, setEditDoubleRoomsAvailable] = useState<number>(10);
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    if (currentUser?.role === 'student') {
      switchRole('custodian');
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [hostelsRes, subRes] = await Promise.all([
        fetch('/api/v1/hostels'),
        fetch(`/api/v1/subscriptions?userId=${currentUser?.id || 'usr_custodian_olympia'}`)
      ]);
      const hData = await hostelsRes.json();
      const sData = await subRes.json();
      if (hData.success) setHostels(hData.hostels);
      if (sData.success) {
        setPlans(sData.plans);
        setSubscription(sData.subscription);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedHostelForAnalytics) return;
    try {
      const res = await fetch(`/api/v1/leads?hostelId=${selectedHostelForAnalytics}&timeframe=${analyticsTimeframe}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  useEffect(() => {
    loadAnalytics();
  }, [selectedHostelForAnalytics, analyticsTimeframe]);

  const handleAddHostel = async (e: React.FormEvent, forceBypass = false) => {
    e.preventDefault();
    setFormSubmitting(true);
    setDuplicateWarning(null);

    const payload = {
      name: formName,
      description: formDescription,
      campus: formCampus,
      area: formArea,
      address: formAddress || `${formArea}, near ${formLandmark}`,
      landmark: formLandmark,
      lat: parseFloat(formLat),
      lng: parseFloat(formLng),
      genderPolicy: 'mixed',
      amenities: ['water', 'security', 'wifi', 'power_backup'],
      sellerId: currentUser?.id || 'usr_custodian_olympia',
      sellerRole: currentUser?.role || 'custodian',
      contactPhone: formPhone,
      whatsapp: formPhone,
      accessFeeUgx: parseInt(formAccessFee) || 0,
      rooms: [
        { name: 'Single Room', type: 'single', rentUgx: parseInt(formSingleRent) || 1000000, roomsTotal: 30, roomsAvailable: 5 },
        { name: 'Double Shared', type: 'double', rentUgx: parseInt(formDoubleRent) || 750000, roomsTotal: 50, roomsAvailable: 12 }
      ],
      forceCreate: forceBypass,
      duplicateBypassReason: bypassReason
    };

    try {
      const res = await fetch('/api/v1/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.status === 409 && data.duplicateDetected) {
        setDuplicateWarning(data);
      } else if (data.success) {
        alert(`Hostel "${data.hostel.name}" added successfully!`);
        setHostels(prev => [data.hostel, ...prev]);
        setActiveTab('listings');
        setFormName('');
        setFormDescription('');
        setBypassReason('');
      } else {
        alert(data.error || 'Failed to add hostel');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateRooms = async (hostelId: string) => {
    try {
      const res = await fetch(`/api/v1/hostels/${hostelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          userRole: currentUser?.role,
          rooms: [
            { name: 'Single Room', type: 'single', rentUgx: 1200000, roomsTotal: 30, roomsAvailable: editSingleRoomsAvailable },
            { name: 'Double Room', type: 'double', rentUgx: 850000, roomsTotal: 50, roomsAvailable: editDoubleRoomsAvailable }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        setUpdateMsg('Rooms availability updated and synchronized across all broker listings.');
        setTimeout(() => setUpdateMsg(''), 3000);
        loadData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleProcessMomoPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setPaymentSuccessMsg('');

    try {
      const res = await fetch('/api/v1/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'usr_custodian_olympia',
          planId: selectedPlanId,
          provider: momoProvider,
          phone: momoPhone,
          hostelId: selectedHostelForAnalytics
        })
      });
      const data = await res.json();
      if (data.success) {
        setPaymentSuccessMsg(data.message);
        setSubscription(data.subscription);
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onOpenAuth={(mode) => {
        setAuthMode(mode || 'login');
        setIsAuthOpen(true);
      }} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        
        {/* Top Seller Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded ${
                currentUser?.role === 'custodian' ? 'bg-[#e8effc] text-[#0f3a98]' : 'bg-amber-100 text-amber-900'
              }`}>
                {currentUser?.role === 'custodian' ? 'Custodian Dashboard' : 'Campus Scout / Broker Dashboard'}
              </span>
              <span className="text-xs text-slate-400 font-medium">• Semester Intake Management</span>
            </div>
            <h1 className="text-2xl font-medium text-[#0f3a98] mt-1">
              {currentUser?.businessName || currentUser?.name || 'Seller Hub'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {currentUser?.role === 'custodian'
                ? 'Authoritative owner portal: control room vacancy, approve brokers, and view direct inquiries.'
                : 'Campus scout portal: attach verified offers, disclose viewing fees, and track student leads.'}
            </p>
          </div>

          {/* Quick tab switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-3 py-2 rounded-lg transition ${
                activeTab === 'listings' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Listings
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-2 rounded-lg transition ${
                activeTab === 'analytics' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lead Analytics
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-3 py-2 rounded-lg transition ${
                activeTab === 'subscription' ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Subscription & MoMo
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-2 rounded-lg bg-[#ffbe00] text-[#0f3a98] font-medium transition flex items-center gap-1.5 shadow-sm`}
            >
              <FaIcon icon="fa-solid fa-plus" className="text-xs" />
              Add Hostel
            </button>
          </div>
        </div>

        {/* TAB 1: LISTINGS & INVENTORY MANAGEMENT */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-[#0f3a98]">Active Accommodations</h2>
                <p className="text-xs text-slate-500 font-medium">Update vacancy numbers or manage room rents</p>
              </div>
            </div>

            {updateMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-[#0f3a98] text-xs font-medium rounded-xl flex items-center gap-2">
                <FaIcon icon="fa-solid fa-circle-check" className="text-[#0f3a98]" />
                <span>{updateMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hostels.map(hostel => {
                const totalRooms = hostel.rooms.reduce((acc, r) => acc + r.roomsTotal, 0);
                const availableRooms = hostel.rooms.reduce((acc, r) => acc + r.roomsAvailable, 0);

                return (
                  <div key={hostel.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#e8effc] text-[#0f3a98]">
                            {hostel.status === 'claimed' ? 'Verified Owner' : 'Unclaimed'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{hostel.area}</span>
                        </div>
                        <h3 className="text-lg font-medium text-[#0f3a98] mt-1">{hostel.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{hostel.distanceCampusApprox}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-[#0f3a98] font-medium text-lg">
                          {availableRooms} / {totalRooms}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">Rooms Vacant</div>
                      </div>
                    </div>

                    {/* Room inventory quick editor */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                        <span>Room Types & Availability</span>
                        <span className="text-slate-400">BR-1: Owner sets vacancy</span>
                      </div>

                      {hostel.rooms.map(room => (
                        <div key={room.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50">
                          <div>
                            <span className="font-medium text-slate-800">{room.name}</span>
                            <span className="text-slate-500 ml-2">({formatUGX(room.rentUgx)})</span>
                          </div>
                          <span className="font-medium text-[#0f3a98] bg-white px-2 py-0.5 rounded border border-slate-200">
                            {room.roomsAvailable} left
                          </span>
                        </div>
                      ))}

                      {currentUser?.role === 'custodian' ? (
                        <div className="pt-2 flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Single vacant"
                            className="w-28 px-2.5 py-1 text-xs border rounded bg-white font-medium"
                            onChange={e => setEditSingleRoomsAvailable(parseInt(e.target.value) || 0)}
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Double vacant"
                            className="w-28 px-2.5 py-1 text-xs border rounded bg-white font-medium"
                            onChange={e => setEditDoubleRoomsAvailable(parseInt(e.target.value) || 0)}
                          />
                          <button
                            onClick={() => handleUpdateRooms(hostel.id)}
                            className="px-3 py-1 bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium rounded transition"
                          >
                            Update Vacancy
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded font-medium">
                          ⚠️ As a Broker, room rent and total vacancy are managed by the hostel owner (BR-1). You can set your custom access fee.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SELLER ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-[#0f3a98]">Student Inquiries & Leads (FR-9.1)</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Track real students reaching your listings via WhatsApp, phone calls, and saves
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedHostelForAnalytics}
                  onChange={e => setSelectedHostelForAnalytics(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium bg-white text-[#0f3a98]"
                >
                  {hostels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>

                <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-medium">
                  {(['today', '7days', 'semester'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setAnalyticsTimeframe(t)}
                      className={`px-2.5 py-1 rounded transition capitalize ${
                        analyticsTimeframe === t ? 'bg-[#0f3a98] text-[#ffbe00] shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {t === '7days' ? 'Last 7 Days' : t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metric KPI cards with FontAwesome Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium text-slate-500">Listing Views</span>
                  <FaIcon icon="fa-solid fa-eye" className="text-sm text-[#0f3a98]" />
                </div>
                <div className="text-2xl font-medium text-[#0f3a98]">
                  {analyticsData?.views || 1420}
                </div>
                <div className="text-[11px] text-[#0f3a98] font-medium mt-1">↑ 18% this week</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium text-slate-500">WhatsApp Inquiries</span>
                  <FaIcon icon="fa-brands fa-whatsapp" className="text-base text-[#ffbe00]" />
                </div>
                <div className="text-2xl font-medium text-[#0f3a98]">
                  {analyticsData?.whatsAppTaps || 48}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">Direct wa.me chats</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium text-slate-500">Phone Calls</span>
                  <FaIcon icon="fa-solid fa-phone" className="text-sm text-[#0f3a98]" />
                </div>
                <div className="text-2xl font-medium text-[#0f3a98]">
                  {analyticsData?.calls || 26}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">Direct dial attempts</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium text-slate-500">Student Saves</span>
                  <FaIcon icon="fa-solid fa-heart" className="text-sm text-rose-500" />
                </div>
                <div className="text-2xl font-medium text-[#0f3a98]">
                  {analyticsData?.saves || 312}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium">Added to shortlists</div>
              </div>
            </div>

            {/* FR-9.2 Weekly Summary Banner */}
            <div className="p-4 rounded-2xl bg-[#e8effc] border border-blue-200 flex items-center gap-3">
              <FaIcon icon="fa-solid fa-wand-magic-sparkles" className="text-lg text-[#ffbe00] shrink-0" />
              <div>
                <h4 className="font-medium text-sm text-[#0f3a98]">Weekly Performance Summary (FR-9.2)</h4>
                <p className="text-xs text-slate-700 mt-0.5 font-medium">
                  "Your hostel received <strong>{analyticsData?.views || 1420} views</strong> and <strong>{(analyticsData?.whatsAppTaps || 48) + (analyticsData?.calls || 26)} direct enquiries</strong> this week. Availability confirmed 2 days ago."
                </p>
              </div>
            </div>

            {/* FR-9.3 Broker Breakdown for Custodians */}
            {currentUser?.role === 'custodian' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                <h3 className="text-base font-medium text-[#0f3a98]">Broker Agent Contribution (FR-9.3)</h3>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FaIcon icon="fa-solid fa-users" className="text-xs text-[#0f3a98]" />
                      <span className="font-medium text-slate-800">Brian Kigozi (Campus Scout)</span>
                      <span className="bg-[#ffbe00] text-[#0f3a98] px-1.5 py-0.5 rounded text-[10px] font-medium">Authorised</span>
                    </div>
                    <div className="font-medium text-[#0f3a98]">22 Student Inquiries Driven</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBSCRIPTION & MOMO PAYMENT */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#e8effc] text-[#0f3a98]">
                    FR-6.1 to FR-6.6 Specifications
                  </span>
                  <h2 className="text-xl font-medium text-[#0f3a98] mt-1">Per-Semester Subscription</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Hostel Connect collects semester subscriptions from sellers. Students are never charged.
                  </p>
                </div>

                {subscription ? (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    subscription.status === 'active' ? 'bg-[#0f3a98] text-[#ffbe00]' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {subscription.isTrial ? 'Free Trial Active' : 'Semester Pass Active'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#ffbe00] text-[#0f3a98]">
                    30-Day Free Trial
                  </span>
                )}
              </div>

              {paymentSuccessMsg && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[#0f3a98] text-xs font-medium flex items-center gap-2">
                  <FaIcon icon="fa-solid fa-circle-check" className="text-[#0f3a98]" />
                  <span>{paymentSuccessMsg}</span>
                </div>
              )}

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {plans.map(plan => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#0f3a98] bg-[#e8effc] ring-2 ring-[#0f3a98]'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-medium text-slate-500 uppercase">{plan.role}</div>
                        <h3 className="font-medium text-slate-900 text-base mt-1">{plan.name}</h3>
                        <div className="text-2xl font-medium text-[#0f3a98] mt-2">
                          {formatUGX(plan.priceUgx)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">per semester (120 days)</div>

                        <ul className="mt-4 space-y-1.5 text-xs text-slate-700 font-medium">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <FaIcon icon="fa-solid fa-circle-check" className="text-xs text-[#0f3a98] shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 text-center">
                        <span className={`text-xs font-medium ${isSelected ? 'text-[#0f3a98]' : 'text-slate-500'}`}>
                          {isSelected ? '✓ Plan Selected' : 'Tap to Select'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MTN MoMo & Airtel Money Checkout Form */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="font-medium text-[#0f3a98] text-base mb-1">
                  Pay via Mobile Money (MTN MoMo / Airtel Money)
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  Aggregator instant push prompt simulation (Flutterwave / Pesapal / Yo! Payments)
                </p>

                <form onSubmit={handleProcessMomoPayment} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Payment Provider</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMomoProvider('mtn_momo')}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                          momoProvider === 'mtn_momo'
                            ? 'border-[#ffbe00] bg-[#fff9e6] text-[#0f3a98] ring-2 ring-[#ffbe00]'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <img
                          src="/MTN%20mobile%20money.png"
                          alt="MTN MoMo"
                          className="h-5 w-auto object-contain rounded-sm shrink-0"
                        />
                        MTN MoMo
                      </button>
                      <button
                        type="button"
                        onClick={() => setMomoProvider('airtel_money')}
                        className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                          momoProvider === 'airtel_money'
                            ? 'border-rose-400 bg-rose-50 text-rose-900 ring-2 ring-rose-400'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <img
                          src="/Airtel%20mobile%20money.jpg"
                          alt="Airtel Money"
                          className="w-5 h-5 object-cover rounded-sm shrink-0"
                        />
                        Airtel Money
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Money Number</label>
                    <input
                      type="text"
                      required
                      value={momoPhone}
                      onChange={e => setMomoPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={paymentProcessing}
                      className="w-full py-2.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] text-xs font-medium shadow-sm transition"
                    >
                      {paymentProcessing ? 'Sending MoMo Prompt...' : 'Pay Subscription via MoMo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADD HOSTEL WITH DUPLICATE DETECTION */}
        {activeTab === 'add' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#e8effc] text-[#0f3a98]">
                  Section 5 Specification
                </span>
                <span className="text-xs text-slate-500 font-medium">Duplicate Prevention Protected</span>
              </div>
              <h2 className="text-xl font-medium text-[#0f3a98] mt-1">List a New Campus Hostel</h2>
              <p className="text-xs text-slate-500 font-medium">
                A hostel exists once per physical building. If an existing building matches your submission, you will attach as an offer.
              </p>
            </div>

            {duplicateWarning && (
              <div className="p-5 rounded-2xl bg-amber-50 border-2 border-[#ffbe00] space-y-4">
                <div className="flex items-start gap-3">
                  <FaIcon icon="fa-solid fa-triangle-exclamation" className="text-amber-700 text-lg shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-medium text-amber-950">
                      Duplicate Detected: Is this the same hostel? (Section 5)
                    </h3>
                    <p className="text-xs text-amber-900 mt-1 font-medium">
                      Our duplicate prevention engine detected high similarity with an existing registered building:
                    </p>
                    <ul className="mt-2 list-disc list-inside text-xs font-medium text-amber-950 space-y-1">
                      {duplicateWarning.matchReasons?.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {duplicateWarning.matchedHostel && (
                  <div className="p-4 rounded-xl bg-white border border-amber-200 flex items-center gap-3">
                    <img
                      src={duplicateWarning.matchedHostel.photos[0]?.url}
                      alt="Match"
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-medium text-sm text-slate-900">
                        {duplicateWarning.matchedHostel.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {duplicateWarning.matchedHostel.area} • {duplicateWarning.matchedHostel.campus}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t border-amber-200">
                  <p className="text-xs text-amber-950 font-medium">
                    If this is a brand new separate building, enter a reason for admin review:
                  </p>
                  <textarea
                    rows={2}
                    placeholder="Explain why this building is different..."
                    value={bypassReason}
                    onChange={e => setBypassReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-[#0f3a98] bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-amber-100 hover:bg-amber-200"
                    >
                      Yes, it is the same (Cancel new)
                    </button>
                    <button
                      type="button"
                      disabled={!bypassReason.trim() || formSubmitting}
                      onClick={(e) => handleAddHostel(e, true)}
                      className="px-4 py-1.5 rounded-lg bg-[#0f3a98] text-[#ffbe00] text-xs font-medium shadow-sm transition disabled:opacity-50"
                    >
                      No, submit with reason for Admin Review
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={e => handleAddHostel(e, false)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Hostel Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Olympia Hostel Kikoni"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0f3a98]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">University Campus</label>
                  <select
                    value={formCampus}
                    onChange={e => setFormCampus(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-medium text-slate-700"
                  >
                    <option>Makerere University</option>
                    <option>MUBS</option>
                    <option>Kyambogo University</option>
                    <option>Uganda Christian University</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe amenities, backup power, water reservoirs, security, distance..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Area / Neighborhood</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kikoni"
                    value={formArea}
                    onChange={e => setFormArea(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prominent Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Caltec Academy"
                    value={formLandmark}
                    onChange={e => setFormLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Room Rent & Broker access fee fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Single Room Rent (UGX)</label>
                  <input
                    type="number"
                    value={formSingleRent}
                    onChange={e => setFormSingleRent(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Double Room Rent (UGX)</label>
                  <input
                    type="number"
                    value={formDoubleRent}
                    onChange={e => setFormDoubleRent(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Broker Access Fee (FR-4.4)
                  </label>
                  <input
                    type="number"
                    placeholder="0 or positive UGX"
                    value={formAccessFee}
                    onChange={e => setFormAccessFee(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-3 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] font-medium text-sm shadow-md transition"
              >
                {formSubmitting ? 'Running Duplicate Checks...' : 'Verify & Publish Listing'}
              </button>
            </form>
          </div>
        )}

      </main>

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
      />

      <Footer />
    </div>
  );
}
