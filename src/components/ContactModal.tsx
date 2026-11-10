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

  // Broker searching animation state
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
      verifiedId: 'SCOUT-UG-9102',
      campus: hostel?.campus || 'Makerere University',
      area: hostel?.area || 'Kikoni'
    }
  ];

  // Whenever modal opens or hostel changes, run the live broker searching animation
  useEffect(() => {
    if (isOpen && offers.length === 0) {
      setBrokerSearchState('searching');
      setSearchStep(0);

      const step1 = setTimeout(() => setSearchStep(1), 750);
      const step2 = setTimeout(() => setSearchStep(2), 1600);
      const step3 = setTimeout(() => setSearchStep(3), 2400);
      const finish = setTimeout(() => {
        setBrokerSearchState('matched');
      }, 3200);

      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
        clearTimeout(step3);
        clearTimeout(finish);
      };
    }
  }, [isOpen, hostel?.id, offers.length]);

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
  const hasCustodian = offers.some(o => o.userRole === 'custodian');

  if (!isOpen || !hostel) return null;

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

      const nextUnlocked = [...unlockedHostels, hostel.id];
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header (Shields actual hostel name to prevent bypassing the platform) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded ${
                hasCustodian ? 'bg-[#0f3a98] text-white' : 'bg-[#ffbe00] text-[#0f3a98]'
              }`}>
                <FaIcon
                  icon={hasCustodian ? "fa-solid fa-shield-halved" : "fa-solid fa-person-walking"}
                  className={`text-xs mr-1 ${hasCustodian ? 'text-[#ffbe00]' : 'text-[#0f3a98]'}`}
                />
                {hasCustodian ? 'Official Custodian Listing' : 'Campus Scout & Broker Viewing'}
              </span>
              <span className="text-xs text-slate-500 font-medium">{hostel.campus}</span>
            </div>
            <h3 className="font-medium text-[#0f3a98] text-lg mt-1">
              Verified Student Accommodation • {hostel.area}
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              {hasCustodian
                ? 'Direct connection to official hostel management desk. 100% money-back guarantee.'
                : 'A verified campus broker will physically trek with you to inspect rooms and introduce you to the caretaker desk.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0f3a98] hover:bg-[#0a2666] text-white flex items-center justify-center transition shadow-sm shrink-0 ml-3"
          >
            <FaIcon icon="fa-solid fa-xmark" className="text-xs text-white" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {brokerNoticePending && (
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-[#ffbe00] text-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <FaIcon icon="fa-solid fa-triangle-exclamation" className="text-amber-700 text-lg shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm text-slate-900">Important Broker Notice</h4>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    This broker may charge an access or viewing fee of{' '}
                    <strong className="font-medium text-[#0f3a98]">
                      {brokerNoticePending.accessFeeUgx > 0
                        ? formatUGX(brokerNoticePending.accessFeeUgx)
                        : 'No fee'}
                    </strong>
                    . Rent is set by the hostel owner.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    Hostel Connect never handles deposit or rent payments.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setBrokerNoticePending(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-amber-100"
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

          {offers.length === 0 ? (
            <div>
              {brokerSearchState === 'searching' ? (
                /* Animated Searching for Nearest Broker */
                <div className="py-7 px-2 text-center space-y-5 flex flex-col items-center justify-center font-sans">
                  {/* Radar Pulse Animation Container */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Concentric radar rings */}
                    <span className="absolute w-28 h-28 rounded-full bg-[#0f3a98]/10 animate-ping duration-1000" />
                    <span className="absolute w-20 h-20 rounded-full bg-[#0f3a98]/20 animate-pulse duration-700" />
                    <span className="absolute w-24 h-24 rounded-full border-2 border-dashed border-[#ffbe00]/60 animate-spin duration-3000" />

                    {/* Center Core Icon */}
                    <div className="relative w-14 h-14 rounded-full bg-[#0f3a98] text-white flex items-center justify-center shadow-lg border-2 border-[#ffbe00] z-10">
                      <FaIcon icon="fa-solid fa-person-walking-luggage" className="text-xl text-[#ffbe00] animate-bounce" />
                    </div>

                    {/* Pulsing GPS dot */}
                    <div className="absolute top-1.5 right-4 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  </div>

                  {/* Status Headline */}
                  <div className="space-y-1.5 max-w-sm">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8effc] text-[#0f3a98] text-[11px] font-medium border border-blue-200 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Campus Network Search Active</span>
                    </div>

                    <h4 className="text-base font-medium text-slate-900">
                      Searching Nearest Verified Broker...
                    </h4>

                    <p className="text-xs text-slate-500 font-normal">
                      Locating vetted campus scouts within 500m of {hostel.area}
                    </p>
                  </div>

                  {/* Progressive Live Search Steps */}
                  <div className="w-full max-w-sm bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left space-y-2 text-xs font-medium">
                    <div className={`flex items-center gap-2 transition-all ${searchStep >= 0 ? 'text-[#0f3a98]' : 'text-slate-400'}`}>
                      <FaIcon
                        icon={searchStep > 0 ? "fa-solid fa-circle-check" : "fa-solid fa-spinner"}
                        className={`text-xs shrink-0 ${searchStep === 0 ? 'animate-spin text-[#ffbe00]' : 'text-emerald-600'}`}
                      />
                      <span>Calibrating campus location: {hostel.campus}</span>
                    </div>

                    <div className={`flex items-center gap-2 transition-all ${searchStep >= 1 ? 'text-[#0f3a98]' : 'text-slate-400'}`}>
                      <FaIcon
                        icon={searchStep > 1 ? "fa-solid fa-circle-check" : searchStep === 1 ? "fa-solid fa-spinner" : "fa-regular fa-circle"}
                        className={`text-xs shrink-0 ${searchStep === 1 ? 'animate-spin text-[#ffbe00]' : searchStep > 1 ? 'text-emerald-600' : ''}`}
                      />
                      <span>Scanning verified scouts on-duty in {hostel.area}</span>
                    </div>

                    <div className={`flex items-center gap-2 transition-all ${searchStep >= 2 ? 'text-[#0f3a98]' : 'text-slate-400'}`}>
                      <FaIcon
                        icon={searchStep > 2 ? "fa-solid fa-circle-check" : searchStep === 2 ? "fa-solid fa-spinner" : "fa-regular fa-circle"}
                        className={`text-xs shrink-0 ${searchStep === 2 ? 'animate-spin text-[#ffbe00]' : searchStep > 2 ? 'text-emerald-600' : ''}`}
                      />
                      <span>Checking direct room access & key custody</span>
                    </div>

                    <div className={`flex items-center gap-2 transition-all ${searchStep >= 3 ? 'text-[#0f3a98]' : 'text-slate-400'}`}>
                      <FaIcon
                        icon={searchStep >= 3 ? "fa-solid fa-circle-check" : "fa-regular fa-circle"}
                        className={`text-xs shrink-0 ${searchStep >= 3 ? 'text-emerald-600' : ''}`}
                      />
                      <span>Matching top-rated verified broker for you...</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Matched Verified Broker Result */
                <div className="space-y-3.5 animate-in fade-in duration-300 font-sans">
                  {/* Match Banner */}
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                    <div className="flex items-center gap-2">
                      <FaIcon icon="fa-solid fa-circle-check" className="text-emerald-600 text-sm shrink-0" />
                      <span>Nearest Verified Campus Broker Matched!</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200/70 px-2 py-0.5 rounded text-emerald-900 font-medium">
                      {verifiedBrokers[matchedBrokerIndex].distance}
                    </span>
                  </div>

                  {/* Broker Card */}
                  <div className="rounded-2xl border-2 border-[#0f3a98] bg-white overflow-hidden shadow-sm">
                    {/* Top Header */}
                    <div className="bg-[#0f3a98] p-3.5 sm:p-4 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full bg-white text-[#0f3a98] font-bold text-sm flex items-center justify-center border-2 border-[#ffbe00] shadow-sm">
                            {verifiedBrokers[matchedBrokerIndex].name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white" title="Active on campus">
                            <FaIcon icon="fa-solid fa-check" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-medium text-white text-sm sm:text-base">
                              {verifiedBrokers[matchedBrokerIndex].name}
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#ffbe00] text-[#0f3a98] flex items-center gap-1">
                              <FaIcon icon="fa-solid fa-award" className="text-[9px]" />
                              Verified Scout
                            </span>
                          </div>
                          <div className="text-[11px] text-blue-200 flex items-center gap-2 mt-0.5">
                            <span>{verifiedBrokers[matchedBrokerIndex].title}</span>
                            <span>•</span>
                            <span className="flex items-center text-[#ffbe00] font-medium">
                              <FaIcon icon="fa-solid fa-star" className="text-[10px] mr-1" />
                              {verifiedBrokers[matchedBrokerIndex].rating} ({verifiedBrokers[matchedBrokerIndex].reviews} tours)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Proximity & ETA Grid */}
                    <div className="p-3.5 sm:p-4 space-y-3 bg-[#f8fafc]">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <div className="text-[10px] text-slate-400 font-medium uppercase">Campus Distance</div>
                          <div className="font-medium text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                            <FaIcon icon="fa-solid fa-location-dot" className="text-[#0f3a98] text-xs" />
                            <span>{verifiedBrokers[matchedBrokerIndex].distance}</span>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <div className="text-[10px] text-slate-400 font-medium uppercase">Estimated Arrival</div>
                          <div className="font-medium text-slate-800 text-xs mt-0.5 flex items-center gap-1">
                            <FaIcon icon="fa-solid fa-person-walking" className="text-emerald-600 text-xs" />
                            <span>{verifiedBrokers[matchedBrokerIndex].eta}</span>
                          </div>
                        </div>
                      </div>

                      {/* Guarantee Notice */}
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5 text-xs">
                          <FaIcon icon="fa-solid fa-shield-halved" className="text-[#0f3a98]" />
                          <span>Direct Key Access & Viewing Guarantee</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                          This verified scout has direct access to inspect available rooms in this hostel desk with zero middleman markups.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-1 flex items-center gap-2">
                        <a
                          href={`https://wa.me/${verifiedBrokers[matchedBrokerIndex].whatsapp}?text=Hello%20${encodeURIComponent(verifiedBrokers[matchedBrokerIndex].name)},%20Hostel%20Connect%20matched%20you%20as%20the%20nearest%20verified%20scout%20for%20available%20rooms%20in%20${encodeURIComponent(hostel.area)}%20near%20${encodeURIComponent(hostel.campus)}.%20When%20can%20we%20tour?`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition"
                        >
                          <FaIcon icon="fa-brands fa-whatsapp" className="text-sm" />
                          <span>WhatsApp Scout</span>
                        </a>

                        <a
                          href={`tel:${verifiedBrokers[matchedBrokerIndex].phone}`}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition"
                        >
                          <FaIcon icon="fa-solid fa-phone" className="text-xs text-[#ffbe00]" />
                          <span>Call Directly</span>
                        </a>
                      </div>

                      <button
                        onClick={() => {
                          setMatchedBrokerIndex((prev) => (prev + 1) % verifiedBrokers.length);
                          setBrokerSearchState('searching');
                          setSearchStep(0);
                          setTimeout(() => setSearchStep(1), 600);
                          setTimeout(() => setSearchStep(2), 1200);
                          setTimeout(() => setSearchStep(3), 1800);
                          setTimeout(() => setBrokerSearchState('matched'), 2400);
                        }}
                        className="w-full text-center text-xs text-slate-500 hover:text-[#0f3a98] font-medium pt-1 flex items-center justify-center gap-1.5 transition"
                      >
                        <FaIcon icon="fa-solid fa-arrows-rotate" className="text-[10px]" />
                        <span>Find another nearby broker</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            offers.map((offer) => {
              const isCustodian = offer.userRole === 'custodian';

              // If it's a custodian listing and NOT yet unlocked
              if (isCustodian && !isUnlocked) {
                return (
                  <div
                    key={offer.id}
                    className="rounded-2xl border-2 border-[#0f3a98] bg-white overflow-hidden shadow-sm space-y-0"
                  >
                    {/* Top Custodian Shield Banner */}
                    <div className="bg-[#0f3a98] px-4 py-3 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#ffbe00] text-xs">
                          <FaIcon icon="fa-solid fa-lock" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white flex items-center gap-1.5">
                            Official Custodian / Owner
                            <span className="text-[10px] text-[#ffbe00] bg-white/10 px-1.5 py-0.2 rounded font-normal">
                              98% response
                            </span>
                          </div>
                          <div className="text-[10px] text-blue-200">
                            Direct management desk • {hostel.area} / Campus Proximity
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-medium bg-[#ffbe00] text-[#0f3a98] px-2.5 py-1 rounded-md">
                        Protected Contact
                      </span>
                    </div>

                    {/* Masked Contact Details */}
                    <div className="p-4 space-y-3.5 bg-[#f8fafc]">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-medium text-slate-900 text-sm">
                            Official Hostel Custodian & Warden
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Direct Phone & WhatsApp: <span className="font-mono text-slate-400 font-medium">+256 701 ••• ••• (Locked)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-40 pointer-events-none">
                          <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-500 text-xs font-medium flex items-center gap-1">
                            <FaIcon icon="fa-solid fa-lock" className="text-[10px]" /> Call
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-500 text-xs font-medium flex items-center gap-1">
                            <FaIcon icon="fa-solid fa-lock" className="text-[10px]" /> WhatsApp
                          </span>
                        </div>
                      </div>

                      {/* Connection Fee Payment Box */}
                      <div className="p-4 rounded-xl bg-white border border-blue-200 space-y-3 shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-yellow-100 text-[#0f3a98]">
                              <FaIcon icon="fa-solid fa-bolt" className="text-[10px] text-[#ffbe00]" />
                              Connection Fee Required
                            </span>
                            <div className="text-xs font-medium text-slate-900 mt-1">
                              Pay <strong className="text-[#0f3a98] font-bold text-sm">UGX {CONNECTION_FEE_UGX.toLocaleString()}</strong> to unlock direct custodian phone & WhatsApp.
                            </div>
                            <div className="text-[11px] text-slate-500 font-light mt-0.5">
                              Deducted securely via Mobile Money. 100% refunded if room is fully booked.
                            </div>
                          </div>
                        </div>

                        {errorMsg && (
                          <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
                            <FaIcon icon="fa-solid fa-circle-exclamation" />
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
                                className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition ${
                                  momoProvider === 'mtn'
                                    ? 'border-[#ffbe00] bg-yellow-50 text-slate-900'
                                    : 'border-slate-200 bg-white text-slate-600'
                                }`}
                              >
                                <span className="w-4 h-4 rounded-full bg-[#ffbe00] text-[#0f3a98] font-bold text-[10px] flex items-center justify-center">M</span>
                                <span>MTN MoMo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setMomoProvider('airtel')}
                                className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-2 font-medium transition ${
                                  momoProvider === 'airtel'
                                    ? 'border-rose-500 bg-rose-50 text-slate-900'
                                    : 'border-slate-200 bg-white text-slate-600'
                                }`}
                              >
                                <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">A</span>
                                <span>Airtel Money</span>
                              </button>
                            </div>

                            {/* Phone Input */}
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-2 text-xs text-slate-400 font-medium">+256</span>
                                <input
                                  type="tel"
                                  required
                                  placeholder="770 000 000"
                                  value={momoPhone}
                                  onChange={(e) => setMomoPhone(e.target.value)}
                                  className="w-full pl-13 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#0f3a98] text-xs text-slate-800 bg-white"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isPayingFee}
                                className="px-4 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition shrink-0"
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

              // UNLOCKED Custodian Listing OR Broker Listing
              return (
                <div
                  key={offer.id}
                  className={`p-4 rounded-xl border transition ${
                    isCustodian
                      ? 'border-[#0f3a98] bg-[#e8effc]/30 shadow-xs'
                      : offer.isAuthorised
                      ? 'border-blue-200 bg-white'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {/* Role Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {isCustodian ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#0f3a98] text-white">
                            <FaIcon icon="fa-solid fa-circle-check" className="text-[10px] text-[#ffbe00]" />
                            Official Custodian / Owner Unlocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-[#ffbe00] text-[#0f3a98]">
                            <FaIcon icon="fa-solid fa-person-walking" className="text-[11px]" />
                            Campus Broker (Trek & Guide)
                          </span>
                        )}

                        {offer.responseRatePct && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            • {offer.responseRatePct}% response rate
                          </span>
                        )}
                      </div>

                      <h4 className="font-medium text-slate-900 text-sm">
                        {offer.userName}
                      </h4>

                      {/* Revealed Hostel Name once unlocked */}
                      {isCustodian && isUnlocked && (
                        <div className="text-xs text-[#0f3a98] font-medium mt-0.5 flex items-center gap-1">
                          <FaIcon icon="fa-solid fa-building" className="text-[11px] text-[#0f3a98]" />
                          <span>Official Name: <strong>{hostel.name}</strong></span>
                        </div>
                      )}

                      {/* Access / Connection Fee status */}
                      <div className="mt-1 flex items-center gap-2 text-xs font-medium">
                        {isCustodian ? (
                          <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                            <FaIcon icon="fa-solid fa-check" className="text-[10px]" />
                            Connection Fee Paid (UGX {CONNECTION_FEE_UGX.toLocaleString()})
                          </span>
                        ) : (
                          <>
                            <span className="text-slate-500">Broker Access Fee:</span>
                            {offer.accessFeeUgx > 0 ? (
                              <span className="font-medium text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[11px]">
                                {formatUGX(offer.accessFeeUgx)}
                              </span>
                            ) : (
                              <span className="font-medium text-[#0f3a98] bg-[#e8effc] px-1.5 py-0.5 rounded text-[11px]">
                                Free (No fee)
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {offer.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">"{offer.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Actions (Fully active and unlocked) */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-700 font-mono font-medium">
                      {offer.contactPhone}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleInitiateAction(offer, 'call')}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                      >
                        <FaIcon icon="fa-solid fa-phone" className="text-xs text-[#ffbe00]" />
                        Call
                      </button>

                      <button
                        onClick={() => handleInitiateAction(offer, 'whatsapp')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                      >
                        <FaIcon icon="fa-brands fa-whatsapp" className="text-xs text-white" />
                        {isCustodian ? 'WhatsApp' : 'WhatsApp & Trek'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium">
          <FaIcon icon="fa-solid fa-circle-info" className="text-xs mr-1 text-[#0f3a98]" />
          Hostel Connect guarantees direct management booking. Rent is paid at the hostel desk.
        </div>
      </div>
    </div>
  );
}
