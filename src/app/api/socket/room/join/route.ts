import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerRoom } from '@/lib/pusher';
import { formatPollForClient, toQA, getLeaderboard, ok, err } from '@/lib/api-helpers';
import type { PollState } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { roomCode, sessionId } = await req.json();
  const code = (roomCode as string).toUpperCase();

  const room = await prisma.room.findUnique({
    where: { code },
    include: {
      polls: {
        include: { options: { include: { votes: true } }, words: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      questions: {
        where: { status: { in: ['approved', 'answered', 'pinned'] } },
        orderBy: [{ upvotes: 'desc' }, { createdAt: 'asc' }],
      },
      quizzes: {
        where: { state: 'active' },
        include: { questions: { orderBy: { order: 'asc' } } },
        take: 1,
      },
    },
  });

  if (!room || !room.isActive) return err('Room not found or has ended.', 404);

  const activePoll = room.polls[0] || null;
  const activeQuiz = room.quizzes[0] || null;
  const formattedPoll = activePoll
    ? formatPollForClient(activePoll, sessionId, activePoll.state as PollState)
    : null;

  const state = {
    room: {
      id: room.id, code: room.code, name: room.name,
      isActive: room.isActive, requireModeration: room.requireModeration, createdAt: room.createdAt,
    },
    activePoll: formattedPoll,
    questions: room.questions.map((q) => toQA(q, false)),
    activeQuiz: activeQuiz
      ? {
          ...activeQuiz,
          state: activeQuiz.state as any,
          questions: activeQuiz.questions.map((q) => ({ ...q, options: JSON.parse(q.options) })),
        }
      : null,
    leaderboard: await getLeaderboard(room.id),
    participantCount: 1,
  };

  return ok(state);
}
