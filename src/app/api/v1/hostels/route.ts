import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/data-store';
import { checkForDuplicates, normalizeHostelName } from '@/lib/duplicate-detector';
import { matchesIndividualRoomType, matchesRoomTypeFilter } from '@/lib/utils';
import { Hostel } from '@/types';

// GET /api/v1/hostels
// Filter parameters: q (search), campus, area, minPrice, maxPrice, roomType, gender, amenity, sort
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const campus = searchParams.get('campus') || '';
  const area = searchParams.get('area') || '';
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : 0;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : Infinity;
  const roomType = searchParams.get('roomType') || '';
  const gender = searchParams.get('gender') || '';
  const amenity = searchParams.get('amenity') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const includeUnapproved = searchParams.get('includeUnapproved') === 'true';
  const sellerId = searchParams.get('sellerId') || '';

  const db = getDatabase();

  let results = db.hostels.filter(hostel => {
    const approval = hostel.approvalStatus || 'approved';

    // Hidden if suspended (unless explicitly requested for portal review)
    if (hostel.status === 'suspended' && !includeUnapproved) return false;

    // Unapproved/rejected hostels are hidden from public student listings unless requested for seller/admin portals
    if (!includeUnapproved && approval !== 'approved') {
      if (!sellerId || hostel.scoutUserId !== sellerId) {
        return false;
      }
    }

    // Search query match (name, description, area, campus, landmark)
    if (q) {
      const matchName = hostel.name.toLowerCase().includes(q);
      const matchArea = hostel.area.toLowerCase().includes(q);
      const matchCampus = hostel.campus.toLowerCase().includes(q);
      const matchDesc = hostel.description.toLowerCase().includes(q);
      if (!matchName && !matchArea && !matchCampus && !matchDesc) {
        return false;
      }
    }

    // Campus filter
    if (campus && !hostel.campus.toLowerCase().includes(campus.toLowerCase())) {
      return false;
    }

    // Area filter
    if (area && !hostel.area.toLowerCase().includes(area.toLowerCase())) {
      return false;
    }

    // Gender policy filter
    if (gender && hostel.genderPolicy !== gender) {
      return false;
    }

    // Amenity filter
    if (amenity && !hostel.amenities.includes(amenity)) {
      return false;
    }

    // Price range & room type filter
    if (hostel.rooms && hostel.rooms.length > 0) {
      if (roomType && !matchesRoomTypeFilter(hostel.rooms, roomType)) {
        return false;
      }
      const matchingRooms = hostel.rooms.filter(room => {
        const matchesType = matchesIndividualRoomType(room, roomType);
        const matchesPrice = room.rentUgx >= minPrice && room.rentUgx <= maxPrice;
        return matchesType && matchesPrice;
      });
      if (matchingRooms.length === 0) return false;
    } else if (roomType) {
      return false;
    }

    return true;
  });

  // Sorting: relevance, price_asc, price_desc, rating
  if (sort === 'price_asc') {
    results.sort((a, b) => {
      const minA = Math.min(...a.rooms.map(r => r.rentUgx), Infinity);
      const minB = Math.min(...b.rooms.map(r => r.rentUgx), Infinity);
      return minA - minB;
    });
  } else if (sort === 'price_desc') {
    results.sort((a, b) => {
      const minA = Math.min(...a.rooms.map(r => r.rentUgx), 0);
      const minB = Math.min(...b.rooms.map(r => r.rentUgx), 0);
      return minB - minA;
    });
  } else if (sort === 'rating') {
    results.sort((a, b) => b.ratingAvg - a.ratingAvg);
  }

  return NextResponse.json({
    success: true,
    total: results.length,
    hostels: results,
    ...(includeUnapproved ? { offers: db.offers } : {})
  });
}

// POST /api/v1/hostels
// Add new hostel with Section 5 Duplicate Prevention
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      lat,
      lng,
      address,
      landmark,
      area,
      campus,
      distanceCampusApprox,
      genderPolicy,
      amenities,
      photos,
      rooms,
      sellerId,
      sellerRole,
      sellerName,
      sellerAvatarUrl,
      contactPhone,
      whatsapp,
      accessFeeUgx,
      forceCreate = false,
      duplicateBypassReason = ''
    } = body;

    const db = getDatabase();

    // Check duplicate unless forceCreate is true with a bypass reason
    if (!forceCreate) {
      const dupCheck = checkForDuplicates(
        {
          name,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          custodianPhone: sellerRole === 'custodian' ? contactPhone : undefined,
          roomTypes: Array.isArray(rooms) ? rooms.map((r: any) => r?.type).filter(Boolean) : undefined
        },
        db.hostels,
        db.offers
      );

      if (dupCheck.isPotentialDuplicate) {
        return NextResponse.json(
          {
            success: false,
            duplicateDetected: true,
            message: 'Potential duplicate hostel detected!',
            matchReasons: dupCheck.matchReasons,
            matchedHostel: dupCheck.matchedHostel
          },
          { status: 409 }
        );
      }
    }

    // Determine scout recognition (FR-6.7 Scout badge for first seller)
    // Broker uploads require admin approval before appearing in public student search
    const newHostelId = `hst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const initialApprovalStatus = sellerRole === 'broker' ? 'pending' : 'approved';
    const newHostel: Hostel = {
      id: newHostelId,
      name,
      normalizedName: normalizeHostelName(name),
      description,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address,
      landmark,
      area,
      campus,
      distanceCampusApprox: distanceCampusApprox || 'Walking distance',
      status: sellerRole === 'custodian' ? 'claimed' : 'unclaimed',
      approvalStatus: initialApprovalStatus,
      verifiedOwnerId: sellerRole === 'custodian' ? sellerId : undefined,
      scoutUserId: sellerId,
      ratingAvg: 5.0,
      ratingCount: 1,
      genderPolicy: genderPolicy || 'mixed',
      amenities: amenities || ['water', 'security'],
      photos: Array.isArray(photos) && photos.filter((p: any) => p && typeof p.url === 'string' && p.url.trim()).length > 0
        ? photos
            .filter((p: any) => p && typeof p.url === 'string' && p.url.trim())
            .map((p: any, idx: number) => ({
              id: p.id || `media_${newHostelId}_${idx}`,
              url: p.url.trim(),
              caption: typeof p.caption === 'string' ? p.caption : '',
              isCover: Boolean(p.isCover),
              order: idx + 1,
              mediaType: (p.mediaType === 'video' ? 'video' : 'image') as 'image' | 'video'
            }))
        : [
            {
              id: 'p_default',
              url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80',
              caption: 'Hostel Exterior',
              isCover: true,
              order: 1,
              mediaType: 'image' as const
            }
          ],
      rooms: (rooms || []).map((r: any, idx: number) => ({
        id: `rm_${newHostelId}_${idx}`,
        hostelId: newHostelId,
        name: r.name || 'Standard Room',
        type: r.type || 'single',
        rentUgx: Number.isFinite(Number(r.rentUgx)) ? Math.max(0, Math.round(Number(r.rentUgx))) : 800000,
        roomsTotal: Number.isFinite(Number(r.roomsTotal)) ? Math.max(1, Math.round(Number(r.roomsTotal))) : 10,
        roomsAvailable: Number.isFinite(Number(r.roomsAvailable)) ? Math.max(0, Math.round(Number(r.roomsAvailable))) : 2,
        updatedAt: new Date().toISOString(),
        updatedBy: sellerId
      })),
      lastAvailabilityConfirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      viewCount: 1,
      saveCount: 0
    };

    db.hostels.unshift(newHostel);

    // Create the seller's offer attached to this new hostel
    const sellerProfile = db.users.find(u => u.id === sellerId);
    const resolvedAvatarUrl =
      typeof sellerAvatarUrl === 'string' && sellerAvatarUrl.trim()
        ? sellerAvatarUrl.trim()
        : sellerProfile?.avatarUrl;
    const resolvedUserName =
      typeof sellerName === 'string' && sellerName.trim()
        ? sellerName.trim()
        : sellerProfile?.name || (sellerRole === 'custodian' ? 'Hostel Management' : 'Hostel Agent');

    const newOffer = {
      id: `off_${Date.now()}`,
      hostelId: newHostelId,
      userId: sellerId,
      userName: resolvedUserName,
      userRole: sellerRole,
      isVerified: true,
      isAuthorised: sellerRole === 'custodian',
      accessFeeUgx: sellerRole === 'broker' ? (parseInt(accessFeeUgx) || 0) : 0,
      contactPhone: contactPhone || '+256700000000',
      whatsapp: whatsapp || contactPhone || '+256700000000',
      avatarUrl: resolvedAvatarUrl,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      responseRatePct: 100
    };

    db.offers.push(newOffer);

    if (initialApprovalStatus === 'pending') {
      db.auditLogs.push({
        id: `aud_pending_${Date.now()}`,
        actorId: sellerId,
        actorName: sellerRole || 'broker',
        action: 'HOSTEL_SUBMITTED_FOR_ADMIN_APPROVAL',
        entity: 'hostel',
        entityId: newHostelId,
        after: { name, campus, area, approvalStatus: 'pending' },
        timestamp: new Date().toISOString()
      });
    }

    // If duplicate check was bypassed, create audit/flag log for admin review
    if (forceCreate && duplicateBypassReason) {
      db.auditLogs.push({
        id: `aud_${Date.now()}`,
        actorId: sellerId,
        actorName: sellerRole,
        action: 'DUPLICATE_BYPASS_SUBMITTED',
        entity: 'hostel',
        entityId: newHostelId,
        after: { reason: duplicateBypassReason },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      hostel: newHostel,
      offer: newOffer
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
