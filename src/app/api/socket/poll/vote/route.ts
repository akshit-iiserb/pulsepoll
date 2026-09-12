import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { formatPollForClient, ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { pollId, optionIds, sessionId } = await req.json();

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { room: true },
  });
  if (!poll || poll.state !== 'open') return err('Poll is not accepting votes.');

  // DB-level dedup via unique constraint
  const existing = await prisma.vote.findUnique({
    where: { pollId_sessionId: { pollId, sessionId } },
  });
  if (existing) return err('You have already voted.');

  const idsToRecord = poll.type === 'single' ? [optionIds[0]] : optionIds;
  await Promise.all(
    idsToRecord.map((optionId: string) =>
      prisma.vote.create({ data: { pollId, optionId, sessionId } })
    )
  );

  const updated = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: { include: { votes: true } }, words: true },
  });
  if (updated) {
    const formatted = formatPollForClient(updated, sessionId, 'open');
    await triggerRoom(poll.room.code, 'poll:update', formatted);
  }
  return ok({ ok: true });
}
