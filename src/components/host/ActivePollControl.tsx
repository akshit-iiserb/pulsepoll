'use client';

import { motion } from 'framer-motion';
import { Lock, Unlock, Eye, Trash2, Users, BarChart3, Cloud } from 'lucide-react';
import WordCloudDisplay from '@/components/stage/WordCloudDisplay';
import type { Poll, PollState } from '@/lib/types';

interface ActivePollControlProps {
  poll: Poll;
  onSetState: (state: PollState) => void;
  onDelete: () => void;
}

export default function ActivePollControl({ poll, onSetState, onDelete }: ActivePollControlProps) {
  const isWordCloud = poll.type === 'word-cloud';

  const stateLabel = {
    open: { text: isWordCloud ? 'Submissions Open' : 'Voting Open', color: 'text-green-400', bg: 'bg-green-900/30 border-green-800/40' },
    locked: { text: isWordCloud ? 'Submissions Locked' : 'Voting Locked', color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-800/40' },
    revealed: { text: 'Answers Revealed', color: 'text-rose-300', bg: 'bg-rose-900/30 border-rose-800/40' },
  }[poll.state];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-4"
    >
      {/* Poll header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium ${stateLabel.bg} ${stateLabel.color} mb-2`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" />
            {stateLabel.text}
          </div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            {isWordCloud && <Cloud className="w-4 h-4 text-rose-400" />}
            {poll.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-muted-text text-xs">
          <Users className="w-3.5 h-3.5" />
          {poll.totalVotes} {isWordCloud ? 'word' : 'vote'}{poll.totalVotes !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Results preview */}
      {isWordCloud ? (
        <div className="rounded-xl bg-dark-surface2/60 border border-dark-border/60 overflow-hidden" style={{ height: 240 }}>
          <WordCloudDisplay
            words={poll.words || []}
            emptyMessage="Audience words will stream here live as they are submitted."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {poll.options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-xs text-muted-text flex-1 truncate">{opt.text}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-24 h-1.5 bg-dark-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${opt.percentage ?? 0}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-white w-8 text-right">
                  {poll.state !== 'open' ? `${opt.percentage ?? 0}%` : opt.voteCount ?? '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Phase controls */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={() => onSetState('open')}
          disabled={poll.state === 'open'}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
            poll.state === 'open'
              ? 'border-green-700/50 bg-green-900/20 text-green-400'
              : 'border-dark-border bg-dark-surface2 text-muted-text hover:border-dark-border2 hover:text-white'
          }`}
        >
          <Unlock className="w-4 h-4" />
          Open
        </button>
        <button
          onClick={() => onSetState('locked')}
          disabled={poll.state === 'locked'}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
            poll.state === 'locked'
              ? 'border-amber-700/50 bg-amber-900/20 text-amber-400'
              : 'border-dark-border bg-dark-surface2 text-muted-text hover:border-dark-border2 hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          Lock
        </button>
        <button
          onClick={() => onSetState('revealed')}
          disabled={poll.state === 'revealed' || poll.type !== 'assessment'}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
            poll.state === 'revealed'
              ? 'border-rose-700/50 bg-rose-900/20 text-rose-300'
              : poll.type !== 'assessment'
              ? 'border-dark-border bg-dark-surface2 text-dark-border2 cursor-not-allowed opacity-40'
              : 'border-dark-border bg-dark-surface2 text-muted-text hover:border-dark-border2 hover:text-white'
          }`}
          title={poll.type !== 'assessment' ? 'Only available for Assessment polls' : 'Reveal correct answers'}
        >
          <Eye className="w-4 h-4" />
          Reveal
        </button>
      </div>

      <button
        onClick={onDelete}
        className="btn-danger w-full flex items-center justify-center gap-2 text-xs"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Remove Poll
      </button>
    </motion.div>
  );
}
