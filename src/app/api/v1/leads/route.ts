import { NextResponse } from 'next/server';
import { recordLead, getHostelAnalytics } from '@/lib/lead-logger';
import { getDatabase } from '@/lib/data-store';

// POST /api/v1/leads
// FR-3.3: Every tap on Contact, Call, WhatsApp and Save creates a Lead record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, studentName, studentPhone, hostelId, offerId, type } = body;

    if (!studentId || !hostelId || !type) {
      return NextResponse.json(
        { success: false, error: 'studentId, hostelId, and type are required' },
        { status: 400 }
      );
    }

    const lead = recordLead({
      studentId,
      studentName,
      studentPhone,
      hostelId,
      offerId,
      type
    });

    return NextResponse.json({
      success: true,
      message: 'Lead recorded',
      lead
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/v1/leads
// FR-9.1: Fetch seller analytics per listing (views, saves, contact taps, calls, WhatsApp)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostelId = searchParams.get('hostelId');
  const offerId = searchParams.get('offerId') || undefined;
  const timeframe = (searchParams.get('timeframe') as any) || 'semester';

  if (!hostelId) {
    // Return all leads if admin
    const db = getDatabase();
    return NextResponse.json({
      success: true,
      total: db.leads.length,
      leads: db.leads.slice(-50).reverse()
    });
  }

  const analytics = getHostelAnalytics(hostelId, timeframe, offerId);

  return NextResponse.json({
    success: true,
    hostelId,
    timeframe,
    analytics
  });
}
