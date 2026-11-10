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
      const msg = `Hello ${offer.userName}, I saw your listing for student rooms in ${hostel.area} near ${hostel.campus} on Hostel Connect Uganda. Is there an available room?`;
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
              <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#0f3a98] text-white">
                <FaIcon icon="fa-solid fa-shield-halved" className="text-[#ffbe00] text-[10px] mr-1" />
                Verified Listing
              </span>
              <span className="text-xs text-slate-500 font-medium">{hostel.campus}</span>
            </div>
            <h3 className="font-medium text-[#0f3a98] text-lg mt-1">
              Verified Student Accommodation • {hostel.area}
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Direct connection to official hostel management desk. 100% money-back guarantee.
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
            <div className="text-center py-8 text-slate-500 text-sm">
              No active contacts available for this hostel right now.
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
                        ) : offer.isAuthorised ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#ffbe00] text-[#0f3a98]">
                            <FaIcon icon="fa-solid fa-award" className="text-[10px]" />
                            Authorised Agent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                            Independent Broker
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
                        className="px-3.5 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-white text-xs font-medium flex items-center gap-1.5 transition shadow-sm"
                      >
                        <FaIcon icon="fa-brands fa-whatsapp" className="text-xs text-[#ffbe00]" />
                        WhatsApp
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
