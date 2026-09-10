'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Plus, LogIn, ArrowRight, Users, BarChart3, MessageSquare, Trophy } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [roomCode, setRoomCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [requireModeration, setRequireModeration] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) { setError('Please enter a valid 6-character room code.'); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) { setError('Room not found. Check the code and try again.'); return; }
      // Store display name in sessionStorage
      if (displayName.trim()) {
        sessionStorage.setItem('displayName', displayName.trim());
      }
      router.push(`/room/${code}`);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!roomName.trim() || roomName.trim().length < 2) {
      setError('Room name must be at least 2 characters.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName.trim(), requireModeration }),
      });
      if (!res.ok) { setError('Failed to create room. Please try again.'); return; }
      const data = await res.json();
      // Persist host credentials
      localStorage.setItem(`hostSecret_${data.room.code}`, data.hostSecret);
      localStorage.setItem(`hostRoom_${data.room.code}`, JSON.stringify(data.room));
      router.push(`/host/${data.room.code}`);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: BarChart3, label: 'Live Polls', desc: 'Multi-choice & assessment polls with real-time results' },
    { icon: MessageSquare, label: 'Q&A Wall', desc: 'Audience questions with upvoting and moderation' },
    { icon: Trophy, label: 'Quizzes', desc: 'Timed gamified quizzes with live leaderboards' },
    { icon: Users, label: 'No Signup', desc: 'Join instantly with a 6-digit code — no account needed' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Hero background glow */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center shadow-rose-glow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">PulseRoom</span>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-900/30 border border-rose-800/40 text-rose-300 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse-soft" />
            Real-time audience engagement
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-5 leading-tight glow-text">
            Engage your<br />
            <span className="text-rose-400">audience live</span>
          </h1>
          <p className="text-muted-text text-lg max-w-md mx-auto">
            Polls, Q&amp;A, and quizzes — powered by real-time WebSockets.
            No signup. Just scan and participate.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-md"
        >
          <div className="card">
            {/* Tabs */}
            <div className="flex border-b border-dark-border mb-6">
              <button
                className={`flex items-center gap-2 pb-3 px-1 mr-6 text-sm font-medium transition-all ${tab === 'join' ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => { setTab('join'); setError(''); }}
              >
                <LogIn className="w-4 h-4" />
                Join Room
              </button>
              <button
                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all ${tab === 'create' ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => { setTab('create'); setError(''); }}
              >
                <Plus className="w-4 h-4" />
                Host a Room
              </button>
            </div>

            {tab === 'join' ? (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="label">Room Code</label>
                  <input
                    className="input font-mono text-lg tracking-widest uppercase text-center"
                    placeholder="ABC123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Your Name (optional)</label>
                  <input
                    className="input"
                    placeholder="Anonymous"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <span className="animate-pulse-soft">Joining…</span>
                  ) : (
                    <>Join Room <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="label">Session / Event Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Q3 All Hands, DevConf 2026"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value.slice(0, 80))}
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-surface2 border border-dark-border">
                  <input
                    type="checkbox"
                    id="moderation"
                    checked={requireModeration}
                    onChange={(e) => setRequireModeration(e.target.checked)}
                    className="accent-rose-500 w-4 h-4"
                  />
                  <label htmlFor="moderation" className="text-sm text-muted-text cursor-pointer">
                    <span className="text-white font-medium">Require moderation</span> — approve Q&amp;A before it goes live
                  </label>
                </div>
                {error && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <span className="animate-pulse-soft">Creating…</span>
                  ) : (
                    <>Create Room <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full max-w-3xl"
        >
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card-sm flex flex-col items-start gap-2 hover:border-dark-border2 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-rose-900/40 flex items-center justify-center">
                <Icon className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-xs text-muted-text leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="relative z-10 text-center py-6 text-muted-text text-xs">
        PulseRoom · Real-time audience engagement · No signup required
      </footer>
    </div>
  );
}
