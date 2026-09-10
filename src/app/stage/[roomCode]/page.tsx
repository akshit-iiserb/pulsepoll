'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import QRCodeDisplay from '@/components/shared/QRCodeDisplay';
import PollChart from '@/components/stage/PollChart';
import WordCloudDisplay from '@/components/stage/WordCloudDisplay';
import Leaderboard from '@/components/stage/Leaderboard';
import QAStageDisplay from '@/components/stage/QAStageDisplay';
import { generateSessionId } from '@/lib/utils';
import type { Poll, QAQuestion, LeaderboardEntry, WordCloudWord, QuizQuestion } from '@/lib/types';

type StageView = 'idle' | 'poll' | 'wordcloud' | 'leaderboard' | 'quiz';

export default function StagePage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const { isConnected, emit, on } = useSocket();

  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return generateSessionId();
    return localStorage.getItem('stageSession') || (() => {
      const id = generateSessionId();
      localStorage.setItem('stageSession', id);
      return id;
    })();
  });

  const [roomName, setRoomName] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [wordCloudWords, setWordCloudWords] = useState<WordCloudWord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeQuizQ, setActiveQuizQ] = useState<QuizQuestion | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizEnded, setQuizEnded] = useState(false);
  const [joined, setJoined] = useState(false);
  const [stageView, setStageView] = useState<StageView>('idle');

  useEffect(() => {
    if (!isConnected || joined) return;
    emit('room:join', { roomCode, sessionId, displayName: 'Stage' });
    setJoined(true);
  }, [isConnected, joined, roomCode, sessionId, emit]);

  useEffect(() => {
    const off1 = on('room:joined', (state) => {
      setRoomName(state.room.name);
      setParticipantCount(state.participantCount);
      setQuestions(state.questions);
      setLeaderboard(state.leaderboard);
      if (state.activePoll) {
        setActivePoll(state.activePoll);
        setStageView('poll');
      }
    });
    const off2 = on('room:participants', setParticipantCount);
    const off3 = on('poll:new', (poll) => { setActivePoll(poll); setStageView('poll'); });
    const off4 = on('poll:update', (poll) => setActivePoll(poll));
    const off5 = on('poll:removed', () => {
      setActivePoll(null);
      setStageView(questions.length > 0 ? 'wordcloud' : 'idle');
    });
    const off6 = on('qa:update', (qs) => {
      setQuestions(qs);
      if (!activePoll && qs.length > 0) setStageView('wordcloud');
    });
    const off7 = on('wordcloud:update', setWordCloudWords);
    const off8 = on('leaderboard:update', (lb) => {
      setLeaderboard(lb);
      if (lb.length > 0) setStageView('leaderboard');
    });
    const off9 = on('quiz:question', (q, idx, total) => {
      setActiveQuizQ(q);
      setQuizIndex(idx);
      setQuizTotal(total);
      setQuizEnded(false);
      setStageView('quiz');
    });
    const off10 = on('quiz:ended', (lb) => {
      setLeaderboard(lb);
      setActiveQuizQ(null);
      setQuizEnded(true);
      setStageView('leaderboard');
    });

    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off7(); off8(); off9(); off10(); };
  }, [on, activePoll, questions.length]);

  const sectionLabel = {
    idle: 'Scan to Join',
    poll: activePoll?.type === 'word-cloud'
      ? (activePoll.state === 'open' ? 'Live Word Cloud — Submissions Open' : 'Word Cloud Results')
      : (activePoll?.state === 'open' ? 'Live Poll — Voting Open' : activePoll?.state === 'locked' ? 'Poll Results' : 'Answers Revealed'),
    wordcloud: 'Live Q&A',
    leaderboard: quizEnded ? '🏆 Final Leaderboard' : 'Leaderboard',
    quiz: `Quiz · Q${quizIndex + 1} of ${quizTotal}`,
  }[stageView];

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top bar */}
      <div className="bg-dark-surface border-b border-dark-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-rose-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{roomName || roomCode}</p>
            <p className="text-sm text-muted-text">PulseRoom · Live Session</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-muted-text">
            <Users className="w-4 h-4" />
            <span className="font-bold text-white text-lg">{participantCount}</span>
            <span className="text-xs">participants</span>
          </div>
          <div className="text-center">
            <p className="font-mono text-3xl font-black text-white tracking-widest">{roomCode}</p>
            <p className="text-xs text-muted-text">room code</p>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {isConnected ? 'Live' : 'Reconnecting…'}
          </div>
        </div>
      </div>

      {/* Stage section label */}
      <div className="px-8 py-3 bg-rose-900/10 border-b border-rose-900/20">
        <p className="text-rose-300 text-sm font-semibold">{sectionLabel}</p>
      </div>

      {/* Main stage area */}
      <main className="flex-1 flex">
        {/* Primary content */}
        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            {stageView === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full gap-8"
              >
                <div>
                  <h2 className="text-4xl font-extrabold text-white text-center mb-2">Join this session</h2>
                  <p className="text-muted-text text-center text-lg">Scan the QR code or enter the room code at <span className="text-rose-300">pulseroom.live</span></p>
                </div>
                <QRCodeDisplay roomCode={roomCode} size={220} showCopy={false} />
              </motion.div>
            )}

            {stageView === 'poll' && activePoll && activePoll.type === 'word-cloud' && (
              <motion.div
                key="stage-word-cloud"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="h-full flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white">{activePoll.title}</h2>
                    <p className="text-sm text-muted-text mt-1">
                      {activePoll.state === 'open'
                        ? 'Live Audience Word Cloud · Submit your words from your device'
                        : 'Submissions closed · Final audience word cloud'}
                    </p>
                  </div>
                  {activePoll.state === 'open' && (
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-900/30 border border-rose-700/40 text-rose-300 text-xs font-semibold shadow-rose-glow-sm">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse-soft" />
                      Live Stream
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-center p-2 min-h-[360px]">
                  <WordCloudDisplay
                    words={activePoll.words || []}
                    emptyMessage="Waiting for audience to submit words... Scan QR code to participate!"
                    maxWords={60}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-text border-t border-dark-border pt-3">
                  <span>{activePoll.totalVotes} response{activePoll.totalVotes !== 1 ? 's' : ''} submitted</span>
                  <span>{activePoll.words?.length || 0} unique words in cloud</span>
                </div>
              </motion.div>
            )}

            {stageView === 'poll' && activePoll && activePoll.type !== 'word-cloud' && (activePoll.state === 'locked' || activePoll.state === 'revealed') && (
              <motion.div
                key="poll-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col"
              >
                <h2 className="text-2xl font-bold text-white mb-6">{activePoll.title}</h2>
                <div className="flex-1">
                  <PollChart poll={activePoll} />
                </div>
                <p className="text-muted-text text-sm mt-4 text-center">{activePoll.totalVotes} total votes</p>
              </motion.div>
            )}

            {stageView === 'poll' && activePoll && activePoll.type !== 'word-cloud' && activePoll.state === 'open' && (
              <motion.div
                key="poll-open"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-6"
              >
                <h2 className="text-3xl font-bold text-white text-center">{activePoll.title}</h2>
                <div className="grid gap-4 w-full max-w-2xl">
                  {activePoll.options.map((opt, i) => (
                    <div key={opt.id} className="p-5 rounded-2xl border border-dark-border bg-dark-surface2 text-center">
                      <span className="text-xl font-semibold text-white">{opt.text}</span>
                    </div>
                  ))}
                </div>
                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="flex items-center gap-2 text-rose-400 mt-4">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-lg font-medium">Voting is open</span>
                </motion.div>
              </motion.div>
            )}

            {stageView === 'wordcloud' && (
              <motion.div
                key="wordcloud"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col gap-4"
              >
                <h2 className="text-2xl font-bold text-white">Live Q&amp;A</h2>
                <div className="flex-1 grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-center">
                    <WordCloudDisplay words={wordCloudWords} />
                  </div>
                  <div className="overflow-hidden">
                    <QAStageDisplay questions={questions} maxVisible={4} />
                  </div>
                </div>
              </motion.div>
            )}

            {stageView === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col gap-4"
              >
                <h2 className="text-3xl font-bold text-white text-center">
                  {quizEnded ? '🏆 Final Standings' : 'Leaderboard'}
                </h2>
                <div className="flex-1 max-w-xl mx-auto w-full">
                  <Leaderboard entries={leaderboard} variant="stage" />
                </div>
              </motion.div>
            )}

            {stageView === 'quiz' && activeQuizQ && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="flex items-center gap-3">
                  <span className="badge-pink text-base px-4 py-2">
                    Question {quizIndex + 1} of {quizTotal}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white">{activeQuizQ.text}</h2>
                <div className="grid grid-cols-2 gap-4 max-w-3xl">
                  {activeQuizQ.options.map((opt, i) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const colors = ['bg-rose-900/30 border-rose-700/40', 'bg-indigo-900/30 border-indigo-700/40', 'bg-amber-900/30 border-amber-700/40', 'bg-teal-900/30 border-teal-700/40'];
                    return (
                      <div key={opt.id} className={`p-5 rounded-2xl border ${colors[i % colors.length]} flex items-center gap-3`}>
                        <span className="text-2xl font-bold text-white opacity-40">{letters[i]}</span>
                        <span className="text-xl font-semibold text-white">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar: QR code + participant count */}
        <div className="w-64 border-l border-dark-border bg-dark-surface p-6 flex flex-col gap-6">
          <QRCodeDisplay roomCode={roomCode} size={140} showCopy={false} />
          <div className="divider" />
          <div className="text-center">
            <p className="text-4xl font-extrabold text-white">{participantCount}</p>
            <p className="text-muted-text text-sm">participants</p>
          </div>
          {leaderboard.length > 0 && stageView !== 'leaderboard' && (
            <>
              <div className="divider" />
              <div>
                <p className="text-xs font-semibold text-muted-text uppercase tracking-wider mb-3">Top Scores</p>
                <Leaderboard entries={leaderboard.slice(0, 5)} variant="compact" />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
