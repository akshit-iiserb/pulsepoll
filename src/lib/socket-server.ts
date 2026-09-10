import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, PollState, QAStatus } from './types';
import { prisma } from './prisma';
import { store } from './store';
import { checkProfanity } from './profanity';
import { extractWordCloudWords, calculatePollResults, aggregateWordCloud } from './utils';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type S = Socket<ClientToServerEvents, ServerToClientEvents>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getApprovedQuestions(roomId: string) {
  return prisma.qAQuestion.findMany({
    where: { roomId, status: { in: ['approved', 'answered', 'pinned'] } },
    orderBy: [{ status: 'asc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
  });
}

function toQA(q: { id: string; roomId: string; text: string; displayName: string; isAnonymous: boolean; sessionId: string; upvotes: number; status: string; createdAt: Date }, hasUpvoted = false) {
  return { ...q, status: q.status as QAStatus, hasUpvoted };
}

async function getLeaderboard(roomId: string) {
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

function formatPollForClient(
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
  const hasVoted = poll.type === 'word-cloud'
    ? (poll.words ? poll.words.some((w) => w.sessionId === sessionId) : false)
    : store.hasVoted(poll.id, sessionId);

  return {
    id: poll.id,
    roomId: poll.roomId,
    title: poll.title,
    type: poll.type as any,
    state: state as PollState,
    totalVotes: poll.type === 'word-cloud' ? wordCount : totalVotes,
    hasVoted,
    words,
    createdAt: poll.createdAt,
    // Hide vote counts when state is 'open' (anti-bias)
    options: options.map((o) => ({
      ...o,
      voteCount: state === 'open' ? undefined : o.voteCount,
      percentage: state === 'open' ? undefined : o.percentage,
      // Only reveal isCorrect when state is 'revealed'
      isCorrect: state === 'revealed' ? o.isCorrect : false,
    })),
  };
}

// ─── Socket Handler Setup ─────────────────────────────────────────────────────

export function setupSocketHandlers(io: IO) {
  io.on('connection', (socket: S) => {
    // ── Room Join ──────────────────────────────────────────────────────────────
    socket.on('room:join', async ({ roomCode, sessionId, displayName }) => {
      try {
        const room = await prisma.room.findUnique({
          where: { code: roomCode.toUpperCase() },
          include: {
            polls: {
              include: {
                options: { include: { votes: true } },
                words: true,
              },
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

        if (!room || !room.isActive) {
          socket.emit('error', 'Room not found or has ended.');
          return;
        }

        await socket.join(roomCode.toUpperCase());
        store.addParticipant(roomCode.toUpperCase(), sessionId, displayName, socket.id);

        const activePoll = room.polls[0] || null;
        const activeQuiz = room.quizzes[0] || null;

        const formattedPoll = activePoll
          ? formatPollForClient(activePoll, sessionId, activePoll.state as PollState)
          : null;

        socket.emit('room:joined', {
          room: {
            id: room.id,
            code: room.code,
            name: room.name,
            isActive: room.isActive,
            requireModeration: room.requireModeration,
            createdAt: room.createdAt,
          },
          activePoll: formattedPoll,
          questions: room.questions.map((q) => toQA(q, store.hasUpvoted(q.id, sessionId))),
          activeQuiz: activeQuiz
            ? {
                ...activeQuiz,
                state: activeQuiz.state as import('./types').QuizState,
                questions: activeQuiz.questions.map((q) => ({
                  ...q,
                  options: JSON.parse(q.options) as import('./types').QuizOption[],
                })),
              }
            : null,
          leaderboard: await getLeaderboard(room.id),
          participantCount: store.getParticipantCount(roomCode.toUpperCase()),
        });

        io.to(roomCode.toUpperCase()).emit(
          'room:participants',
          store.getParticipantCount(roomCode.toUpperCase())
        );

        if (formattedPoll && formattedPoll.type === 'word-cloud') {
          socket.emit('wordcloud:update', formattedPoll.words || []);
        } else {
          // Emit word cloud from existing questions
          const words = extractWordCloudWords(room.questions.map((q) => q.text));
          if (words.length > 0) socket.emit('wordcloud:update', words);
        }
      } catch (err) {
        console.error('room:join error:', err);
        socket.emit('error', 'Failed to join room.');
      }
    });

    // ── Poll Create ────────────────────────────────────────────────────────────
    socket.on('poll:create', async ({ roomCode, hostSecret, poll }) => {
      try {
        const room = await prisma.room.findUnique({ where: { code: roomCode.toUpperCase() } });
        if (!room || room.hostSecret !== hostSecret) {
          socket.emit('error', 'Unauthorized.');
          return;
        }

        // Close any existing active poll first
        await prisma.poll.updateMany({
          where: { roomId: room.id, state: { in: ['open', 'locked'] } },
          data: { state: 'locked' },
        });

        const newPoll = await prisma.poll.create({
          data: {
            roomId: room.id,
            title: poll.title,
            type: poll.type,
            state: 'open',
            options: {
              create: (poll.options || []).map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
              })),
            },
          },
          include: {
            options: { include: { votes: true } },
            words: true,
          },
        });

        const formatted = formatPollForClient(newPoll, '', 'open');
        io.to(roomCode.toUpperCase()).emit('poll:new', formatted);
        if (formatted.type === 'word-cloud') {
          io.to(roomCode.toUpperCase()).emit('wordcloud:update', formatted.words || []);
        }
      } catch (err) {
        console.error('poll:create error:', err);
        socket.emit('error', 'Failed to create poll.');
      }
    });

    // ── Poll Vote ──────────────────────────────────────────────────────────────
    socket.on('poll:vote', async ({ pollId, optionIds, sessionId }) => {
      try {
        if (store.hasVoted(pollId, sessionId)) {
          socket.emit('error', 'You have already voted.');
          return;
        }

        const poll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: { room: true },
        });

        if (!poll || poll.state !== 'open') {
          socket.emit('error', 'Poll is not accepting votes.');
          return;
        }

        // For single-type polls, only take first optionId
        const idsToRecord = poll.type === 'single' ? [optionIds[0]] : optionIds;

        await Promise.all(
          idsToRecord.map((optionId) =>
            prisma.vote.create({ data: { pollId, optionId, sessionId } })
          )
        );

        store.recordVote(pollId, sessionId);

        const updatedPoll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: {
            options: { include: { votes: true } },
            words: true,
          },
        });

        if (updatedPoll) {
          // Broadcast updated poll (options hidden for open state)
          const formatted = formatPollForClient(updatedPoll, sessionId, 'open');
          io.to(poll.room.code).emit('poll:update', formatted);
        }
      } catch (err) {
        console.error('poll:vote error:', err);
        socket.emit('error', 'Failed to record vote.');
      }
    });

    // ── Word Cloud Submit ──────────────────────────────────────────────────────
    socket.on('poll:word:submit', async ({ pollId, roomCode, word, sessionId }) => {
      try {
        const trimmed = (word || '').trim();
        if (!trimmed || trimmed.length > 30) {
          socket.emit('error', 'Word must be between 1 and 30 characters.');
          return;
        }

        if (checkProfanity(trimmed)) {
          socket.emit('error', 'Message contains inappropriate content.');
          return;
        }

        const poll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: { room: true },
        });

        if (!poll || poll.state !== 'open') {
          socket.emit('error', 'Word cloud is not accepting submissions.');
          return;
        }

        // Rate-limit: 1 submission per 1.5 seconds per session
        const recent = await prisma.wordResponse.findFirst({
          where: {
            pollId,
            sessionId,
            createdAt: { gte: new Date(Date.now() - 1500) },
          },
        });
        if (recent) {
          socket.emit('error', 'Please wait a moment before submitting another word.');
          return;
        }

        await prisma.wordResponse.create({
          data: {
            pollId,
            word: trimmed,
            sessionId,
          },
        });

        const updatedPoll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: {
            options: { include: { votes: true } },
            words: true,
            room: true,
          },
        });

        if (updatedPoll) {
          const code = (updatedPoll.room?.code || roomCode).toUpperCase();
          const formatted = formatPollForClient(updatedPoll, sessionId, updatedPoll.state as PollState);
          io.to(code).emit('poll:update', formatted);
          io.to(code).emit('wordcloud:update', formatted.words || []);
        }
      } catch (err) {
        console.error('poll:word:submit error:', err);
        socket.emit('error', 'Failed to submit word.');
      }
    });

    // ── Poll Set State ─────────────────────────────────────────────────────────
    socket.on('poll:setState', async ({ pollId, state, hostSecret }) => {
      try {
        const poll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: { room: true },
        });
        if (!poll || poll.room.hostSecret !== hostSecret) {
          socket.emit('error', 'Unauthorized.');
          return;
        }

        const updated = await prisma.poll.update({
          where: { id: pollId },
          data: { state },
          include: {
            options: { include: { votes: true } },
            words: true,
          },
        });

        const formatted = formatPollForClient(updated, '', state);
        io.to(poll.room.code).emit('poll:update', formatted);
        if (formatted.type === 'word-cloud') {
          io.to(poll.room.code).emit('wordcloud:update', formatted.words || []);
        }
      } catch (err) {
        console.error('poll:setState error:', err);
      }
    });

    // ── Poll Delete ────────────────────────────────────────────────────────────
    socket.on('poll:delete', async ({ pollId, hostSecret }) => {
      try {
        const poll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: { room: true },
        });
        if (!poll || poll.room.hostSecret !== hostSecret) return;

        await prisma.poll.delete({ where: { id: pollId } });
        io.to(poll.room.code).emit('poll:removed', pollId);
      } catch (err) {
        console.error('poll:delete error:', err);
      }
    });

    // ── Q&A Submit ─────────────────────────────────────────────────────────────
    socket.on('qa:submit', async ({ roomCode, text, displayName, isAnonymous, sessionId }) => {
      try {
        const trimmed = text.trim();
        if (!trimmed || trimmed.length > 300) {
          socket.emit('error', 'Message must be 1–300 characters.');
          return;
        }

        if (checkProfanity(trimmed)) {
          socket.emit('error', 'Message contains inappropriate content.');
          return;
        }

        const room = await prisma.room.findUnique({ where: { code: roomCode.toUpperCase() } });
        if (!room) { socket.emit('error', 'Room not found.'); return; }

        // Rate-limit: 1 submission per 10 seconds per session
        const recent = await prisma.qAQuestion.findFirst({
          where: {
            roomId: room.id,
            sessionId,
            createdAt: { gte: new Date(Date.now() - 10_000) },
          },
        });
        if (recent) {
          socket.emit('error', 'Please wait a moment before posting again.');
          return;
        }

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
          io.to(roomCode.toUpperCase()).emit(
            'qa:update',
            allQ.map((q) => toQA(q, false))
          );
          const words = extractWordCloudWords(allQ.map((q) => q.text));
          io.to(roomCode.toUpperCase()).emit('wordcloud:update', words);
        } else {
          // Notify host of pending question
          io.to(roomCode.toUpperCase()).emit('qa:pending', toQA(question, false));
        }
      } catch (err) {
        console.error('qa:submit error:', err);
        socket.emit('error', 'Failed to submit question.');
      }
    });

    // ── Q&A Upvote ─────────────────────────────────────────────────────────────
    socket.on('qa:upvote', async ({ questionId, sessionId }) => {
      try {
        const upvoted = store.toggleUpvote(questionId, sessionId);
        const increment = upvoted ? 1 : -1;

        const updated = await prisma.qAQuestion.update({
          where: { id: questionId },
          data: { upvotes: { increment } },
          include: { room: true },
        });

        const allQ = await getApprovedQuestions(updated.roomId);
        io.to(updated.room.code).emit(
          'qa:update',
          allQ.map((q) => toQA(q, store.hasUpvoted(q.id, sessionId)))
        );
      } catch (err) {
        console.error('qa:upvote error:', err);
      }
    });

    // ── Q&A Moderate ───────────────────────────────────────────────────────────
    socket.on('qa:moderate', async ({ questionId, action, hostSecret }) => {
      try {
        const question = await prisma.qAQuestion.findUnique({
          where: { id: questionId },
          include: { room: true },
        });
        if (!question || question.room.hostSecret !== hostSecret) {
          socket.emit('error', 'Unauthorized.');
          return;
        }

        await prisma.qAQuestion.update({ where: { id: questionId }, data: { status: action } });

        const allQ = await getApprovedQuestions(question.roomId);
        io.to(question.room.code).emit(
          'qa:update',
          allQ.map((q) => toQA(q, false))
        );

        const words = extractWordCloudWords(allQ.map((q) => q.text));
        io.to(question.room.code).emit('wordcloud:update', words);

        // Refresh pending queue for host
        const pending = await prisma.qAQuestion.findMany({
          where: { roomId: question.roomId, status: 'pending' },
          orderBy: { createdAt: 'asc' },
        });
        socket.emit('qa:pendingQueue', pending.map((q) => toQA(q, false)));
      } catch (err) {
        console.error('qa:moderate error:', err);
      }
    });

    // ── Get Pending Q&A Queue ──────────────────────────────────────────────────
    socket.on('qa:getPending', async ({ roomCode, hostSecret }) => {
      try {
        const room = await prisma.room.findUnique({ where: { code: roomCode.toUpperCase() } });
        if (!room || room.hostSecret !== hostSecret) return;

        const pending = await prisma.qAQuestion.findMany({
          where: { roomId: room.id, status: 'pending' },
          orderBy: { createdAt: 'asc' },
        });
        socket.emit('qa:pendingQueue', pending.map((q) => toQA(q, false)));
      } catch (err) {
        console.error('qa:getPending error:', err);
      }
    });

    // ── Quiz Create ────────────────────────────────────────────────────────────
    socket.on('quiz:create', async ({ roomCode, hostSecret, quiz }) => {
      try {
        const room = await prisma.room.findUnique({ where: { code: roomCode.toUpperCase() } });
        if (!room || room.hostSecret !== hostSecret) {
          socket.emit('error', 'Unauthorized.');
          return;
        }

        await prisma.quiz.create({
          data: {
            roomId: room.id,
            title: quiz.title,
            questions: {
              create: quiz.questions.map((q, i) => ({
                text: q.text,
                options: JSON.stringify(q.options),
                timeLimit: q.timeLimit,
                order: i,
              })),
            },
          },
        });
      } catch (err) {
        console.error('quiz:create error:', err);
        socket.emit('error', 'Failed to create quiz.');
      }
    });

    // ── Quiz Start ─────────────────────────────────────────────────────────────
    socket.on('quiz:start', async ({ quizId, hostSecret }) => {
      try {
        const quiz = await prisma.quiz.findUnique({
          where: { id: quizId },
          include: { questions: { orderBy: { order: 'asc' } }, room: true },
        });
        if (!quiz || quiz.room.hostSecret !== hostSecret) {
          socket.emit('error', 'Unauthorized.');
          return;
        }

        await prisma.quiz.update({ where: { id: quizId }, data: { state: 'active', currentQuestionIndex: 0 } });

        const firstQ = quiz.questions[0];
        if (firstQ) {
          io.to(quiz.room.code).emit(
            'quiz:question',
            { ...firstQ, options: JSON.parse(firstQ.options) },
            0,
            quiz.questions.length
          );
          setTimeout(() => {
            io.to(quiz.room.code).emit('quiz:timesUp', { questionId: firstQ.id });
          }, firstQ.timeLimit * 1000);
        }
      } catch (err) {
        console.error('quiz:start error:', err);
      }
    });

    // ── Quiz Answer ────────────────────────────────────────────────────────────
    socket.on('quiz:answer', async ({ questionId, optionId, sessionId, timeTaken, displayName }) => {
      try {
        const q = await prisma.quizQuestion.findUnique({
          where: { id: questionId },
          include: { quiz: { include: { room: true } } },
        });
        if (!q) return;

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
          io.to(q.quiz.room.code).emit('leaderboard:update', leaderboard);
        }
      } catch (err) {
        console.error('quiz:answer error:', err);
      }
    });

    // ── Quiz Next ──────────────────────────────────────────────────────────────
    socket.on('quiz:next', async ({ quizId, hostSecret }) => {
      try {
        const quiz = await prisma.quiz.findUnique({
          where: { id: quizId },
          include: { questions: { orderBy: { order: 'asc' } }, room: true },
        });
        if (!quiz || quiz.room.hostSecret !== hostSecret) return;

        const nextIndex = quiz.currentQuestionIndex + 1;

        if (nextIndex >= quiz.questions.length) {
          await prisma.quiz.update({ where: { id: quizId }, data: { state: 'finished' } });
          const leaderboard = await getLeaderboard(quiz.roomId);
          io.to(quiz.room.code).emit('quiz:ended', leaderboard);
        } else {
          await prisma.quiz.update({ where: { id: quizId }, data: { currentQuestionIndex: nextIndex } });
          const nextQ = quiz.questions[nextIndex];
          io.to(quiz.room.code).emit(
            'quiz:question',
            { ...nextQ, options: JSON.parse(nextQ.options) },
            nextIndex,
            quiz.questions.length
          );
          setTimeout(() => {
            io.to(quiz.room.code).emit('quiz:timesUp', { questionId: nextQ.id });
          }, nextQ.timeLimit * 1000);
        }
      } catch (err) {
        console.error('quiz:next error:', err);
      }
    });

    // ── Quiz End ───────────────────────────────────────────────────────────────
    socket.on('quiz:end', async ({ quizId, hostSecret }) => {
      try {
        const quiz = await prisma.quiz.findUnique({
          where: { id: quizId },
          include: { room: true },
        });
        if (!quiz || quiz.room.hostSecret !== hostSecret) return;

        await prisma.quiz.update({ where: { id: quizId }, data: { state: 'finished' } });
        const leaderboard = await getLeaderboard(quiz.roomId);
        io.to(quiz.room.code).emit('quiz:ended', leaderboard);
      } catch (err) {
        console.error('quiz:end error:', err);
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomCode = store.removeParticipantBySocket(socket.id);
      if (roomCode) {
        io.to(roomCode).emit('room:participants', store.getParticipantCount(roomCode));
      }
    });
  });
}
