import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { formatPollForClient, ok, err } from '@/lib/api-helpers';
import type { PollState } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { pollId, state, hostSecret } = await req.json();

  const poll = await prisma.poll.findUnique({ where: { id: pollId }, include: { room: true } });
  if (!poll || poll.room.hostSecret !== hostSecret) return err('Unauthorized', 401);

  const updated = await prisma.poll.update({
    where: { id: pollId },
    data: { state },
    include: { options: { include: { votes: true } }, words: true },
  });

  const formatted = formatPollForClient(updated, '', state as PollState);
  await triggerRoom(poll.room.code, 'poll:update', formatted);
  if (formatted.type === 'word-cloud') {
    await triggerRoom(poll.room.code, 'wordcloud:update', formatted.words || []);
  }
  return ok(formatted);
}
