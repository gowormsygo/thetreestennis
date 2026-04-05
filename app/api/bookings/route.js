import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
import { timesOverlap, getTodayStr, getMaxDateStr, timeToMinutes, minutesToTime } from '../../../lib/utils';

// GET /api/bookings?userId=123
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId'), 10);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

// POST /api/bookings — create a new booking
export async function POST(request) {
  try {
    const { userId, date, startTime, endTime, numPlayers } = await request.json();

    if (!userId || !date || !startTime || !endTime || !numPlayers) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Validate date range
    const today = getTodayStr();
    const maxDate = getMaxDateStr();
    if (date < today) {
      return NextResponse.json({ error: 'You cannot book a date in the past.' }, { status: 400 });
    }
    if (date > maxDate) {
      return NextResponse.json({ error: 'You can only book up to 7 days in advance.' }, { status: 400 });
    }

    // Validate times
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    const duration = endMins - startMins;

    if (startMins < 6 * 60) {
      return NextResponse.json({ error: 'Bookings start from 6:00 AM.' }, { status: 400 });
    }
    if (endMins > 22 * 60) {
      return NextResponse.json({ error: 'Bookings must end by 10:00 PM.' }, { status: 400 });
    }
    if (duration < 60 || duration > 120) {
      return NextResponse.json({ error: 'Slot duration must be between 1 and 2 hours.' }, { status: 400 });
    }

    // Validate numPlayers
    if (numPlayers < 1 || numPlayers > 8) {
      return NextResponse.json({ error: 'Number of players must be between 1 and 8.' }, { status: 400 });
    }

    // Check: user already has a booking on this date
    const existingUserBooking = await prisma.booking.findFirst({
      where: { userId, date },
    });
    if (existingUserBooking) {
      return NextResponse.json({
        error: 'You already have a booking on this day. Only 1 booking per person per day is allowed.',
      }, { status: 400 });
    }

    // Check: no overlap with other bookings on this date
    const dayBookings = await prisma.booking.findMany({ where: { date } });
    const hasConflict = dayBookings.some((b) =>
      timesOverlap(startTime, endTime, b.startTime, b.endTime)
    );
    if (hasConflict) {
      return NextResponse.json({ error: 'That time slot is already taken. Please choose another time.' }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: { userId, date, startTime, endTime, numPlayers },
      include: { user: true },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
