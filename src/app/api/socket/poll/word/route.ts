import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { formatPollForClient, ok, err } from '@/lib/api-helpers';
import { checkProfanity } from '@/lib/profanity';
import type { PollState } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { pollId, roomCode, word, sessionId } = await req.json();
  const trimmed = (word || '').trim();
  if (!trimmed || trimmed.length > 30) return err('Word must be 1–30 characters.');
  if (checkProfanity(trimmed)) return err('Inappropriate content.');

  const poll = await prisma.poll.findUnique({ where: { id: pollId }, include: { room: true } });
  if (!poll || poll.state !== 'open') return err('Word cloud is not accepting submissions.');

  const recent = await prisma.wordResponse.findFirst({
    where: { pollId, sessionId, createdAt: { gte: new Date(Date.now() - 1500) } },
  });
  if (recent) return err('Please wait before submitting another word.');

  await prisma.wordResponse.create({ data: { pollId, word: trimmed, sessionId } });

  const updated = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: { include: { votes: true } }, words: true },
  });
  if (updated) {
    const code = (poll.room?.code || roomCode).toUpperCase();
    const formatted = formatPollForClient(updated, sessionId, updated.state as PollState);
    await triggerRoom(code, 'poll:update', formatted);
    await triggerRoom(code, 'wordcloud:update', formatted.words || []);
  }
  return ok({ ok: true });
}
