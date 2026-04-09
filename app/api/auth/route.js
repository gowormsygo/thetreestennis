import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { normalizeMobile } from '../../../lib/utils';

export const dynamic = 'force-dynamic';

// POST /api/auth — login or register with name + mobile
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, mobile } = body;

    console.log('[auth] POST received, name:', name, 'mobile:', mobile ? '***' : undefined);

    if (!name || !mobile) {
      return NextResponse.json({ error: 'Name and mobile number are required.' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const normalizedMobile = normalizeMobile(mobile.trim());

    if (trimmedName.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (normalizedMobile.length < 6) {
      return NextResponse.json({ error: 'Please enter a valid mobile number.' }, { status: 400 });
    }

    // Look up by mobile number
    let user = await prisma.user.findUnique({
      where: { mobile: normalizedMobile },
    });

    if (user) {
      console.log('[auth] existing user found, id:', user.id);
      return NextResponse.json({ user, isNew: false });
    }

    // New user — create account
    user = await prisma.user.create({
      data: {
        name: trimmedName,
        mobile: normalizedMobile,
      },
    });

    console.log('[auth] new user created, id:', user.id);
    return NextResponse.json({ user, isNew: true });
  } catch (error) {
    console.error('[auth] ERROR:', error?.message ?? error, error?.stack);
    return NextResponse.json(
      { error: 'Server error: ' + (error?.message ?? 'Unknown error') },
      { status: 500 }
    );
  }
}
