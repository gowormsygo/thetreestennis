import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH /api/reminders/[id] — toggle complete or update fields
export async function PATCH(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 });
    }

    const body = await request.json();
    const reminder = await prisma.reminder.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ reminder });
  } catch (error) {
    console.error('[reminders] PATCH ERROR:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Server error: ' + (error?.message ?? 'Unknown error') },
      { status: 500 }
    );
  }
}

// DELETE /api/reminders/[id]
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 });
    }

    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[reminders] DELETE ERROR:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Server error: ' + (error?.message ?? 'Unknown error') },
      { status: 500 }
    );
  }
}
