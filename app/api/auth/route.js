import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { normalizeMobile } from '../../../lib/utils';

// POST /api/auth — login or register with name + mobile
export async function POST(request) {
  try {
    const { name, mobile } = await request.json();

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
      // User exists — return their profile (name might differ, that's fine)
      return NextResponse.json({ user, isNew: false });
    }

    // New user — create account
    user = await prisma.user.create({
      data: {
        name: trimmedName,
        mobile: normalizedMobile,
      },
    });

    return NextResponse.json({ user, isNew: true });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
