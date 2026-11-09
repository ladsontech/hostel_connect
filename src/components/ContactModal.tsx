'use client';

import React, { useState } from 'react';
import { Hostel, Offer } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { formatUGX, getPhoneDialerLink, getWhatsAppDeepLink } from '@/lib/utils';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Award, 
  Phone, 
  MessageSquare, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  ExternalLink 
} from 'lucide-react';

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
  
  // Track acknowledged broker fee notices by offer ID (FR-3.4)
  const [acknowledgedOffers, setAcknowledgedOffers] = useState<Record<string, boolean>>({});
  const [brokerNoticePending, setBrokerNoticePending] = useState<Offer | null>(null);

  if (!isOpen) return null;

  // Log lead helper (FR-3.3)
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
    // FR-2.8: Browsing works logged out, but contact requires login
    if (!isAuthenticated || !currentUser) {
      onRequireAuth();
      return;
    }

    // FR-3.4: Before revealing Broker contact, check acknowledgment of access fee
    if (offer.userRole === 'broker' && !acknowledgedOffers[offer.id]) {
      setBrokerNoticePending(offer);
      return;
    }

    // Proceed with action & lead logging
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-b from-slate-50 to-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Direct Contact
              </span>
              <span className="text-xs text-slate-500">{hostel.campus}</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg mt-1">{hostel.name}</h3>
            <p className="text-xs text-slate-500">
              Select who you would like to reach. Rent is paid directly to the hostel management.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Offers List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* FR-3.4 Modal Interstitial Notice */}
          {brokerNoticePending && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-900">Important Broker Notice</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    This broker may charge an access or viewing fee of{' '}
                    <strong className="font-bold text-slate-900">
                      {brokerNoticePending.accessFeeUgx > 0
                        ? formatUGX(brokerNoticePending.accessFeeUgx)
                        : 'No fee'}
                    </strong>
                    . Rent is set by the hostel owner.
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1">
                    Hostel Connect never handles deposit or rent payments.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setBrokerNoticePending(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-amber-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBrokerNotice}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
                >
                  I Understand & Continue
                </button>
              </div>
            </div>
          )}

          {/* Offers list */}
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
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : offer.isAuthorised
                      ? 'border-blue-200 bg-blue-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {/* Role Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {isCustodian ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white">
                            <ShieldCheck className="w-3 h-3" />
                            Official Custodian / Owner
                          </span>
                        ) : offer.isAuthorised ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white">
                            <Award className="w-3 h-3" />
                            Authorised Agent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-800">
                            Independent Broker
                          </span>
                        )}

                        {offer.responseRatePct && (
                          <span className="text-[11px] text-slate-500 font-medium">
                            • {offer.responseRatePct}% response rate
                          </span>
                        )}
                      </div>

                      {/* Contact Name */}
                      <h4 className="font-bold text-slate-900 text-sm">{offer.userName}</h4>

                      {/* Access Fee Disclosure (FR-3.2 & FR-4.4) */}
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Access / Viewing Fee:</span>
                        {offer.accessFeeUgx > 0 ? (
                          <span className="font-bold text-slate-900 bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[11px]">
                            {formatUGX(offer.accessFeeUgx)}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">
                            Free (No access fee)
                          </span>
                        )}
                      </div>

                      {offer.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic">"{offer.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Call & WhatsApp */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400">
                      {isAcknowledged ? offer.contactPhone : 'Tap to reveal phone'}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleInitiateAction(offer, 'call')}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        Call
                      </button>

                      <button
                        onClick={() => handleInitiateAction(offer, 'whatsapp')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
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
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          ⚠️ Hostel Connect is an informational listing service. We never collect rent or hold deposits.
        </div>
      </div>
    </div>
  );
}
