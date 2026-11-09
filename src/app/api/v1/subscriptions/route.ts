import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/data-store';
import { PaymentTransaction, UserSubscription } from '@/types';

// GET /api/v1/subscriptions?userId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const db = getDatabase();

  if (!userId) {
    return NextResponse.json({
      success: true,
      plans: db.plans,
      subscriptions: db.subscriptions
    });
  }

  const userSub = db.subscriptions.find(s => s.userId === userId);
  const userPayments = db.payments.filter(p => p.userId === userId);

  return NextResponse.json({
    success: true,
    subscription: userSub || null,
    payments: userPayments,
    plans: db.plans
  });
}

// POST /api/v1/subscriptions (MoMo / Airtel Money payment transaction)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, planId, provider, phone, hostelId } = body;

    const db = getDatabase();
    const plan = db.plans.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Subscription plan not found' }, { status: 404 });
    }

    const txId = `momo_tx_${Date.now()}`;
    const payment: PaymentTransaction = {
      id: txId,
      userId,
      subscriptionId: `sub_${userId}`,
      amountUgx: plan.priceUgx,
      provider: provider || 'mtn_momo',
      phone: phone || '+256770000000',
      reference: `UG-MOMO-${Date.now().toString().slice(-6)}`,
      status: 'success', // Simulated instant aggregator confirmation
      createdAt: new Date().toISOString()
    };

    db.payments.push(payment);

    // Update or create active subscription (120 days semester)
    const existingSubIndex = db.subscriptions.findIndex(s => s.userId === userId);
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const activeSub: UserSubscription = {
      id: `sub_${userId}`,
      userId,
      planId: plan.id,
      status: 'active',
      isTrial: false,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      activeHostelIds: hostelId ? [hostelId] : []
    };

    if (existingSubIndex >= 0) {
      db.subscriptions[existingSubIndex] = activeSub;
    } else {
      db.subscriptions.push(activeSub);
    }

    // Reactivate any hidden offers for this user (FR-6.5)
    db.offers.forEach(o => {
      if (o.userId === userId) {
        o.status = 'active';
      }
    });

    return NextResponse.json({
      success: true,
      message: `Payment of UGX ${plan.priceUgx.toLocaleString()} via ${provider === 'mtn_momo' ? 'MTN MoMo' : 'Airtel Money'} confirmed. Subscription active until ${endDate.toDateString()}`,
      payment,
      subscription: activeSub
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
