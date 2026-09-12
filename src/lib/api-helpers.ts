import { prisma } from './prisma';
import { calculatePollResults, aggregateWordCloud } from './utils';
import type { PollState, QAStatus } from './types';

// ─── Poll Formatting ──────────────────────────────────────────────────────────

export function formatPollForClient(
  poll: {
    id: string; roomId: string; title: string; type: string; state: string; createdAt: Date;
    options: Array<{ id: string; text: string; isCorrect: boolean; votes: Array<{ sessionId: string }> }>;
    words?: Array<{ word: string; sessionId: string }>;
  },
  sessionId: string,
  state: PollState
) {
  const { totalVotes, options } = calculatePollResults(poll.options || []);
  const words = poll.words ? aggregateWordCloud(poll.words) : [];
  const wordCount = poll.words ? poll.words.length : 0;

  return {
    id: poll.id,
    roomId: poll.roomId,
    title: poll.title,
    type: poll.type as any,
    state: state as PollState,
    totalVotes: poll.type === 'word-cloud' ? wordCount : totalVotes,
    hasVoted: false,
    words,
    createdAt: poll.createdAt,
    options: options.map((o) => ({
      ...o,
      voteCount: state === 'open' ? undefined : o.voteCount,
      percentage: state === 'open' ? undefined : o.percentage,
      isCorrect: state === 'revealed' ? o.isCorrect : false,
    })),
  };
}

// ─── QA Helpers ───────────────────────────────────────────────────────────────

export function toQA(
  q: { id: string; roomId: string; text: string; displayName: string; isAnonymous: boolean; sessionId: string; upvotes: number; status: string; createdAt: Date },
  hasUpvoted = false
) {
  return { ...q, status: q.status as QAStatus, hasUpvoted };
}

export async function getApprovedQuestions(roomId: string) {
  return prisma.qAQuestion.findMany({
    where: { roomId, status: { in: ['approved', 'answered', 'pinned'] } },
    orderBy: [{ status: 'asc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
  });
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(roomId: string) {
  const entries = await prisma.leaderboardEntry.findMany({
    where: { roomId },
    orderBy: { score: 'desc' },
    take: 20,
  });
  return entries.map((e, i) => ({
    sessionId: e.sessionId,
    displayName: e.displayName,
    score: e.score,
    rank: i + 1,
  }));
}

// ─── Standard JSON responses ──────────────────────────────────────────────────

export function ok(data: unknown) {
  return Response.json(data);
}

export function err(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
