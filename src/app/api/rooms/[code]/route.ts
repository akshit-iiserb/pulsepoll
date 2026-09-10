import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/rooms/[code] — Get room info by code
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        requireModeration: true,
        createdAt: true,
        _count: { select: { questions: true, polls: true } },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    return NextResponse.json({ room });
  } catch (err) {
    console.error('GET /api/rooms/[code] error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PATCH /api/rooms/[code] — Update room settings
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json();
    const { hostSecret, requireModeration, isActive, name } = body;

    const room = await prisma.room.findUnique({ where: { code: code.toUpperCase() } });
    if (!room || room.hostSecret !== hostSecret) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const updated = await prisma.room.update({
      where: { id: room.id },
      data: {
        ...(name !== undefined && { name }),
        ...(requireModeration !== undefined && { requireModeration }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ room: updated });
  } catch (err) {
    console.error('PATCH /api/rooms/[code] error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
