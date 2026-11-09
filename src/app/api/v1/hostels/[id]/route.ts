import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/data-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDatabase();

  const hostel = db.hostels.find(h => h.id === id);
  if (!hostel) {
    return NextResponse.json({ success: false, error: 'Hostel not found' }, { status: 404 });
  }

  // Increment view count
  hostel.viewCount = (hostel.viewCount || 0) + 1;

  // Find active offers (ordered by: verified Custodian first, authorised Brokers, other Brokers - FR-3.1)
  const offers = db.offers
    .filter(o => o.hostelId === id && o.status === 'active')
    .sort((a, b) => {
      // 1. Custodian comes first
      if (a.userRole === 'custodian' && b.userRole !== 'custodian') return -1;
      if (b.userRole === 'custodian' && a.userRole !== 'custodian') return 1;

      // 2. Authorised brokers come before independent brokers
      if (a.isAuthorised && !b.isAuthorised) return -1;
      if (b.isAuthorised && !a.isAuthorised) return 1;

      // 3. Then by response rate
      return b.responseRatePct - a.responseRatePct;
    });

  // Find approved reviews
  const reviews = db.reviews.filter(r => r.hostelId === id && r.status === 'approved');

  return NextResponse.json({
    success: true,
    hostel,
    offers,
    reviews
  });
}

// PUT /api/v1/hostels/[id]
// Update room types, rent, or availability (BR-1: only Custodian can update rent/availability if claimed)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { rooms, userId, userRole } = body;

  const db = getDatabase();
  const hostel = db.hostels.find(h => h.id === id);
  if (!hostel) {
    return NextResponse.json({ success: false, error: 'Hostel not found' }, { status: 404 });
  }

  // BR-1: A Broker cannot change rent or availability set by a Custodian
  if (hostel.status === 'claimed' && userRole === 'broker') {
    return NextResponse.json(
      { success: false, error: 'Brokers cannot modify rent or availability for a claimed hostel. Custodian owns these values.' },
      { status: 403 }
    );
  }

  if (rooms && Array.isArray(rooms)) {
    hostel.rooms = rooms.map((r: any, idx: number) => ({
      id: r.id || `rm_${id}_${idx}`,
      hostelId: id,
      name: r.name,
      type: r.type,
      rentUgx: parseInt(r.rentUgx),
      roomsTotal: parseInt(r.roomsTotal),
      roomsAvailable: parseInt(r.roomsAvailable),
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    }));

    hostel.lastAvailabilityConfirmedAt = new Date().toISOString();
  }

  return NextResponse.json({
    success: true,
    message: 'Hostel updated successfully',
    hostel
  });
}
