'use client';

import React, { useState, useEffect } from 'react';
import { Hostel, Offer } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { formatUGX, getPhoneDialerLink, getWhatsAppDeepLink } from '@/lib/utils';
import FaIcon from './FaIcon';

interface ContactModalProps {
  hostel: Hostel;
  offers: Offer[];
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
}

export default function ContactModal({
  hostel,
  offers,
  isOpen,
  onClose,
  onRequireAuth
}: ContactModalProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const [acknowledgedOffers, setAcknowledgedOffers] = useState<Record<string, boolean>>({});
  const [brokerNoticePending, setBrokerNoticePending] = useState<Offer | null>(null);

  // Connection Fee State (UGX 5,000)
  const CONNECTION_FEE_UGX = 5000;
  const [unlockedHostels, setUnlockedHostels] = useState<string[]>([]);
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [momoPhone, setMomoPhone] = useState('');
  const [isPayingFee, setIsPayingFee] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'prompting' | 'paid'>('form');
  const [paymentRef, setPaymentRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Broker / Connection searching animation state (runs for EVERY hostel before revealing price & contact)
  const [brokerSearchState, setBrokerSearchState] = useState<'searching' | 'matched'>('searching');
  const [searchStep, setSearchStep] = useState(0);
  const [matchedBrokerIndex, setMatchedBrokerIndex] = useState(0);

  const verifiedBrokers = [
    {
      name: 'Brian Mukasa',
      title: 'Senior Campus Scout',
      phone: '+256701234567',
      whatsapp: '256701234567',
      rating: 4.9,
      reviews: 142,
      distance: '320m away',
      eta: 'Arrives in ~8 mins',
      accessFeeUgx: 10000,
      verifiedId: 'SCOUT-UG-8821',
      campus: hostel?.campus || 'Makerere University',
      area: hostel?.area || 'Kikoni'
    },
    {
      name: 'Brenda Ainembabye',
      title: 'Lead Student Guide',
      phone: '+256772345678',
      whatsapp: '256772345678',
      rating: 4.8,
      reviews: 98,
      distance: '450m away',
      eta: 'Arrives in ~12 mins',
      accessFeeUgx: 10000,
      verifiedId: 'SCOUT-UG-5419',
      campus: hostel?.campus || 'Makerere University',
      area: hostel?.area || 'Kikoni'
    },
    {
      name: 'Ronald Ssempa',
      title: 'Vetted Area Coordinator',
      phone: '+256705678901',
      whatsapp: '256705678901',
      rating: 4.9,
      reviews: 175,
      distance: '500m away',
      eta: 'Arrives in ~15 mins',
      accessFeeUgx: 5000,
      verifiedId: 'SCOUT-UG-9102',
      campus: hostel?.campus || 'Makerere University',
      area: hostel?.area || 'Kikoni'
    }
  ];

  // Load unlocked hostels from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hostel_connect_unlocked');
      if (saved) {
        setUnlockedHostels(JSON.parse(saved));
      }
    } catch (e) {
      // fallback
    }
  }, []);

  const isUnlocked = hostel ? unlockedHostels.includes(hostel.id) : false;
  const hostelOffers = hostel ? offers.filter(o => o.hostelId === hostel.id) : [];
  // Strictly ONLY hostels added/claimed by custodians get the Official Custodian Listing screen
  const hasCustodian = hostel ? hostel.status === 'claimed' : false;

  // Fixed semester price matching the listing card (no ambiguous ranges)
  const minRentUgx = hostel?.rooms?.length ? Math.min(...hostel.rooms.map(r => r.rentUgx)) : 0;
  const roomPriceLabel = minRentUgx > 0 ? formatUGX(minRentUgx) : 'Contact for rate';

  // If uploaded by custodian, strictly NO brokers are shown since the student approaches the hostel themselves directly!
  const effectiveOffers: Offer[] = (hostel && hasCustodian)
    ? (hostelOffers.filter(o => o.userRole === 'custodian').length > 0
        ? hostelOffers.filter(o => o.userRole === 'custodian')
        : [
            {
              id: `off_${hostel.id}_custodian`,
              hostelId: hostel.id,
              userId: hostel.verifiedOwnerId || 'usr_custodian',
              userName: 'Official Hostel Warden / Custodian',
              userRole: 'custodian' as const,
              isVerified: true,
              isAuthorised: true,
              accessFeeUgx: 0,
              contactPhone: '+256701333444',
              whatsapp: '+256701333444',
              status: 'active',
              notes: 'Official Management Desk. Approach desk directly for physical room allocation.',
              createdAt: new Date().toISOString(),
              responseRatePct: 98
            }
          ])
    : hostelOffers.filter(o => o.userRole === 'broker');

  // Run the live searching-for-broker animation for EVERY hostel whenever the modal opens (unless already unlocked)
  useEffect(() => {
    if (!isOpen || !hostel) return;

    setPaymentStep('form');
    setErrorMsg('');
    setBrokerNoticePending(null);

    let alreadyUnlocked = unlockedHostels.includes(hostel.id);
    if (!alreadyUnlocked) {
      try {
        const saved = localStorage.getItem('hostel_connect_unlocked');
        if (saved) {
          const parsed: string[] = JSON.parse(saved);
          alreadyUnlocked = Array.isArray(parsed) && parsed.includes(hostel.id);
        }
      } catch (e) {
        // ignore
      }
    }

    if (alreadyUnlocked) {
      setBrokerSearchState('matched');
      setSearchStep(3);
      return;
    }

    setBrokerSearchState('searching');
    setSearchStep(0);

    const step1 = setTimeout(() => setSearchStep(1), 650);
    const step2 = setTimeout(() => setSearchStep(2), 1350);
    const step3 = setTimeout(() => setSearchStep(3), 2050);
    const finish = setTimeout(() => {
      setBrokerSearchState('matched');
    }, 2700);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(finish);
    };
  }, [isOpen, hostel?.id]);

  if (!isOpen || !hostel) return null;

  const triggerManualBrokerSearch = () => {
    setMatchedBrokerIndex((prev) => (prev + 1) % verifiedBrokers.length);
    setBrokerSearchState('searching');
    setSearchStep(0);
    setTimeout(() => setSearchStep(1), 550);
    setTimeout(() => setSearchStep(2), 1150);
    setTimeout(() => setSearchStep(3), 1750);
    setTimeout(() => setBrokerSearchState('matched'), 2350);
  };

  const handlePayConnectionFee = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!momoPhone.trim() || momoPhone.replace(/\D/g, '').length < 9) {
      setErrorMsg('Please enter a valid Ugandan phone number.');
      return;
    }

    setIsPayingFee(true);
    setPaymentStep('prompting');

    // Simulate USSD MoMo deduction after 2.8s
    setTimeout(() => {
      const generatedRef = `MOMO-CONN-${Math.floor(100000 + Math.random() * 900000)}`;
      setPaymentRef(generatedRef);

      const nextUnlocked = unlockedHostels.includes(hostel.id)
        ? unlockedHostels
        : [...unlockedHostels, hostel.id];
      setUnlockedHostels(nextUnlocked);
      try {
        localStorage.setItem('hostel_connect_unlocked', JSON.stringify(nextUnlocked));
      } catch (err) {}

      setIsPayingFee(false);
      setPaymentStep('paid');
    }, 2800);
  };

  const handleLogLead = async (offer: Offer, type: 'call' | 'whatsapp') => {
    if (!currentUser) return;

    try {
      await fetch('/api/v1/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser.id,
          studentName: currentUser.name,
          studentPhone: currentUser.phone,
          hostelId: hostel.id,
          offerId: offer.id,
          type
        })
      });
    } catch (e) {
      console.error('Lead log failed', e);
    }
  };

  const handleInitiateAction = (offer: Offer, actionType: 'call' | 'whatsapp') => {
    if (!isAuthenticated || !currentUser) {
      onRequireAuth();
      return;
    }

    if (offer.userRole === 'broker' && !acknowledgedOffers[offer.id]) {
      setBrokerNoticePending(offer);
      return;
    }

    handleLogLead(offer, actionType);

    if (actionType === 'call') {
      window.location.href = getPhoneDialerLink(offer.contactPhone);
    } else {
      const msg = offer.userRole === 'custodian'
        ? `Hello ${offer.userName}, I saw your official listing for student rooms in ${hostel.area} near ${hostel.campus} on Hostel Connect Uganda. Is there an available room?`
        : `Hello ${offer.userName}, I saw the student rooms in ${hostel.area} near ${hostel.campus} on Hostel Connect Uganda. Can you trek with me for an in-person room viewing?`;
      window.open(getWhatsAppDeepLink(offer.whatsapp, msg), '_blank');
    }
  };

  const confirmBrokerNotice = () => {
    if (brokerNoticePending) {
      setAcknowledgedOffers(prev => ({ ...prev, [brokerNoticePending.id]: true }));
      setBrokerNoticePending(null);
    }
  };

  const activeScout = verifiedBrokers[matchedBrokerIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header (Shields actual hostel name until unlocked) */}
        <div className="relative p-4 sm:p-5 border-b border-blue-100 bg-[#e8effc]/50 text-center">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#0f3a98] hover:bg-[#0a2666] text-white flex items-center justify-center transition shadow-sm"
          >
            <FaIcon icon="fa-solid fa-xmark" className="text-xs text-white" />
          </button>

          <div className="min-w-0 flex flex-col items-center px-8">
            <span className="text-xs text-slate-600 font-medium truncate">{hostel.campus}</span>
            <h3 className="font-semibold text-[#0f3a98] text-base sm:text-lg mt-1 leading-snug text-center">
              Verified Student Accommodation • {hostel.area}
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5 text-center max-w-md">
              {hasCustodian
                ? 'Direct connection to official hostel management desk. 100% money-back guarantee.'
                : 'A verified campus broker will physically trek with you to inspect rooms and introduce you to the caretaker desk.'}
            </p>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {brokerNoticePending && (
            <div className="p-4 rounded-xl bg-[#ffbe00]/10 border-2 border-[#ffbe00] text-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <FaIcon icon="fa-solid fa-triangle-exclamation" className="text-[#0f3a98] text-lg shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-[#0f3a98]">Important Broker Notice</h4>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    This broker charges a viewing / trekking fee of{' '}
                    <strong className="font-semibold text-[#0f3a98]">
                      {brokerNoticePending.accessFeeUgx > 0
                        ? formatUGX(brokerNoticePending.accessFeeUgx)
                        : 'No fee'}
                    </strong>
                    . Hostel semester rent is set by the hostel owner.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Hostel Connect never handles deposit or semester rent payments.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setBrokerNoticePending(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBrokerNotice}
                  className="px-4 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium transition shadow-sm"
                >
                  I Understand & Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Live Broker / Connection Search Animation (Shown for EVERY hostel before displaying price) */}
          {brokerSearchState === 'searching' ? (
            <div className="py-6 px-2 text-center space-y-5 flex flex-col items-center justify-center font-sans">
              {/* Theme Radar Pulse Animation Container */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Concentric theme radar rings */}
                <span className="absolute w-28 h-28 rounded-full bg-[#0f3a98]/10 animate-ping duration-1000" />
                <span className="absolute w-20 h-20 rounded-full bg-[#ffbe00]/25 animate-pulse duration-700" />
                <span className="absolute w-24 h-24 rounded-full border-2 border-dashed border-[#ffbe00] animate-spin duration-3000" />

                {/* Center Core Icon */}
                <div className="relative w-14 h-14 rounded-full bg-[#0f3a98] text-white flex items-center justify-center shadow-lg border-2 border-[#ffbe00] z-10">
                  <FaIcon icon="fa-solid fa-person-walking-luggage" className="text-xl text-[#ffbe00] animate-bounce" />
                </div>

                {/* Pulsing Theme Gold GPS Dot */}
                <div className="absolute top-1.5 right-4 w-3 h-3 rounded-full bg-[#ffbe00] ring-2 ring-[#0f3a98] animate-ping" />
              </div>

              {/* Status Headline */}
              <div className="space-y-1.5 max-w-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8effc] text-[#0f3a98] text-[11px] font-medium border border-blue-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#ffbe00] animate-pulse" />
                  <span>Live Campus Network Search Active</span>
                </div>

                <h4 className="text-base font-semibold text-[#0f3a98]">
                  Searching Most Suitable & Nearest Broker...
                </h4>

                <p className="text-xs text-slate-500 font-normal">
                  Checking vetted scouts, direct contacts & live rates around {hostel.area}
                </p>
              </div>

              {/* Progressive Live Search Steps (Strictly Theme Blue & Gold) */}
              <div className="w-full max-w-sm bg-[#e8effc]/45 p-3.5 rounded-xl border border-blue-200/80 text-left space-y-2.5 text-xs font-medium">
                <div className={`flex items-center gap-2 transition-all ${searchStep >= 0 ? 'text-[#0f3a98]' : 'text-slate-400'}`}>
                  <FaIcon
                    icon={searchStep > 0 ? 'fa-solid fa-circle-check' : 'fa-solid fa-spinner'}
                    className={`text-xs shrink-0 ${searchStep === 0 ? 'animate-spin text-[#ffbe00]' : 'text-[#0f3a98]'}`}
                  />
                  <span>Calibrating campus location: {hostel.campus}</span>
                </div>

                <div className={`flex items-center gap-2 transition-all ${searchStep >= 1 ? 'text-[#0f3a98]' : 'text-slate-400'}`}>
                  <FaIcon
                    icon={searchStep > 1 ? 'fa-solid fa-circle-check' : searchStep === 1 ? 'fa-solid fa-spinner' : 'fa-regular fa-circle'}
                    className={`text-xs shrink-0 ${searchStep === 1 ? 'animate-spin text-[#ffbe00]' : searchStep > 1 ? 'text-[#0f3a98]' : 'text-slate-300'}`}
                  />
                  <span>Searching nearest hostel brokers in {hostel.area}...</span>
                </div>

                <div className={`flex items-center gap-2 transition-all ${searchStep >= 2 ? 'text-[#0f3a98]' : 'text-slate-400'}`}>
                  <FaIcon
                    icon={searchStep > 2 ? 'fa-solid fa-circle-check' : searchStep === 2 ? 'fa-solid fa-spinner' : 'fa-regular fa-circle'}
                    className={`text-xs shrink-0 ${searchStep === 2 ? 'animate-spin text-[#ffbe00]' : searchStep > 2 ? 'text-[#0f3a98]' : 'text-slate-300'}`}
                  />
                  <span>Fetching verified room rates & fee pricing...</span>
                </div>

                <div className={`flex items-center gap-2 transition-all ${searchStep >= 3 ? 'text-[#0f3a98]' : 'text-slate-400'}`}>
                  <FaIcon
                    icon={searchStep >= 3 ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}
                    className={`text-xs shrink-0 ${searchStep >= 3 ? 'text-[#ffbe00]' : 'text-slate-300'}`}
                  />
                  <span>
                    {hasCustodian
                      ? 'Direct official custodian found — no broker needed!'
                      : 'Matching top-rated verified broker for you...'}
                  </span>
                </div>
              </div>
            </div>
          ) : effectiveOffers.length === 0 ? (
            /* STEP 2A: Matched Campus Scout Fallback (Non-Custodian Hostels without seeded broker offers) */
            <div className="space-y-3.5 animate-in fade-in duration-300 font-sans">
              {/* Theme Match Banner */}
              <div className="bg-[#e8effc] border border-blue-200 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs text-[#0f3a98] font-medium">
                <div className="flex items-center gap-2 min-w-0">
                  <FaIcon icon="fa-solid fa-circle-check" className="text-[#0f3a98] text-sm shrink-0" />
                  <span className="truncate">Nearest Verified Campus Broker Matched!</span>
                </div>
                <span className="text-[10px] bg-[#ffbe00] px-2.5 py-0.5 rounded-full text-[#0f3a98] font-semibold shrink-0">
                  {activeScout.distance}
                </span>
              </div>

              {/* Price Display Box (Room Rate & Broker Fee) */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#e8effc]/60 border border-blue-200">
                <div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Semester Rent</div>
                  <div className="text-xs sm:text-sm font-bold text-[#0f3a98] mt-0.5">
                    {roomPriceLabel}
                  </div>
                </div>
                <div className="border-l border-blue-200/80 pl-3">
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Broker Viewing Fee</div>
                  <div className="text-xs sm:text-sm font-bold text-[#0f3a98] mt-0.5 flex items-center gap-1.5">
                    <span>{formatUGX(activeScout.accessFeeUgx)}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#ffbe00] text-[#0f3a98] text-[9px] font-semibold">Trek</span>
                  </div>
                </div>
              </div>

              {/* Broker Card */}
              <div className="rounded-2xl border-2 border-[#0f3a98] bg-white overflow-hidden shadow-sm">
                {/* Top Header */}
                <div className="bg-[#0f3a98] p-3.5 sm:p-4 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-white text-[#0f3a98] font-bold text-sm flex items-center justify-center border-2 border-[#ffbe00] shadow-sm">
                        {activeScout.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#ffbe00] border-2 border-[#0f3a98] flex items-center justify-center text-[9px] text-[#0f3a98]" title="Active on campus">
                        <FaIcon icon="fa-solid fa-check" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-medium text-white text-sm sm:text-base">
                          {activeScout.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ffbe00] text-[#0f3a98] flex items-center gap-1">
                          <FaIcon icon="fa-solid fa-award" className="text-[9px]" />
                          Verified Scout
                        </span>
                      </div>
                      <div className="text-[11px] text-blue-200 flex items-center gap-2 mt-0.5">
                        <span>{activeScout.title}</span>
                        <span>•</span>
                        <span className="flex items-center text-[#ffbe00] font-medium">
                          <FaIcon icon="fa-solid fa-star" className="text-[10px] mr-1" />
                          {activeScout.rating} ({activeScout.reviews} tours)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proximity & ETA Grid */}
                <div className="p-3.5 sm:p-4 space-y-3 bg-[#f8fafc]">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                      <div className="text-[10px] text-slate-400 font-medium uppercase">Campus Distance</div>
                      <div className="font-medium text-[#0f3a98] text-xs mt-0.5 flex items-center gap-1">
                        <FaIcon icon="fa-solid fa-location-dot" className="text-[#ffbe00] text-xs" />
                        <span>{activeScout.distance}</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                      <div className="text-[10px] text-slate-400 font-medium uppercase">Estimated Arrival</div>
                      <div className="font-medium text-[#0f3a98] text-xs mt-0.5 flex items-center gap-1">
                        <FaIcon icon="fa-solid fa-person-walking" className="text-[#0f3a98] text-xs" />
                        <span>{activeScout.eta}</span>
                      </div>
                    </div>
                  </div>

                  {/* Guarantee Notice */}
                  <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-blue-100 space-y-1">
                    <div className="font-medium text-[#0f3a98] flex items-center gap-1.5 text-xs">
                      <FaIcon icon="fa-solid fa-shield-halved" className="text-[#ffbe00]" />
                      <span>Direct Key Access & Viewing Guarantee</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                      This verified scout will trek with you to inspect available rooms and introduce you directly to the hostel desk with transparent pricing.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-1 flex items-center gap-2">
                    <a
                      href={`https://wa.me/${activeScout.whatsapp}?text=Hello%20${encodeURIComponent(activeScout.name)},%20Hostel%20Connect%20matched%20you%20as%20the%20nearest%20verified%20scout%20for%20available%20rooms%20in%20${encodeURIComponent(hostel.area)}%20near%20${encodeURIComponent(hostel.campus)}.%20When%20can%20we%20tour?`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <FaIcon icon="fa-brands fa-whatsapp" className="text-sm" />
                      <span>WhatsApp Scout</span>
                    </a>

                    <a
                      href={`tel:${activeScout.phone}`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <FaIcon icon="fa-solid fa-phone" className="text-xs text-[#ffbe00]" />
                      <span>Call Directly</span>
                    </a>
                  </div>

                  <button
                    onClick={triggerManualBrokerSearch}
                    className="w-full text-center text-xs text-[#0f3a98] hover:text-[#0a2666] font-medium pt-1 flex items-center justify-center gap-1.5 transition"
                  >
                    <FaIcon icon="fa-solid fa-arrows-rotate" className="text-[10px] text-[#ffbe00]" />
                    <span>Find another nearby broker</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2B: Matched Custodian Listing OR Seeded Broker Offer */
            <div className="space-y-3.5 animate-in fade-in duration-300 font-sans">
              {effectiveOffers.map((offer) => {
                const isCustodian = offer.userRole === 'custodian';

                // Custodian Listing (NOT yet unlocked -> show price + Mobile Money unlock)
                if (isCustodian && !isUnlocked) {
                  return (
                    <div
                      key={offer.id}
                      className="rounded-2xl border-2 border-[#0f3a98] bg-white overflow-hidden shadow-sm"
                    >
                      {/* Top Custodian Shield Banner */}
                      <div className="bg-[#0f3a98] px-4 py-3 text-white flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#ffbe00] text-xs shrink-0">
                            <FaIcon icon="fa-solid fa-lock" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white flex items-center gap-1.5 flex-wrap">
                              <span>Official Custodian / Owner</span>
                              <span className="text-[10px] text-[#ffbe00] bg-white/10 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                98% response
                              </span>
                            </div>
                            <div className="text-[10px] text-blue-200 truncate">
                              Direct desk • {hostel.area} (Self-Approach)
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] sm:text-[11px] font-semibold bg-[#ffbe00] text-[#0f3a98] px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                          Protected
                        </span>
                      </div>

                      {/* Price Breakdown + Locked Details */}
                      <div className="p-4 space-y-3.5 bg-[#f8fafc]">
                        {/* 2 Independent Price Buttons Revealed After Search */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="p-3 rounded-xl bg-[#0f3a98] text-white border border-[#0f3a98] shadow-xs flex flex-col items-center justify-center text-center">
                            <div className="text-[10px] text-white/80 font-medium uppercase tracking-wide">Semester Rent</div>
                            <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                              {roomPriceLabel}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-[#0f3a98] text-white border border-[#0f3a98] shadow-xs flex flex-col items-center justify-center text-center">
                            <div className="text-[10px] text-white/80 font-medium uppercase tracking-wide">Direct Unlock Fee</div>
                            <div className="text-xs sm:text-sm font-bold text-white mt-0.5 flex items-center justify-center gap-1.5 flex-wrap">
                              <span>UGX {CONNECTION_FEE_UGX.toLocaleString()}</span>
                              <span className="px-1.5 py-0.5 rounded bg-[#ffbe00] text-[#0f3a98] text-[9px] font-semibold">Once</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-2.5 text-xs">
                          <div>
                            <div className="font-semibold text-[#0f3a98] text-sm">
                              Official Hostel Custodian & Warden
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Direct Phone & WhatsApp: <span className="font-mono text-slate-500 font-medium">+256 701 ••• ••• (Locked)</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-center sm:justify-end gap-1.5 opacity-55 pointer-events-none shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-[#e8effc] text-[#0f3a98] text-xs font-medium flex items-center gap-1 border border-blue-200">
                              <FaIcon icon="fa-solid fa-lock" className="text-[10px]" /> Call
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-[#e8effc] text-[#0f3a98] text-xs font-medium flex items-center gap-1 border border-blue-200">
                              <FaIcon icon="fa-solid fa-lock" className="text-[10px]" /> WhatsApp
                            </span>
                          </div>
                        </div>

                        {/* Payment Box */}
                        <div className="p-4 rounded-xl bg-white border border-blue-200 space-y-3 shadow-xs">
                          <div>
                            <div className="text-xs font-medium text-slate-900">
                              Pay <strong className="text-[#0f3a98] font-bold text-sm">UGX {CONNECTION_FEE_UGX.toLocaleString()}</strong> to unlock direct custodian phone, WhatsApp & exact hostel address.
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                              Deducted securely via Mobile Money. 100% refunded if room is fully booked.
                            </div>
                          </div>

                          {errorMsg && (
                            <div className="text-xs text-[#0f3a98] bg-[#ffbe00]/20 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                              <FaIcon icon="fa-solid fa-circle-exclamation" className="text-[#0f3a98]" />
                              <span>{errorMsg}</span>
                            </div>
                          )}

                          {paymentStep === 'prompting' ? (
                            <div className="p-4 rounded-xl bg-[#0f3a98] text-white text-center space-y-2 animate-pulse">
                              <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-xl text-[#ffbe00]" />
                              <div className="text-xs font-medium">Sending Mobile Money prompt to your phone...</div>
                              <div className="text-[11px] text-blue-200">
                                Please enter your PIN on +256 {momoPhone} to approve UGX {CONNECTION_FEE_UGX.toLocaleString()}.
                              </div>
                            </div>
                          ) : (
                            <form onSubmit={handlePayConnectionFee} className="space-y-2.5 pt-1">
                              {/* Provider Toggle */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setMomoProvider('mtn')}
                                  className={`py-2 px-2 sm:px-3 rounded-lg border flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium whitespace-nowrap transition ${
                                    momoProvider === 'mtn'
                                      ? 'border-[#ffbe00] bg-[#ffbe00]/15 text-[#0f3a98]'
                                      : 'border-slate-200 bg-white text-slate-600'
                                  }`}
                                >
                                  <img
                                    src="/MTN%20mobile%20money.png"
                                    alt="MTN MoMo"
                                    className="h-4 sm:h-5 w-auto object-contain rounded-sm shrink-0"
                                  />
                                  <span className="whitespace-nowrap">MTN MoMo</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setMomoProvider('airtel')}
                                  className={`py-2 px-2 sm:px-3 rounded-lg border flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-medium whitespace-nowrap transition ${
                                    momoProvider === 'airtel'
                                      ? 'border-[#0f3a98] bg-[#e8effc] text-[#0f3a98]'
                                      : 'border-slate-200 bg-white text-slate-600'
                                  }`}
                                >
                                  <img
                                    src="/Airtel%20mobile%20money.jpg"
                                    alt="Airtel Money"
                                    className="w-4 h-4 sm:w-5 sm:h-5 object-cover rounded-sm shrink-0"
                                  />
                                  <span className="whitespace-nowrap">Airtel Money</span>
                                </button>
                              </div>

                              {/* Phone Input & Pay Button (2 stacked lines) */}
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center rounded-lg border border-blue-200 focus-within:border-[#0f3a98] bg-white overflow-hidden">
                                  <span className="pl-3 pr-2 py-2 text-xs text-slate-400 font-medium select-none shrink-0 border-r border-blue-100">
                                    +256
                                  </span>
                                  <input
                                    type="tel"
                                    required
                                    placeholder="770 000 000"
                                    value={momoPhone}
                                    onChange={(e) => setMomoPhone(e.target.value)}
                                    className="w-full px-3 py-2 focus:outline-hidden text-xs text-slate-800 bg-transparent"
                                  />
                                </div>

                                <button
                                  type="submit"
                                  disabled={isPayingFee}
                                  className="w-full px-4 py-2 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-sm transition"
                                >
                                  <FaIcon icon="fa-solid fa-lock-open" className="text-xs text-[#ffbe00]" />
                                  <span>Pay UGX 5,000</span>
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // UNLOCKED Custodian Listing OR Seeded Broker Listing
                return (
                  <div
                    key={offer.id}
                    className={`p-4 rounded-2xl border-2 transition space-y-3 ${
                      isCustodian
                        ? 'border-[#0f3a98] bg-[#e8effc]/30 shadow-xs'
                        : 'border-[#0f3a98] bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-full">
                        {/* Role Badges */}
                        {(isCustodian || offer.responseRatePct) && (
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            {isCustodian && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#0f3a98] text-white">
                                <FaIcon icon="fa-solid fa-circle-check" className="text-[10px] text-[#ffbe00]" />
                                <span>Official Custodian / Owner Unlocked</span>
                              </span>
                            )}

                            {offer.responseRatePct && (
                              <span className="text-[11px] text-[#0f3a98]/80 font-medium">
                                {isCustodian ? '• ' : ''}{offer.responseRatePct}% response rate
                              </span>
                            )}
                          </div>
                        )}

                        <h4 className="font-semibold text-[#0f3a98] text-sm sm:text-base">
                          {offer.userName}
                        </h4>

                        {/* 2 Independent Price Buttons (Room Rate & Fee) */}
                        <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                          <div className="p-3 rounded-xl bg-[#0f3a98] text-white border border-[#0f3a98] shadow-xs flex flex-col items-center justify-center text-center">
                            <div className="text-[10px] text-white/80 font-medium uppercase tracking-wide">Semester Rent</div>
                            <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                              {roomPriceLabel}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-[#0f3a98] text-white border border-[#0f3a98] shadow-xs flex flex-col items-center justify-center text-center">
                            <div className="text-[10px] text-white/80 font-medium uppercase tracking-wide">
                              {isCustodian ? 'Connection Status' : 'Broker Access Fee'}
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                              {isCustodian
                                ? `Paid (UGX ${CONNECTION_FEE_UGX.toLocaleString()})`
                                : (offer.accessFeeUgx > 0 ? formatUGX(offer.accessFeeUgx) : 'Free (No fee)')}
                            </div>
                          </div>
                        </div>

                        {/* Revealed Hostel Name and Direct Self-Approach Directions once unlocked */}
                        {isCustodian && isUnlocked && (
                          <div className="space-y-1.5 mt-2.5 p-3 rounded-xl bg-[#e8effc] border border-blue-200">
                            <div className="text-xs text-[#0f3a98] font-medium flex items-center gap-1.5">
                              <FaIcon icon="fa-solid fa-building" className="text-xs text-[#0f3a98]" />
                              <span>Official Hostel Name: <strong>{hostel.name}</strong></span>
                            </div>
                            <div className="text-xs text-slate-700 flex items-center gap-1.5">
                              <FaIcon icon="fa-solid fa-location-dot" className="text-xs text-[#ffbe00]" />
                              <span>Direct Address: <strong>{hostel.landmark} ({hostel.area})</strong></span>
                            </div>
                            <div className="text-[11px] text-[#0f3a98] bg-[#ffbe00]/25 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 mt-1">
                              <FaIcon icon="fa-solid fa-circle-check" className="text-[10px] text-[#0f3a98]" />
                              <span>Direct approach: You can now walk directly to the hostel desk yourself or call/WhatsApp below.</span>
                            </div>
                          </div>
                        )}

                        {paymentRef && isCustodian && (
                          <div className="mt-2 text-[11px] text-[#0f3a98] font-medium">
                            Receipt Ref: <span className="font-mono">{paymentRef}</span>
                          </div>
                        )}

                        {offer.notes && (
                          <p className="text-xs text-slate-500 mt-2 italic">"{offer.notes}"</p>
                        )}
                      </div>
                    </div>

                    {/* Actions (Fully active and unlocked) */}
                    <div className="pt-3 border-t border-blue-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs text-[#0f3a98] font-mono font-semibold">
                        {offer.contactPhone}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInitiateAction(offer, 'call')}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                        >
                          <FaIcon icon="fa-solid fa-phone" className="text-xs text-[#ffbe00]" />
                          <span>Call</span>
                        </button>

                        <button
                          onClick={() => handleInitiateAction(offer, 'whatsapp')}
                          className="px-3.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                        >
                          <FaIcon icon="fa-brands fa-whatsapp" className="text-xs text-white" />
                          <span>{isCustodian ? 'WhatsApp' : 'WhatsApp & Trek'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-[#e8effc]/50 border-t border-blue-100 text-center text-[11px] text-[#0f3a98] font-medium">
          <FaIcon icon="fa-solid fa-circle-info" className="text-xs mr-1 text-[#ffbe00]" />
          Hostel Connect guarantees transparent booking. Semester rent is paid at the hostel desk.
        </div>
      </div>
    </div>
  );
}
