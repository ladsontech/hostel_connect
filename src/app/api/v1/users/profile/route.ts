import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/data-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '';

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 }
    );
  }

  const db = getDatabase();
  const user = db.users.find(u => u.id === userId) || null;
  return NextResponse.json({ success: true, user });
}

async function handleProfileUpdate(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      avatarUrl,
      name,
      phone,
      businessName,
      role,
    } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    let user = db.users.find(u => u.id === userId);

    if (!user) {
      user = {
        id: userId,
        phone: typeof phone === 'string' && phone ? phone : '+256700000000',
        name: typeof name === 'string' && name ? name : 'Campus Member',
        role:
          role === 'custodian' ||
          role === 'broker' ||
          role === 'admin' ||
          role === 'student'
            ? role
            : 'broker',
        status: 'active',
        isVerified: true,
        businessName: typeof businessName === 'string' ? businessName : undefined,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
    }

    if (avatarUrl !== undefined) {
      const cleanedAvatar =
        typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
      user.avatarUrl = cleanedAvatar;
    }

    if (typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }
    if (typeof phone === 'string' && phone.trim()) {
      user.phone = phone.trim();
    }
    if (typeof businessName === 'string') {
      user.businessName = businessName.trim() || undefined;
    }

    // Sync updated profile picture & details to every booking offer attached to this user
    let syncedOffersCount = 0;
    for (const offer of db.offers) {
      if (offer.userId === user.id) {
        if (avatarUrl !== undefined) {
          offer.avatarUrl = user.avatarUrl;
        }
        if (typeof name === 'string' && name.trim()) {
          offer.userName = user.name;
        }
        if (typeof phone === 'string' && phone.trim()) {
          offer.contactPhone = user.phone;
          offer.whatsapp = user.phone;
        }
        syncedOffersCount++;
      }
    }

    return NextResponse.json({
      success: true,
      user,
      syncedOffersCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return handleProfileUpdate(request);
}

export async function POST(request: Request) {
  return handleProfileUpdate(request);
}
