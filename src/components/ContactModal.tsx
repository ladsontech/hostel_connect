'use client';

import React, { useState } from 'react';
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

  if (!isOpen) return null;

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
      const msg = `Hello ${offer.userName}, I saw your listing for ${hostel.name} on Hostel Connect Uganda. Is there an available room?`;
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-[#e8effc] text-[#0f3a98]">
                Direct Contact
              </span>
              <span className="text-xs text-slate-500 font-medium">{hostel.campus}</span>
            </div>
            <h3 className="font-medium text-[#0f3a98] text-lg mt-1">{hostel.name}</h3>
            <p className="text-xs text-slate-500 font-medium">
              Select who you would like to reach. Rent is paid directly to hostel management.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition"
          >
            <FaIcon icon="fa-solid fa-xmark" className="text-sm" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
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
                  className="px-4 py-1.5 rounded-lg bg-[#0f3a98] hover:bg-[#0a2666] text-[#ffbe00] text-xs font-medium transition shadow-sm"
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
              const isAcknowledged = acknowledgedOffers[offer.id] || isCustodian;

              return (
                <div
                  key={offer.id}
                  className={`p-4 rounded-xl border transition ${
                    isCustodian
                      ? 'border-[#0f3a98] bg-[#e8effc]/30'
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
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#0f3a98] text-[#ffbe00]">
                            <FaIcon icon="fa-solid fa-shield-halved" className="text-[10px] text-[#ffbe00]" />
                            Official Custodian / Owner
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

                      <h4 className="font-medium text-slate-900 text-sm">{offer.userName}</h4>

                      {/* Access Fee Disclosure */}
                      <div className="mt-1 flex items-center gap-2 text-xs font-medium">
                        <span className="text-slate-500">Access Fee:</span>
                        {offer.accessFeeUgx > 0 ? (
                          <span className="font-medium text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[11px]">
                            {formatUGX(offer.accessFeeUgx)}
                          </span>
                        ) : (
                          <span className="font-medium text-[#0f3a98] bg-[#e8effc] px-1.5 py-0.5 rounded text-[11px]">
                            Free (No fee)
                          </span>
                        )}
                      </div>

                      {offer.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">"{offer.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400 font-mono">
                      {isAcknowledged ? offer.contactPhone : 'Tap to reveal contact'}
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
          Hostel Connect is an informational listing service. We never collect rent or hold deposits.
        </div>
      </div>
    </div>
  );
}
