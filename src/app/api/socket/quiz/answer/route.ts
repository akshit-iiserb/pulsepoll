import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { getLeaderboard, ok, err } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  const { questionId, optionId, sessionId, timeTaken, displayName } = await req.json();
  const q = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    include: { quiz: { include: { room: true } } },
  });
  if (!q) return err('Question not found.', 404);

  const options: Array<{ id: string; isCorrect: boolean }> = JSON.parse(q.options);
  const isCorrect = options.find((o) => o.id === optionId)?.isCorrect ?? false;

  if (isCorrect) {
    const score = Math.max(100, Math.round(1000 * (1 - timeTaken / q.timeLimit)));
    await prisma.leaderboardEntry.upsert({
      where: { roomId_sessionId: { roomId: q.quiz.roomId, sessionId } },
      create: { roomId: q.quiz.roomId, sessionId, displayName: displayName || sessionId, score },
      update: { score: { increment: score }, displayName: displayName || sessionId },
    });
    const leaderboard = await getLeaderboard(q.quiz.roomId);
    await triggerRoom(q.quiz.room.code, 'leaderboard:update', leaderboard);
  }
  return ok({ ok: true, isCorrect });
}
