import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/data-store';
import { checkForDuplicates } from '@/lib/duplicate-detector';

// POST /api/v1/hostels/check-duplicate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, lat, lng, custodianPhone } = body;

    if (!name || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: 'Name, latitude and longitude are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const result = checkForDuplicates(
      {
        name,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        custodianPhone
      },
      db.hostels,
      db.offers
    );

    return NextResponse.json({
      success: true,
      duplicateDetected: result.isPotentialDuplicate,
      matchReasons: result.matchReasons,
      matchedHostel: result.matchedHostel,
      similarityScore: result.nameSimilarity,
      distanceMeters: result.distanceMeters
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
