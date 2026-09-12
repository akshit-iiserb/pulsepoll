import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { getApprovedQuestions, toQA, ok, err } from '@/lib/api-helpers';
import { checkProfanity } from '@/lib/profanity';
import { extractWordCloudWords } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const { roomCode, text, displayName, isAnonymous, sessionId } = await req.json();
  const code = (roomCode as string).toUpperCase();
  const trimmed = (text || '').trim();
  if (!trimmed || trimmed.length > 300) return err('Message must be 1–300 characters.');
  if (checkProfanity(trimmed)) return err('Inappropriate content.');

  const room = await prisma.room.findUnique({ where: { code } });
  if (!room) return err('Room not found.', 404);

  const recent = await prisma.qAQuestion.findFirst({
    where: { roomId: room.id, sessionId, createdAt: { gte: new Date(Date.now() - 10_000) } },
  });
  if (recent) return err('Please wait before posting again.');

  const status = room.requireModeration ? 'pending' : 'approved';
  const question = await prisma.qAQuestion.create({
    data: {
      roomId: room.id,
      text: trimmed,
      displayName: isAnonymous ? 'Anonymous' : (displayName || 'Anonymous'),
      isAnonymous,
      sessionId,
      status,
    },
  });

  if (status === 'approved') {
    const allQ = await getApprovedQuestions(room.id);
    await triggerRoom(code, 'qa:update', allQ.map((q) => toQA(q, false)));
    const words = extractWordCloudWords(allQ.map((q) => q.text));
    await triggerRoom(code, 'wordcloud:update', words);
  } else {
    await triggerRoom(code, 'qa:pending', toQA(question, false));
  }
  return ok({ ok: true });
}
