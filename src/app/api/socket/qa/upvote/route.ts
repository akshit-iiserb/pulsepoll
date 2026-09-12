import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { getApprovedQuestions, toQA, ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { questionId, sessionId } = await req.json();

  // Toggle upvote via DB (upsert / delete)
  const existing = await prisma.upvote.findUnique({
    where: { questionId_sessionId: { questionId, sessionId } },
  });

  let increment = 1;
  if (existing) {
    await prisma.upvote.delete({ where: { questionId_sessionId: { questionId, sessionId } } });
    increment = -1;
  } else {
    await prisma.upvote.create({ data: { questionId, sessionId } });
  }

  const updated = await prisma.qAQuestion.update({
    where: { id: questionId },
    data: { upvotes: { increment } },
    include: { room: true },
  });

  const allQ = await getApprovedQuestions(updated.roomId);
  await triggerRoom(updated.room.code, 'qa:update', allQ.map((q) => toQA(q, false)));
  return ok({ ok: true, upvoted: !existing });
}
