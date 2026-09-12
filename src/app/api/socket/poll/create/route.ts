import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { formatPollForClient, ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { roomCode, hostSecret, poll } = await req.json();
  const code = (roomCode as string).toUpperCase();

  const room = await prisma.room.findUnique({ where: { code } });
  if (!room || room.hostSecret !== hostSecret) return err('Unauthorized', 401);

  await prisma.poll.updateMany({
    where: { roomId: room.id, state: { in: ['open', 'locked'] } },
    data: { state: 'locked' },
  });

  const newPoll = await prisma.poll.create({
    data: {
      roomId: room.id,
      title: poll.title,
      type: poll.type,
      state: 'open',
      options: { create: (poll.options || []).map((o: any) => ({ text: o.text, isCorrect: o.isCorrect })) },
    },
    include: { options: { include: { votes: true } }, words: true },
  });

  const formatted = formatPollForClient(newPoll, '', 'open');
  await triggerRoom(code, 'poll:new', formatted);
  if (formatted.type === 'word-cloud') {
    await triggerRoom(code, 'wordcloud:update', formatted.words || []);
  }
  return ok(formatted);
}
