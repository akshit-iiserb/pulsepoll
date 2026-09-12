import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { getApprovedQuestions, toQA, ok, err } from '@/lib/api-helpers';
import { extractWordCloudWords } from '@/lib/utils';
import type { QAStatus } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { questionId, action, hostSecret } = await req.json();

  const question = await prisma.qAQuestion.findUnique({
    where: { id: questionId },
    include: { room: true },
  });
  if (!question || question.room.hostSecret !== hostSecret) return err('Unauthorized', 401);

  await prisma.qAQuestion.update({ where: { id: questionId }, data: { status: action } });

  const allQ = await getApprovedQuestions(question.roomId);
  await triggerRoom(question.room.code, 'qa:update', allQ.map((q) => toQA(q, false)));

  const words = extractWordCloudWords(allQ.map((q) => q.text));
  await triggerRoom(question.room.code, 'wordcloud:update', words);

  const pending = await prisma.qAQuestion.findMany({
    where: { roomId: question.roomId, status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });
  // Return pending queue so host can update its local state
  return ok({ ok: true, pendingQueue: pending.map((q) => toQA(q, false)) });
}
