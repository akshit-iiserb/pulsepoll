'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Send, CheckCircle2, Sparkles, Lock } from 'lucide-react';
import WordCloudDisplay from '@/components/stage/WordCloudDisplay';
import type { Poll } from '@/lib/types';

interface WordCloudParticipantProps {
  poll: Poll;
  onSubmitWord: (word: string) => void;
}

export default function WordCloudParticipant({ poll, onSubmitWord }: WordCloudParticipantProps) {
  const [word, setWord] = useState('');
  const [myWords, setMyWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isLocked = poll.state === 'locked';
  const MAX_CHARS = 30;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const trimmed = word.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_CHARS) return;

    onSubmitWord(trimmed);
    setMyWords((prev) => [trimmed, ...prev.filter((w) => w.toLowerCase() !== trimmed.toLowerCase())]);
    setWord('');
    setFeedback(`"${trimmed}" added to the cloud!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const remaining = MAX_CHARS - word.length;
  const isNearLimit = remaining <= 5;

  return (
    <div className="card space-y-5 border border-dark-border shadow-card relative overflow-hidden">
      {/* Background glow header */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="badge-pink flex items-center gap-1.5 shadow-rose-glow-sm">
              <Cloud className="w-3.5 h-3.5 text-rose-300" />
              Live Word Cloud
            </span>
            {isLocked ? (
              <span className="badge-amber flex items-center gap-1">
                <Lock className="w-3 h-3" /> Submissions Locked
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-soft" />
                Live
              </span>
            )}
          </div>
          {poll.totalVotes > 0 && (
            <span className="text-xs text-muted-text font-mono">
              {poll.totalVotes} response{poll.totalVotes !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-white leading-snug">{poll.title}</h3>
        <p className="text-xs text-muted-text mt-1">
          {isLocked
            ? 'The host has locked submissions. View the final word cloud below.'
            : 'Enter a word or short phrase to add it to the live audience word cloud.'}
        </p>
      </div>

      {/* Input box */}
      {!isLocked && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              className="input pr-16 py-3 text-base focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40 shadow-sm"
              placeholder="e.g. Innovative, Fast, Synergy..."
              value={word}
              onChange={(e) => setWord(e.target.value.slice(0, MAX_CHARS))}
              maxLength={MAX_CHARS}
              autoFocus
            />
            <span
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono transition-colors ${
                isNearLimit ? 'text-rose-400 font-bold' : 'text-muted-text'
              }`}
            >
              {remaining}
            </span>
          </div>

          <button
            type="submit"
            disabled={!word.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3 shadow-rose-glow-sm"
          >
            <Sparkles className="w-4 h-4 text-rose-200" />
            Submit Word
          </button>
        </form>
      )}

      {/* Feedback banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-2.5 rounded-xl bg-green-900/30 border border-green-700/50 text-green-300 text-xs flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User's recent submissions */}
      {myWords.length > 0 && (
        <div className="pt-1">
          <p className="text-[11px] font-semibold text-muted-text uppercase tracking-wider mb-2">
            Your contributions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {myWords.map((w, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-950/60 border border-rose-800/40 text-rose-200 shadow-sm"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live word cloud preview */}
      <div className="border-t border-dark-border pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-text uppercase tracking-wider flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-rose-400" />
            Audience Word Cloud
          </p>
          {poll.words && poll.words.length > 0 && (
            <span className="text-[11px] text-muted-text">
              {poll.words.length} unique word{poll.words.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="rounded-xl bg-dark-surface2/60 border border-dark-border/60 overflow-hidden">
          <WordCloudDisplay
            words={poll.words || []}
            emptyMessage="No words submitted yet. Be the first to add one!"
          />
        </div>
      </div>
    </div>
  );
}
