'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Sparkles, Lock, Unlock, Trash2, ArrowRight, BarChart2, Eye } from 'lucide-react';
import WordCloudDisplay from '@/components/stage/WordCloudDisplay';
import type { Poll, PollState } from '@/lib/types';

interface WordCloudHostProps {
  activePoll: Poll | null;
  onLaunchWordCloud: (prompt: string) => void;
  onSetState: (state: PollState) => void;
  onDelete: () => void;
}

const PRESETS = [
  "Describe today's session in one word",
  'Where are you joining from today?',
  'What is our biggest strength right now?',
  'How are you feeling about the roadmap?',
  'What word comes to mind when you think of AI?',
];

export default function WordCloudHost({
  activePoll,
  onLaunchWordCloud,
  onSetState,
  onDelete,
}: WordCloudHostProps) {
  const [prompt, setPrompt] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);

  const isWordCloudActive = activePoll && activePoll.type === 'word-cloud';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onLaunchWordCloud(trimmed);
    setPrompt('');
    setShowCreateNew(false);
  };

  const handleSelectPreset = (p: string) => {
    setPrompt(p);
  };

  return (
    <div className="space-y-6">
      {/* If a word cloud is active and not creating a new one */}
      {isWordCloudActive && !showCreateNew ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Active Word Cloud Header & Controls */}
          <div className="card border-rose-900/30 shadow-rose-glow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge-pink shadow-rose-glow-sm flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-rose-300" />
                    Active Word Cloud
                  </span>
                  {activePoll.state === 'open' ? (
                    <span className="badge-green flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-soft" />
                      Voting Open
                    </span>
                  ) : (
                    <span className="badge-amber flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                  <span className="text-xs text-muted-text font-mono">
                    {activePoll.totalVotes} submission{activePoll.totalVotes !== 1 ? 's' : ''}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{activePoll.title}</h2>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {activePoll.state === 'open' ? (
                  <button
                    onClick={() => onSetState('locked')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-800/50 bg-amber-900/20 text-amber-300 hover:bg-amber-900/40 text-xs font-medium transition-all active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Lock Submissions
                  </button>
                ) : (
                  <button
                    onClick={() => onSetState('open')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-green-800/50 bg-green-900/20 text-green-300 hover:bg-green-900/40 text-xs font-medium transition-all active:scale-95"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Re-open Voting
                  </button>
                )}

                <button
                  onClick={() => setShowCreateNew(true)}
                  className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  New Prompt
                </button>

                <button
                  onClick={onDelete}
                  className="btn-danger text-xs px-3 py-2 flex items-center gap-1.5"
                  title="Remove Word Cloud"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Close
                </button>
              </div>
            </div>

            {/* Dynamic Word Collage */}
            <div className="mt-5 rounded-2xl bg-dark-bg/80 border border-dark-border/80 overflow-hidden relative">
              <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse-soft shadow-rose-glow-sm" />
                <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                  Live Dynamic Collage
                </span>
              </div>

              <div style={{ height: 320 }}>
                <WordCloudDisplay
                  words={activePoll.words || []}
                  emptyMessage="Live responses will appear here as audience submits words in real-time."
                />
              </div>
            </div>

            {/* Word frequency breakdown */}
            {activePoll.words && activePoll.words.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-border">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-semibold text-muted-text uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-rose-400" />
                    Top Responses ({activePoll.words.length} unique)
                  </p>
                  <span className="text-[11px] text-muted-text">Sorted by frequency</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {activePoll.words.map((w, i) => (
                    <span
                      key={w.text}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-transform hover:scale-105 ${
                        i === 0
                          ? 'bg-rose-900/40 border-rose-600/60 text-white font-bold shadow-rose-glow-sm'
                          : i < 3
                          ? 'bg-rose-950/40 border-rose-800/40 text-rose-200'
                          : 'bg-dark-surface2 border-dark-border text-muted-text'
                      }`}
                    >
                      <span>{w.text}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-dark-surface3 text-rose-300 font-bold">
                        {w.value}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        /* Word Cloud Creation Block */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card space-y-5 border border-dark-border shadow-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-900/40 border border-rose-700/40 flex items-center justify-center shadow-rose-glow-sm">
                <Cloud className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Launch Live Word Cloud</h3>
                <p className="text-xs text-muted-text">
                  Collect freeform one-word or short responses that grow dynamically in real time.
                </p>
              </div>
            </div>

            {isWordCloudActive && (
              <button
                onClick={() => setShowCreateNew(false)}
                className="btn-ghost text-xs"
              >
                Back to Active Cloud
              </button>
            )}
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Word Cloud Question or Prompt</label>
              <input
                className="input text-base py-3 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/40"
                placeholder="e.g. What one word describes our company culture?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 200))}
                autoFocus
              />
            </div>

            {/* Quick presets */}
            <div>
              <label className="label">Quick Ideas &amp; Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-dark-border bg-dark-surface2 text-muted-text hover:border-rose-700/40 hover:text-white hover:bg-rose-900/10 transition-all text-left"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm shadow-rose-glow"
            >
              <Sparkles className="w-4 h-4 text-rose-200" />
              Launch Live Word Cloud
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
