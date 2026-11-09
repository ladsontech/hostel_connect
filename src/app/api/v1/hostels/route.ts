import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/data-store';
import { checkForDuplicates, normalizeHostelName } from '@/lib/duplicate-detector';
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

  const db = getDatabase();

  let results = db.hostels.filter(hostel => {
    // Hidden if suspended
    if (hostel.status === 'suspended') return false;

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
      const matchingRooms = hostel.rooms.filter(room => {
        const matchesType = !roomType || room.type === roomType;
        const matchesPrice = room.rentUgx >= minPrice && room.rentUgx <= maxPrice;
        return matchesType && matchesPrice;
      });
      if (matchingRooms.length === 0) return false;
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
    hostels: results
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
          custodianPhone: sellerRole === 'custodian' ? contactPhone : undefined
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
    const newHostelId = `hst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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
      verifiedOwnerId: sellerRole === 'custodian' ? sellerId : undefined,
      scoutUserId: sellerId,
      ratingAvg: 5.0,
      ratingCount: 1,
      genderPolicy: genderPolicy || 'mixed',
      amenities: amenities || ['water', 'security'],
      photos: photos && photos.length ? photos : [
        {
          id: 'p_default',
          url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80',
          caption: 'Hostel Exterior',
          isCover: true,
          order: 1
        }
      ],
      rooms: (rooms || []).map((r: any, idx: number) => ({
        id: `rm_${newHostelId}_${idx}`,
        hostelId: newHostelId,
        name: r.name || 'Standard Room',
        type: r.type || 'single',
        rentUgx: parseInt(r.rentUgx) || 800000,
        roomsTotal: parseInt(r.roomsTotal) || 10,
        roomsAvailable: parseInt(r.roomsAvailable) || 2,
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
    const newOffer = {
      id: `off_${Date.now()}`,
      hostelId: newHostelId,
      userId: sellerId,
      userName: sellerRole === 'custodian' ? 'Hostel Management' : 'Hostel Agent',
      userRole: sellerRole,
      isVerified: true,
      isAuthorised: sellerRole === 'custodian',
      accessFeeUgx: sellerRole === 'broker' ? (parseInt(accessFeeUgx) || 0) : 0,
      contactPhone: contactPhone || '+256700000000',
      whatsapp: whatsapp || contactPhone || '+256700000000',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      responseRatePct: 100
    };

    db.offers.push(newOffer);

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
