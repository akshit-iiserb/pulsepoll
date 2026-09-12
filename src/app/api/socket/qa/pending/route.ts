import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toQA, ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { roomCode, hostSecret } = await req.json();
  const room = await prisma.room.findUnique({ where: { code: (roomCode as string).toUpperCase() } });
  if (!room || room.hostSecret !== hostSecret) return err('Unauthorized', 401);

  const pending = await prisma.qAQuestion.findMany({
    where: { roomId: room.id, status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });
  return ok({ pendingQueue: pending.map((q) => toQA(q, false)) });
}
