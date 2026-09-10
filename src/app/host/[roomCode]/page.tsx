'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Wifi, WifiOff, BarChart3, MessageSquare, Trophy, Settings, ExternalLink, Monitor, Cloud } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import PollCreator from '@/components/host/PollCreator';
import ActivePollControl from '@/components/host/ActivePollControl';
import WordCloudHost from '@/components/host/WordCloudHost';
import ModerationQueue from '@/components/host/ModerationQueue';
import QuizManager from '@/components/host/QuizManager';
import QRCodeDisplay from '@/components/shared/QRCodeDisplay';
import { generateSessionId } from '@/lib/utils';
import type { Poll, QAQuestion, Quiz, PollState, QAStatus, PollType } from '@/lib/types';

export default function HostConsolePage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const router = useRouter();
  const { isConnected, emit, on } = useSocket();

  const [hostSecret, setHostSecret] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<QAQuestion[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeTab, setActiveTab] = useState<'polls' | 'wordcloud' | 'qa' | 'quiz' | 'settings'>('polls');
  const [joined, setJoined] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return generateSessionId();
    return localStorage.getItem('sessionId') || (() => {
      const id = generateSessionId();
      localStorage.setItem('sessionId', id);
      return id;
    })();
  });

  // Load host secret from localStorage
  useEffect(() => {
    const secret = localStorage.getItem(`hostSecret_${roomCode}`);
    if (!secret) {
      router.push('/');
      return;
    }
    setHostSecret(secret);

    // Load room name
    const roomData = localStorage.getItem(`hostRoom_${roomCode}`);
    if (roomData) {
      try { setRoomName(JSON.parse(roomData).name); } catch {}
    }
  }, [roomCode, router]);

  // Join room via socket
  useEffect(() => {
    if (!isConnected || joined || !hostSecret) return;
    emit('room:join', { roomCode, sessionId, displayName: 'Host' });
    setJoined(true);
  }, [isConnected, joined, hostSecret, roomCode, sessionId, emit]);

  // Request pending queue on join
  useEffect(() => {
    if (!joined || !hostSecret) return;
    emit('qa:getPending', { roomCode, hostSecret });
  }, [joined, hostSecret, roomCode, emit]);

  // Socket events
  useEffect(() => {
    const off1 = on('room:joined', (state) => {
      setRoomName(state.room.name);
      setParticipantCount(state.participantCount);
      if (state.activePoll) setActivePoll(state.activePoll);
      setQuestions(state.questions);
      if (state.activeQuiz) setQuiz(state.activeQuiz);
    });
    const off2 = on('room:participants', setParticipantCount);
    const off3 = on('poll:new', (poll) => {
      setActivePoll(poll);
      if (poll.type === 'word-cloud') {
        setActiveTab('wordcloud');
      } else {
        setActiveTab('polls');
      }
    });
    const off4 = on('poll:update', (poll) => setActivePoll((p) => p?.id === poll.id ? poll : p));
    const off5 = on('poll:removed', () => setActivePoll(null));
    const off6 = on('qa:update', setQuestions);
    const off7 = on('qa:pending', (q) => setPendingQuestions((prev) => [...prev.filter((p) => p.id !== q.id), q]));
    const off8 = on('qa:pendingQueue', setPendingQuestions);

    return () => { off1(); off2(); off3(); off4(); off5(); off6(); off7(); off8(); };
  }, [on]);

  const handleCreatePoll = useCallback((poll: { title: string; type: PollType; options: Array<{ text: string; isCorrect: boolean }> }) => {
    if (!hostSecret) return;
    emit('poll:create', { roomCode, hostSecret, poll });
  }, [roomCode, hostSecret, emit]);

  const handleSetPollState = useCallback((state: PollState) => {
    if (!activePoll || !hostSecret) return;
    emit('poll:setState', { pollId: activePoll.id, state, hostSecret });
  }, [activePoll, hostSecret, emit]);

  const handleDeletePoll = useCallback(() => {
    if (!activePoll || !hostSecret) return;
    emit('poll:delete', { pollId: activePoll.id, hostSecret });
    setActivePoll(null);
  }, [activePoll, hostSecret, emit]);

  const handleModerate = useCallback((questionId: string, action: QAStatus) => {
    if (!hostSecret) return;
    emit('qa:moderate', { questionId, action, hostSecret });
    setPendingQuestions((prev) => prev.filter((q) => q.id !== questionId));
  }, [hostSecret, emit]);

  const handleCreateQuiz = useCallback((data: { title: string; questions: any[] }) => {
    if (!hostSecret) return;
    emit('quiz:create', { roomCode, hostSecret, quiz: data });
  }, [roomCode, hostSecret, emit]);

  const handleLaunchWordCloud = useCallback((promptText: string) => {
    if (!hostSecret) return;
    emit('poll:create', {
      roomCode,
      hostSecret,
      poll: {
        title: promptText,
        type: 'word-cloud',
        options: [],
      },
    });
  }, [roomCode, hostSecret, emit]);

  const handleStartQuiz = useCallback((quizId: string) => {
    if (!hostSecret) return;
    emit('quiz:start', { quizId, hostSecret });
    setQuiz((q) => q ? { ...q, state: 'active' } : q);
  }, [hostSecret, emit]);

  const handleNextQuestion = useCallback((quizId: string) => {
    if (!hostSecret) return;
    emit('quiz:next', { quizId, hostSecret });
    setQuiz((q) => q ? { ...q, currentQuestionIndex: q.currentQuestionIndex + 1 } : q);
  }, [hostSecret, emit]);

  const handleEndQuiz = useCallback((quizId: string) => {
    if (!hostSecret) return;
    emit('quiz:end', { quizId, hostSecret });
    setQuiz((q) => q ? { ...q, state: 'finished' } : q);
  }, [hostSecret, emit]);

  const tabs = [
    { id: 'polls' as const, label: 'Polls', icon: BarChart3, badge: undefined },
    {
      id: 'wordcloud' as const,
      label: 'Word Cloud',
      icon: Cloud,
      badge: activePoll?.type === 'word-cloud' && (activePoll.words?.length || 0) > 0 ? activePoll.words?.length : undefined,
    },
    { id: 'qa' as const, label: 'Q&A', icon: MessageSquare, badge: pendingQuestions.length || undefined },
    { id: 'quiz' as const, label: 'Quiz', icon: Trophy, badge: undefined },
    { id: 'settings' as const, label: 'Room', icon: Settings, badge: undefined },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-dark-surface/95 backdrop-blur border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{roomName || roomCode}</p>
            <p className="text-xs text-muted-text">Host Console</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-muted-text text-xs">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold text-white">{participantCount}</span>
          </div>
          <a
            href={`/stage/${roomCode}`}
            target="_blank"
            className="btn-ghost flex items-center gap-1.5 text-xs"
          >
            <Monitor className="w-3.5 h-3.5" />
            Stage
          </a>
          <div className={`flex items-center gap-1.5 text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-dark-surface border-b border-dark-border px-4">
        <div className="flex max-w-3xl mx-auto">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${activeTab === id ? 'tab-active' : 'tab-inactive'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge ? (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-5">
        <AnimatePresence mode="wait">
          {activeTab === 'polls' && (
            <motion.div key="polls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {activePoll ? (
                <ActivePollControl
                  poll={activePoll}
                  onSetState={handleSetPollState}
                  onDelete={handleDeletePoll}
                />
              ) : null}
              <PollCreator onCreatePoll={handleCreatePoll} />
            </motion.div>
          )}

          {activeTab === 'wordcloud' && (
            <motion.div key="wordcloud" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <WordCloudHost
                activePoll={activePoll}
                onLaunchWordCloud={handleLaunchWordCloud}
                onSetState={handleSetPollState}
                onDelete={handleDeletePoll}
              />
            </motion.div>
          )}

          {activeTab === 'qa' && (
            <motion.div key="qa" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ModerationQueue
                pending={pendingQuestions}
                approved={questions}
                onModerate={handleModerate}
              />
            </motion.div>
          )}

          {activeTab === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <QuizManager
                quiz={quiz}
                onCreateQuiz={handleCreateQuiz}
                onStartQuiz={handleStartQuiz}
                onNextQuestion={handleNextQuestion}
                onEndQuiz={handleEndQuiz}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-4">Room Access</h3>
                <QRCodeDisplay roomCode={roomCode} size={140} />
              </div>
              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <a href={`/room/${roomCode}`} target="_blank" className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    Participant View
                  </a>
                  <a href={`/stage/${roomCode}`} target="_blank" className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    Stage Display
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
