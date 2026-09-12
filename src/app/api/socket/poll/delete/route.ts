import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { pollId, hostSecret } = await req.json();

  const poll = await prisma.poll.findUnique({ where: { id: pollId }, include: { room: true } });
  if (!poll || poll.room.hostSecret !== hostSecret) return err('Unauthorized', 401);

  await prisma.poll.delete({ where: { id: pollId } });
  await triggerRoom(poll.room.code, 'poll:removed', pollId);
  return ok({ ok: true });
}
