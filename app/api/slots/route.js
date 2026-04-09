import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { generateTimeSlots, timesOverlap, minutesToTime, timeToMinutes } from '../../../lib/utils';

export const dynamic = 'force-dynamic';

// GET /api/slots?date=YYYY-MM-DD&duration=60|90|120
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '60', 10);

    console.log('[slots] GET date:', date, 'duration:', duration);

    if (!date) {
      return NextResponse.json({ error: 'Date is required.' }, { status: 400 });
    }

    // Validate duration
    if (![60, 90, 120].includes(duration)) {
      return NextResponse.json({ error: 'Duration must be 60, 90, or 120 minutes.' }, { status: 400 });
    }

    // Get all bookings for this date
    const bookings = await prisma.booking.findMany({
      where: { date },
    });

    console.log('[slots] found', bookings.length, 'existing bookings on', date);

    const allStartTimes = generateTimeSlots(); // 06:00 to 20:00 in 30-min steps
    const available = [];

    for (const startTime of allStartTimes) {
      const endMinutes = timeToMinutes(startTime) + duration;
      // Must end by 22:00 (1320 minutes)
      if (endMinutes > 22 * 60) continue;

      const endTime = minutesToTime(endMinutes);

      // Check overlap with existing bookings
      const isBooked = bookings.some((b) =>
        timesOverlap(startTime, endTime, b.startTime, b.endTime)
      );

      available.push({
        startTime,
        endTime,
        available: !isBooked,
      });
    }

    console.log('[slots] returning', available.length, 'slots');
    return NextResponse.json({ slots: available, bookings });
  } catch (error) {
    console.error('[slots] ERROR:', error?.message ?? error, error?.stack);
    return NextResponse.json(
      { error: 'Server error: ' + (error?.message ?? 'Unknown error') },
      { status: 500 }
    );
  }
}
