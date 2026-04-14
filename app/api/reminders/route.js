import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/reminders?showCompleted=true
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const showCompleted = searchParams.get('showCompleted') === 'true';

    const reminders = await prisma.reminder.findMany({
      where: showCompleted ? {} : { completed: false },
      orderBy: { eventDate: 'asc' },
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('[reminders] GET ERROR:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Server error: ' + (error?.message ?? 'Unknown error') },
      { status: 500 }
    );
  }
}

// POST /api/reminders
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, type, eventDate, clientName, notes } = body;

    if (!title || !type || !eventDate) {
      return NextResponse.json(
        { error: 'Title, type, and event date are required.' },
        { status: 400 }
      );
    }

    const validTypes = ['license', 'rates', 'payment', 'anniversary'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid reminder type.' }, { status: 400 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        title,
        type,
        eventDate,
        clientName: clientName || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error('[reminders] POST ERROR:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Server error: ' + (error?.message ?? 'Unknown error') },
      { status: 500 }
    );
  }
}
