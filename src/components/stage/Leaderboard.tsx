'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  variant?: 'stage' | 'compact';
}

export default function Leaderboard({ entries, variant = 'stage' }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-text text-sm">
        No scores yet…
      </div>
    );
  }

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-muted-text text-sm font-mono w-5 text-center">#{rank}</span>;
  };

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {entries.slice(0, 10).map((entry, i) => (
          <div key={entry.sessionId} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6">{rankIcon(entry.rank)}</div>
            <span className="text-sm text-white flex-1 truncate">{entry.displayName}</span>
            <span className="text-sm font-bold text-rose-300 font-mono">{entry.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {entries.slice(0, 10).map((entry, i) => {
          const isTop3 = entry.rank <= 3;
          const maxScore = entries[0]?.score || 1;
          const pct = (entry.score / maxScore) * 100;

          return (
            <motion.div
              key={entry.sessionId}
              layout
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative flex items-center gap-4 p-4 rounded-2xl border overflow-hidden ${
                isTop3
                  ? 'border-rose-700/40 bg-rose-900/10'
                  : 'border-dark-border bg-dark-surface2'
              }`}
            >
              {/* Score bar background */}
              <div
                className="absolute inset-0 bg-rose-500/5 pointer-events-none"
                style={{ width: `${pct}%` }}
              />

              <div className="flex-shrink-0 relative z-10">{rankIcon(entry.rank)}</div>
              <div className="flex-1 min-w-0 relative z-10">
                <p className={`font-semibold truncate ${isTop3 ? 'text-white text-lg' : 'text-white'}`}>
                  {entry.displayName}
                </p>
              </div>
              <div className="relative z-10 text-right">
                <p className={`font-bold font-mono ${isTop3 ? 'text-rose-300 text-xl' : 'text-rose-400 text-base'}`}>
                  {entry.score.toLocaleString()}
                </p>
                <p className="text-muted-text text-xs">pts</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
