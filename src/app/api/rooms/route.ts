import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRoomCode, generateHostSecret } from '@/lib/utils';

// POST /api/rooms — Create a new room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, requireModeration = false } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Room name must be at least 2 characters.' }, { status: 400 });
    }

    // Generate unique room code
    let code = generateRoomCode();
    let attempts = 0;
    while (await prisma.room.findUnique({ where: { code } })) {
      code = generateRoomCode();
      if (++attempts > 10) {
        return NextResponse.json({ error: 'Could not generate unique room code.' }, { status: 500 });
      }
    }

    const hostSecret = generateHostSecret();

    const room = await prisma.room.create({
      data: {
        code,
        hostSecret,
        name: name.trim(),
        requireModeration,
      },
    });

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        isActive: room.isActive,
        requireModeration: room.requireModeration,
        createdAt: room.createdAt,
      },
      hostSecret, // Only returned once — client must store this
    });
  } catch (err) {
    console.error('POST /api/rooms error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
