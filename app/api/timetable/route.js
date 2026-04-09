import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getTodayStr, getMaxDateStr } from '../../../lib/utils';

export const dynamic = 'force-dynamic';

// GET /api/timetable — returns all bookings for the next 7 days with user names
export async function GET() {
  try {
    const today = getTodayStr();
    const maxDate = getMaxDateStr();

    const bookings = await prisma.booking.findMany({
      where: {
        date: { gte: today, lte: maxDate },
      },
      include: { user: { select: { name: true, id: true } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    console.log('[timetable] GET found', bookings.length, 'bookings from', today, 'to', maxDate);
    return NextResponse.json({ bookings, from: today, to: maxDate });
  } catch (error) {
    console.error('[timetable] ERROR:', error?.message ?? error, error?.stack);
    return NextResponse.json(
      { error: 'Server error: ' + (error?.message ?? 'Unknown error') },
      { status: 500 }
    );
  }
}
