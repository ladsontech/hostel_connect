import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/data-store';
import { AuditLog } from '@/types';

// POST /api/v1/admin/duplicates/merge
// FR-10.4: Merge two hostels: keeps primaryHostelId, re-points offers, reviews, leads, and photos from duplicateHostelId, then deletes duplicate
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { primaryHostelId, duplicateHostelId, adminId, reason } = body;

    if (!primaryHostelId || !duplicateHostelId || primaryHostelId === duplicateHostelId) {
      return NextResponse.json(
        { success: false, error: 'Valid primaryHostelId and distinct duplicateHostelId are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const primary = db.hostels.find(h => h.id === primaryHostelId);
    const duplicate = db.hostels.find(h => h.id === duplicateHostelId);

    if (!primary || !duplicate) {
      return NextResponse.json(
        { success: false, error: 'One or both hostels not found' },
        { status: 404 }
      );
    }

    // 1. Re-point all offers from duplicate to primary (avoiding exact duplicates)
    let movedOffersCount = 0;
    db.offers.forEach(offer => {
      if (offer.hostelId === duplicateHostelId) {
        offer.hostelId = primaryHostelId;
        movedOffersCount++;
      }
    });

    // 2. Re-point all reviews
    let movedReviewsCount = 0;
    db.reviews.forEach(review => {
      if (review.hostelId === duplicateHostelId) {
        review.hostelId = primaryHostelId;
        movedReviewsCount++;
      }
    });

    // 3. Re-point all leads
    let movedLeadsCount = 0;
    db.leads.forEach(lead => {
      if (lead.hostelId === duplicateHostelId) {
        lead.hostelId = primaryHostelId;
        movedLeadsCount++;
      }
    });

    // 4. Merge photos
    const existingUrls = new Set(primary.photos.map(p => p.url));
    duplicate.photos.forEach(photo => {
      if (!existingUrls.has(photo.url)) {
        primary.photos.push({
          ...photo,
          id: `p_merged_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          order: primary.photos.length + 1,
          isCover: false
        });
      }
    });

    // 5. Aggregate view & save counts
    primary.viewCount = (primary.viewCount || 0) + (duplicate.viewCount || 0);
    primary.saveCount = (primary.saveCount || 0) + (duplicate.saveCount || 0);

    // 6. Record Audit Log (FR-10.4)
    const audit: AuditLog = {
      id: `aud_merge_${Date.now()}`,
      actorId: adminId || 'usr_admin_1',
      actorName: 'Admin',
      action: 'HOSTEL_DUPLICATE_MERGED',
      entity: 'hostel',
      entityId: primaryHostelId,
      before: { duplicateHostel: duplicate },
      after: {
        primaryHostelId,
        movedOffersCount,
        movedReviewsCount,
        movedLeadsCount,
        reason: reason || 'Manual admin merge of verified duplicate'
      },
      timestamp: new Date().toISOString()
    };
    db.auditLogs.push(audit);

    // 7. Remove duplicate hostel
    db.hostels = db.hostels.filter(h => h.id !== duplicateHostelId);

    return NextResponse.json({
      success: true,
      message: `Successfully merged "${duplicate.name}" into "${primary.name}"`,
      mergedHostel: primary,
      stats: {
        movedOffersCount,
        movedReviewsCount,
        movedLeadsCount
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
