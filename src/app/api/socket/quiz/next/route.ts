import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { getLeaderboard, ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { quizId, hostSecret } = await req.json();
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: 'asc' } }, room: true },
  });
  if (!quiz || quiz.room.hostSecret !== hostSecret) return err('Unauthorized', 401);

  const nextIndex = quiz.currentQuestionIndex + 1;
  if (nextIndex >= quiz.questions.length) {
    await prisma.quiz.update({ where: { id: quizId }, data: { state: 'finished' } });
    const leaderboard = await getLeaderboard(quiz.roomId);
    await triggerRoom(quiz.room.code, 'quiz:ended', leaderboard);
  } else {
    await prisma.quiz.update({ where: { id: quizId }, data: { currentQuestionIndex: nextIndex } });
    const nextQ = quiz.questions[nextIndex];
    await triggerRoom(quiz.room.code, 'quiz:question', {
      question: { ...nextQ, options: JSON.parse(nextQ.options) },
      index: nextIndex,
      total: quiz.questions.length,
    });
  }
  return ok({ ok: true });
}
