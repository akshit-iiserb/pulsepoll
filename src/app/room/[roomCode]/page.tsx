'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Users, Zap } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import PollVoting from '@/components/participant/PollVoting';
import WordCloudParticipant from '@/components/participant/WordCloudParticipant';
import QASubmit from '@/components/participant/QASubmit';
import QAList from '@/components/participant/QAList';
import QuizParticipant from '@/components/participant/QuizParticipant';
import { generateSessionId } from '@/lib/utils';
import type { RoomState, Poll, QAQuestion, QuizQuestion, LeaderboardEntry } from '@/lib/types';

export default function ParticipantPage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const router = useRouter();
  const { isConnected, emit, on } = useSocket();

  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return generateSessionId();
    return localStorage.getItem('sessionId') || (() => {
      const id = generateSessionId();
      localStorage.setItem('sessionId', id);
      return id;
    })();
  });
  const [displayName] = useState(() =>
    typeof window !== 'undefined' ? (sessionStorage.getItem('displayName') || 'Anonymous') : 'Anonymous'
  );

  const [roomName, setRoomName] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [activeQuizQ, setActiveQuizQ] = useState<QuizQuestion | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizTimesUp, setQuizTimesUp] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizEnded, setQuizEnded] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'poll' | 'qa'>('poll');

  // Join room on connect
  useEffect(() => {
    if (!isConnected || joined) return;
    emit('room:join', { roomCode, sessionId, displayName });
    setJoined(true);
  }, [isConnected, joined, roomCode, sessionId, displayName, emit]);

  // Socket event listeners
  useEffect(() => {
    const off1 = on('room:joined', (state: RoomState) => {
      setRoomName(state.room.name);
      setParticipantCount(state.participantCount);
      if (state.activePoll) setActivePoll(state.activePoll);
      setQuestions(state.questions);
      setLeaderboard(state.leaderboard);
      if (state.activeQuiz?.state === 'active' && state.activeQuiz.questions[state.activeQuiz.currentQuestionIndex]) {
        const q = state.activeQuiz.questions[state.activeQuiz.currentQuestionIndex];
        setActiveQuizQ(q);
        setQuizIndex(state.activeQuiz.currentQuestionIndex);
        setQuizTotal(state.activeQuiz.questions.length);
        setQuizId(state.activeQuiz.id);
      }
    });
    const off2 = on('room:participants', setParticipantCount);
    const off3 = on('poll:new', (poll) => { setActivePoll(poll); setActiveTab('poll'); });
    const off4 = on('poll:update', setActivePoll);
    const off5 = on('poll:removed', () => setActivePoll(null));
    const off6 = on('qa:update', setQuestions);
    // quiz:question now arrives as a single object { question, index, total }
    const off7 = on('quiz:question', (payload: any) => {
      const { question, index, total } = payload;
      setActiveQuizQ(question);
      setQuizIndex(index);
      setQuizTotal(total);
      setQuizTimesUp(false);
      setActiveTab('poll');
    });
    const off8 = on('quiz:timesUp', () => setQuizTimesUp(true));
    const off9 = on('quiz:ended', (lb) => {
      setLeaderboard(lb);
      setQuizEnded(true);
      setActiveQuizQ(null);
    });
    const off10 = on('leaderboard:update', setLeaderboard);
    const off11 = on('error', (msg) => setError(msg));

    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off7(); off8(); off9(); off10(); off11(); };
  }, [on]);

  const handleVote = useCallback((optionIds: string[]) => {
    if (!activePoll) return;
    emit('poll:vote', { pollId: activePoll.id, optionIds, sessionId });
    setActivePoll((p) => p ? { ...p, hasVoted: true } : p);
  }, [activePoll, sessionId, emit]);

  const handleWordSubmit = useCallback((word: string) => {
    if (!activePoll) return;
    emit('poll:word:submit', { pollId: activePoll.id, roomCode, word, sessionId });
  }, [activePoll, roomCode, sessionId, emit]);

  const handleQASubmit = useCallback((text: string, name: string, isAnonymous: boolean) => {
    emit('qa:submit', { roomCode, text, displayName: name, isAnonymous, sessionId });
  }, [roomCode, sessionId, emit]);

  const handleUpvote = useCallback((questionId: string) => {
    emit('qa:upvote', { questionId, sessionId });
    setQuestions((qs) => qs.map((q) =>
      q.id === questionId
        ? { ...q, upvotes: q.hasUpvoted ? q.upvotes - 1 : q.upvotes + 1, hasUpvoted: !q.hasUpvoted }
        : q
    ));
  }, [sessionId, emit]);

  const handleQuizAnswer = useCallback((optionId: string, timeTaken: number) => {
    if (!activeQuizQ || !quizId) return;
    emit('quiz:answer', { questionId: activeQuizQ.id, optionId, sessionId, timeTaken, displayName });
  }, [activeQuizQ, quizId, sessionId, displayName, emit]);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-dark-surface/90 backdrop-blur border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">{roomName || roomCode}</p>
            <p className="text-xs text-muted-text font-mono">{roomCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-text text-xs">
            <Users className="w-3.5 h-3.5" />
            {participantCount}
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? 'Live' : 'Reconnecting…'}
          </div>
        </div>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-3 p-3 rounded-xl bg-red-900/30 border border-red-800/40 text-red-400 text-sm"
            onClick={() => setError('')}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Quiz ended */}
        {quizEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card text-center py-6"
          >
            <p className="text-2xl mb-2">🏆</p>
            <p className="text-white font-semibold text-lg">Quiz Complete!</p>
            {leaderboard.length > 0 && (
              <div className="mt-4 space-y-2">
                {leaderboard.slice(0, 5).map((e) => (
                  <div key={e.sessionId} className="flex justify-between items-center text-sm">
                    <span className="text-muted-text">#{e.rank} {e.displayName}</span>
                    <span className="font-bold text-rose-300">{e.score}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Active quiz question */}
        {activeQuizQ && (
          <QuizParticipant
            question={activeQuizQ}
            questionIndex={quizIndex}
            totalQuestions={quizTotal}
            leaderboard={leaderboard}
            onAnswer={handleQuizAnswer}
            timesUp={quizTimesUp}
          />
        )}

        {/* Tabs (only when no quiz active) */}
        {!activeQuizQ && (
          <>
            <div className="flex border-b border-dark-border">
              <button
                className={`flex-1 pb-3 text-sm font-medium transition-all ${activeTab === 'poll' ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => setActiveTab('poll')}
              >
                Poll {activePoll && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />}
              </button>
              <button
                className={`flex-1 pb-3 text-sm font-medium transition-all ${activeTab === 'qa' ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => setActiveTab('qa')}
              >
                Q&amp;A {questions.length > 0 && <span className="ml-1 text-xs text-muted-text">({questions.length})</span>}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'poll' && (
                <motion.div key="poll" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                  {activePoll ? (
                    activePoll.type === 'word-cloud' ? (
                      <WordCloudParticipant poll={activePoll} onSubmitWord={handleWordSubmit} />
                    ) : (
                      <PollVoting poll={activePoll} onVote={handleVote} />
                    )
                  ) : (
                    <div className="card text-center py-10">
                      <div className="text-4xl mb-3">📊</div>
                      <p className="text-white font-medium">No active poll</p>
                      <p className="text-muted-text text-sm mt-1">The presenter will launch one shortly…</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'qa' && (
                <motion.div key="qa" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">
                  <QASubmit onSubmit={handleQASubmit} defaultName={displayName !== 'Anonymous' ? displayName : ''} />
                  <QAList questions={questions} onUpvote={handleUpvote} sessionId={sessionId} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
