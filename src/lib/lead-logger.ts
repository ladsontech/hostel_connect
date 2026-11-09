import { Lead, LeadType } from '@/types';
import { getDatabase } from './data-store';

/**
 * FR-3.3: Every tap on Contact, Call, WhatsApp and Save creates an immutable Lead record
 */
export function recordLead(params: {
  studentId: string;
  studentName?: string;
  studentPhone?: string;
  hostelId: string;
  offerId?: string;
  type: LeadType;
}): Lead {
  const db = getDatabase();

  const newLead: Lead = {
    id: `ld_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    studentId: params.studentId,
    studentName: params.studentName,
    studentPhone: params.studentPhone,
    hostelId: params.hostelId,
    offerId: params.offerId,
    type: params.type,
    timestamp: new Date().toISOString()
  };

  db.leads.push(newLead);

  // If hostel save/view event, increment counters
  const hostel = db.hostels.find(h => h.id === params.hostelId);
  if (hostel) {
    if (params.type === 'save') {
      hostel.saveCount = (hostel.saveCount || 0) + 1;
    }
  }

  return newLead;
}

/**
 * BR-7: Check if a student has an existing logged lead for this hostel before permitting review
 */
export function studentHasLoggedLead(studentId: string, hostelId: string): boolean {
  const db = getDatabase();
  return db.leads.some(
    lead =>
      lead.studentId === studentId &&
      lead.hostelId === hostelId &&
      (lead.type === 'contact_tap' || lead.type === 'call' || lead.type === 'whatsapp')
  );
}

export interface SellerListingAnalytics {
  views: number;
  saves: number;
  contactTaps: number;
  calls: number;
  whatsAppTaps: number;
  totalLeads: number;
  brokerBreakdown?: {
    brokerId: string;
    brokerName: string;
    leadCount: number;
  }[];
}

/**
 * FR-9.1 & FR-9.3: Computes seller analytics for a given hostel and optional offer filter
 */
export function getHostelAnalytics(
  hostelId: string,
  timeframe: 'today' | '7days' | 'semester' = 'semester',
  offerId?: string
): SellerListingAnalytics {
  const db = getDatabase();
  const hostel = db.hostels.find(h => h.id === hostelId);

  const now = new Date();
  let timeThreshold = new Date(0); // All time / semester default

  if (timeframe === 'today') {
    timeThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (timeframe === '7days') {
    timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Filter leads
  const filteredLeads = db.leads.filter(lead => {
    if (lead.hostelId !== hostelId) return false;
    if (offerId && lead.offerId !== offerId) return false;
    const leadTime = new Date(lead.timestamp);
    return leadTime >= timeThreshold;
  });

  const contactTaps = filteredLeads.filter(l => l.type === 'contact_tap').length;
  const calls = filteredLeads.filter(l => l.type === 'call').length;
  const whatsAppTaps = filteredLeads.filter(l => l.type === 'whatsapp').length;
  const saves = filteredLeads.filter(l => l.type === 'save').length;

  // Broker breakdown for custodians (FR-9.3)
  const brokerMap = new Map<string, { brokerName: string; count: number }>();
  filteredLeads.forEach(lead => {
    if (lead.offerId) {
      const offer = db.offers.find(o => o.id === lead.offerId);
      if (offer && offer.userRole === 'broker') {
        const cur = brokerMap.get(offer.userId) || { brokerName: offer.userName, count: 0 };
        cur.count++;
        brokerMap.set(offer.userId, cur);
      }
    }
  });

  const brokerBreakdown = Array.from(brokerMap.entries()).map(([brokerId, data]) => ({
    brokerId,
    brokerName: data.brokerName,
    leadCount: data.count
  }));

  return {
    views: hostel?.viewCount || 0,
    saves: saves || (hostel?.saveCount || 0),
    contactTaps,
    calls,
    whatsAppTaps,
    totalLeads: contactTaps + calls + whatsAppTaps,
    brokerBreakdown
  };
}
