import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/data-store';
import { normalizeHostelName } from '@/lib/duplicate-detector';

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
// Update hostel details, photos/videos, and rooms (BR-1: Custodian owns claimed rent/availability; broker uploader can edit their hostel details & media)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    name,
    description,
    campus,
    area,
    address,
    landmark,
    distanceCampusApprox,
    genderPolicy,
    amenities,
    photos,
    rooms,
    approvalStatus,
    status,
    userId,
    userRole
  } = body;

  const db = getDatabase();
  const hostel = db.hostels.find(h => h.id === id);
  if (!hostel) {
    return NextResponse.json({ success: false, error: 'Hostel not found' }, { status: 404 });
  }

  const isClaimed = hostel.status === 'claimed';
  const isUploaderBroker = userRole === 'broker' && hostel.scoutUserId === userId;

  // Only allow edits if Custodian/Admin, the uploading Broker, or any Broker editing an unclaimed listing
  if (userRole === 'broker' && isClaimed && !isUploaderBroker) {
    return NextResponse.json(
      { success: false, error: 'You can only edit hostels you uploaded or unclaimed listings.' },
      { status: 403 }
    );
  }

  // Detail & media updates
  if (typeof name === 'string' && name.trim()) {
    hostel.name = name.trim();
    hostel.normalizedName = normalizeHostelName(name.trim());
  }
  if (typeof description === 'string') hostel.description = description.trim();
  if (typeof campus === 'string' && campus.trim()) hostel.campus = campus.trim();
  if (typeof area === 'string' && area.trim()) hostel.area = area.trim();
  if (typeof address === 'string' && address.trim()) hostel.address = address.trim();
  if (typeof landmark === 'string') hostel.landmark = landmark.trim();
  if (typeof distanceCampusApprox === 'string' && distanceCampusApprox.trim()) {
    hostel.distanceCampusApprox = distanceCampusApprox.trim();
  }
  if (genderPolicy === 'mixed' || genderPolicy === 'girls_only' || genderPolicy === 'boys_only') {
    hostel.genderPolicy = genderPolicy;
  }
  if (Array.isArray(amenities)) {
    hostel.amenities = amenities;
  }

  // Admin-only approval & listing status moderation
  if (userRole === 'admin') {
    if (approvalStatus === 'approved' || approvalStatus === 'rejected' || approvalStatus === 'pending') {
      const previousApproval = hostel.approvalStatus || 'approved';
      hostel.approvalStatus = approvalStatus;
      db.auditLogs.push({
        id: `aud_approval_${Date.now()}`,
        actorId: userId || 'usr_admin_1',
        actorName: 'Admin',
        action: `HOSTEL_APPROVAL_${approvalStatus.toUpperCase()}`,
        entity: 'hostel',
        entityId: id,
        before: { approvalStatus: previousApproval },
        after: { approvalStatus },
        timestamp: new Date().toISOString(),
      });
    }
    if (status === 'claimed' || status === 'unclaimed' || status === 'suspended') {
      const previousStatus = hostel.status;
      hostel.status = status;
      db.auditLogs.push({
        id: `aud_status_${Date.now()}`,
        actorId: userId || 'usr_admin_1',
        actorName: 'Admin',
        action: `HOSTEL_STATUS_${status.toUpperCase()}`,
        entity: 'hostel',
        entityId: id,
        before: { status: previousStatus },
        after: { status },
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (Array.isArray(photos)) {
    const cleaned = photos
      .filter((p: any) => p && typeof p.url === 'string' && p.url.trim().length > 0)
      .map((p: any, idx: number) => ({
        id: p.id || `media_${id}_${idx}_${Date.now()}`,
        url: p.url.trim(),
        caption: typeof p.caption === 'string' ? p.caption : '',
        isCover: Boolean(p.isCover),
        order: idx + 1,
        mediaType: (p.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video',
      }));

    if (cleaned.length > 0 && !cleaned.some(p => p.mediaType !== 'video' && p.isCover)) {
      const firstImg = cleaned.find(p => p.mediaType !== 'video') || cleaned[0];
      firstImg.isCover = true;
    }
    hostel.photos = cleaned;
  }

  // Room rent / vacancy updates (BR-1: blocked only when a broker attempts to overwrite a custodian-claimed hostel's rooms)
  if (rooms && Array.isArray(rooms)) {
    if (isClaimed && userRole === 'broker') {
      if (!name && !description && !photos) {
        return NextResponse.json(
          { success: false, error: 'Brokers cannot modify rent or availability for a claimed hostel. Custodian owns these values.' },
          { status: 403 }
        );
      }
    } else {
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
  }

  return NextResponse.json({
    success: true,
    message: 'Hostel updated successfully',
    hostel
  });
}
