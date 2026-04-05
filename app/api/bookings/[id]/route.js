import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { timesOverlap, getTodayStr, getMaxDateStr, timeToMinutes } from '../../../../lib/utils';

// PUT /api/bookings/[id] — update a booking (change time/date)
export async function PUT(request, { params }) {
  try {
    const bookingId = parseInt(params.id, 10);
    const { userId, date, startTime, endTime, numPlayers } = await request.json();

    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'You can only modify your own bookings.' }, { status: 403 });
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

    if (startMins < 6 * 60 || endMins > 22 * 60 || duration < 60 || duration > 120) {
      return NextResponse.json({ error: 'Invalid time slot.' }, { status: 400 });
    }

    // Check: user already has a booking on the new date (excluding this booking)
    if (date !== existing.date) {
      const existingUserBooking = await prisma.booking.findFirst({
        where: { userId, date, NOT: { id: bookingId } },
      });
      if (existingUserBooking) {
        return NextResponse.json({
          error: 'You already have a booking on that day.',
        }, { status: 400 });
      }
    }

    // Check overlap (exclude this booking)
    const dayBookings = await prisma.booking.findMany({
      where: { date, NOT: { id: bookingId } },
    });
    const hasConflict = dayBookings.some((b) =>
      timesOverlap(startTime, endTime, b.startTime, b.endTime)
    );
    if (hasConflict) {
      return NextResponse.json({ error: 'That time slot is already taken. Please choose another time.' }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { date, startTime, endTime, numPlayers },
      include: { user: true },
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

// DELETE /api/bookings/[id]
export async function DELETE(request, { params }) {
  try {
    const bookingId = parseInt(params.id, 10);
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId'), 10);

    const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: 'You can only cancel your own bookings.' }, { status: 403 });
    }

    // Allow cancellation only for future bookings
    const today = getTodayStr();
    if (existing.date < today) {
      return NextResponse.json({ error: 'You cannot cancel a past booking.' }, { status: 400 });
    }

    await prisma.booking.delete({ where: { id: bookingId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
