import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  INITIAL_HOSTELS,
  INITIAL_LEADS,
  INITIAL_OFFERS,
  INITIAL_PLANS,
  INITIAL_REPORTS,
  INITIAL_REVIEWS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_USERS,
} from '@/lib/data-store';

/**
 * GET /api/v1/db/seed -> Checks PostgreSQL connection status & table counts
 * POST /api/v1/db/seed -> Seeds PostgreSQL with initial Hostel Connect dataset (idempotent upsert)
 */
export async function GET() {
  try {
    const [users, hostels, rooms, offers] = await Promise.all([
      prisma.user.count(),
      prisma.hostel.count(),
      prisma.roomType.count(),
      prisma.offer.count(),
    ]);

    return NextResponse.json({
      success: true,
      connected: true,
      counts: { users, hostels, rooms, offers },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error?.message || 'Database connection failed. Check DATABASE_URL in .env',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 1. Seed Subscription Plans
    for (const plan of INITIAL_PLANS) {
      await prisma.subscriptionPlan.upsert({
        where: { id: plan.id },
        update: {
          role: plan.role,
          name: plan.name,
          priceUgx: plan.priceUgx,
          hostelCap: plan.hostelCap,
          durationDays: plan.durationDays,
          features: plan.features,
        },
        create: {
          id: plan.id,
          role: plan.role,
          name: plan.name,
          priceUgx: plan.priceUgx,
          hostelCap: plan.hostelCap,
          durationDays: plan.durationDays,
          features: plan.features,
        },
      });
    }

    // 2. Seed Users
    for (const u of INITIAL_USERS) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          phone: u.phone,
          name: u.name,
          email: u.email,
          role: u.role,
          adminRole: u.adminRole,
          status: u.status,
          isVerified: u.isVerified,
          avatarUrl: u.avatarUrl,
          university: u.university,
          course: u.course,
          idNumber: u.idNumber,
          businessName: u.businessName,
          scoutCount: u.scoutCount ?? 0,
        },
        create: {
          id: u.id,
          phone: u.phone,
          name: u.name,
          email: u.email,
          passwordHash: defaultPasswordHash,
          role: u.role,
          adminRole: u.adminRole,
          status: u.status,
          isVerified: u.isVerified,
          avatarUrl: u.avatarUrl,
          university: u.university,
          course: u.course,
          idNumber: u.idNumber,
          businessName: u.businessName,
          scoutCount: u.scoutCount ?? 0,
          createdAt: new Date(u.createdAt),
        },
      });
    }

    // 3. Seed Hostels + Photos + Rooms
    for (const h of INITIAL_HOSTELS) {
      await prisma.hostel.upsert({
        where: { id: h.id },
        update: {
          name: h.name,
          normalizedName: h.normalizedName,
          description: h.description,
          lat: h.lat,
          lng: h.lng,
          address: h.address,
          landmark: h.landmark,
          area: h.area,
          campus: h.campus,
          distanceCampusApprox: h.distanceCampusApprox,
          status: h.status,
          approvalStatus: h.approvalStatus || 'approved',
          verifiedOwnerId: h.verifiedOwnerId,
          scoutUserId: h.scoutUserId,
          ratingAvg: h.ratingAvg,
          ratingCount: h.ratingCount,
          genderPolicy: h.genderPolicy,
          amenities: h.amenities,
          viewCount: h.viewCount,
          saveCount: h.saveCount,
        },
        create: {
          id: h.id,
          name: h.name,
          normalizedName: h.normalizedName,
          description: h.description,
          lat: h.lat,
          lng: h.lng,
          address: h.address,
          landmark: h.landmark,
          area: h.area,
          campus: h.campus,
          distanceCampusApprox: h.distanceCampusApprox,
          status: h.status,
          approvalStatus: h.approvalStatus || 'approved',
          verifiedOwnerId: h.verifiedOwnerId,
          scoutUserId: h.scoutUserId,
          ratingAvg: h.ratingAvg,
          ratingCount: h.ratingCount,
          genderPolicy: h.genderPolicy,
          amenities: h.amenities,
          lastAvailabilityConfirmedAt: new Date(h.lastAvailabilityConfirmedAt),
          createdAt: new Date(h.createdAt),
          viewCount: h.viewCount,
          saveCount: h.saveCount,
        },
      });

      for (const p of h.photos) {
        const photoId = `${h.id}_${p.id}`;
        await prisma.hostelPhoto.upsert({
          where: { id: photoId },
          update: {
            url: p.url,
            caption: p.caption,
            isCover: p.isCover,
            order: p.order,
            mediaType: p.mediaType || 'image',
          },
          create: {
            id: photoId,
            hostelId: h.id,
            url: p.url,
            caption: p.caption,
            isCover: p.isCover,
            order: p.order,
            mediaType: p.mediaType || 'image',
          },
        });
      }

      for (const r of h.rooms) {
        await prisma.roomType.upsert({
          where: { id: r.id },
          update: {
            name: r.name,
            type: r.type,
            rentUgx: r.rentUgx,
            roomsTotal: r.roomsTotal,
            roomsAvailable: r.roomsAvailable,
          },
          create: {
            id: r.id,
            hostelId: h.id,
            name: r.name,
            type: r.type,
            rentUgx: r.rentUgx,
            roomsTotal: r.roomsTotal,
            roomsAvailable: r.roomsAvailable,
            updatedAt: new Date(r.updatedAt),
            updatedBy: r.updatedBy,
          },
        });
      }
    }

    // 4. Seed Offers
    for (const o of INITIAL_OFFERS) {
      await prisma.offer.upsert({
        where: { id: o.id },
        update: {
          accessFeeUgx: o.accessFeeUgx,
          contactPhone: o.contactPhone,
          whatsapp: o.whatsapp,
          status: o.status,
          isAuthorised: o.isAuthorised,
          avatarUrl: o.avatarUrl,
        },
        create: {
          id: o.id,
          hostelId: o.hostelId,
          userId: o.userId,
          userName: o.userName,
          userRole: o.userRole,
          isVerified: o.isVerified,
          isAuthorised: o.isAuthorised,
          accessFeeUgx: o.accessFeeUgx,
          contactPhone: o.contactPhone,
          whatsapp: o.whatsapp,
          status: o.status,
          notes: o.notes,
          avatarUrl: o.avatarUrl,
          residentType: o.residentType,
          createdAt: new Date(o.createdAt),
          responseRatePct: o.responseRatePct,
        },
      });
    }

    // 5. Seed Leads, Subscriptions, Reviews, Reports
    for (const l of INITIAL_LEADS) {
      await prisma.lead.upsert({
        where: { id: l.id },
        update: {},
        create: {
          id: l.id,
          studentId: l.studentId,
          studentName: l.studentName,
          studentPhone: l.studentPhone,
          hostelId: l.hostelId,
          offerId: l.offerId,
          type: l.type,
          timestamp: new Date(l.timestamp),
        },
      });
    }

    for (const s of INITIAL_SUBSCRIPTIONS) {
      await prisma.userSubscription.upsert({
        where: { id: s.id },
        update: { status: s.status, activeHostelIds: s.activeHostelIds },
        create: {
          id: s.id,
          userId: s.userId,
          planId: s.planId,
          status: s.status,
          isTrial: s.isTrial,
          startDate: new Date(s.startDate),
          endDate: new Date(s.endDate),
          activeHostelIds: s.activeHostelIds,
        },
      });
    }

    for (const rev of INITIAL_REVIEWS) {
      await prisma.review.upsert({
        where: { id: rev.id },
        update: {},
        create: {
          id: rev.id,
          hostelId: rev.hostelId,
          studentId: rev.studentId,
          studentName: rev.studentName,
          rating: rev.rating,
          text: rev.text,
          status: rev.status,
          sellerReply: rev.sellerReply,
          createdAt: new Date(rev.createdAt),
        },
      });
    }

    for (const rep of INITIAL_REPORTS) {
      await prisma.report.upsert({
        where: { id: rep.id },
        update: {},
        create: {
          id: rep.id,
          reporterId: rep.reporterId,
          reporterPhone: rep.reporterPhone,
          targetType: rep.targetType,
          targetId: rep.targetId,
          targetName: rep.targetName,
          reason: rep.reason,
          details: rep.details,
          status: rep.status,
          createdAt: new Date(rep.createdAt),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL database seeded with Hostel Connect dataset.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to seed database',
      },
      { status: 500 }
    );
  }
}

