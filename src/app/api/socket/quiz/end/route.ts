import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { getLeaderboard, ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { quizId, hostSecret } = await req.json();
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { room: true } });
  if (!quiz || quiz.room.hostSecret !== hostSecret) return err('Unauthorized', 401);

  await prisma.quiz.update({ where: { id: quizId }, data: { state: 'finished' } });
  const leaderboard = await getLeaderboard(quiz.roomId);
  await triggerRoom(quiz.room.code, 'quiz:ended', leaderboard);
  return ok({ ok: true });
}
