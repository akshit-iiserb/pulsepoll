import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { quizId, hostSecret } = await req.json();
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: 'asc' } }, room: true },
  });
  if (!quiz || quiz.room.hostSecret !== hostSecret) return err('Unauthorized', 401);

  await prisma.quiz.update({ where: { id: quizId }, data: { state: 'active', currentQuestionIndex: 0 } });

  const firstQ = quiz.questions[0];
  if (firstQ) {
    await triggerRoom(quiz.room.code, 'quiz:question', {
      question: { ...firstQ, options: JSON.parse(firstQ.options) },
      index: 0,
      total: quiz.questions.length,
    });
  }
  return ok({ ok: true });
}
