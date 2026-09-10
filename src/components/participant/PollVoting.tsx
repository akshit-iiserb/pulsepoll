'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, CheckSquare, Square } from 'lucide-react';
import type { Poll, PollOption } from '@/lib/types';

interface PollVotingProps {
  poll: Poll;
  onVote: (optionIds: string[]) => void;
}

export default function PollVoting({ poll, onVote }: PollVotingProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isMulti = poll.type === 'multi' || poll.type === 'assessment';
  const canVote = !poll.hasVoted && poll.state === 'open';
  const showResults = poll.state === 'locked' || poll.state === 'revealed';

  const toggleOption = (id: string) => {
    if (!canVote) return;
    if (isMulti) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleVote = () => {
    if (selectedIds.length === 0) return;
    onVote(selectedIds);
  };

  const getOptionStyle = (opt: PollOption) => {
    const isSelected = selectedIds.includes(opt.id);
    const isCorrect = poll.state === 'revealed' && opt.isCorrect;
    const isWrong = poll.state === 'revealed' && !opt.isCorrect && (selectedIds.includes(opt.id) || (opt.voteCount ?? 0) > 0);

    if (isCorrect) return 'border-green-500/60 bg-green-900/20';
    if (isWrong && poll.state === 'revealed') return 'border-dark-border bg-dark-surface2/50';
    if (isSelected) return 'border-rose-500 bg-rose-900/20';
    return 'border-dark-border hover:border-dark-border2 bg-dark-surface2';
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {poll.state === 'open' && <span className="badge-pink">Live</span>}
            {poll.state === 'locked' && <span className="badge-amber">Results</span>}
            {poll.state === 'revealed' && <span className="badge-green">Answers Revealed</span>}
            {isMulti && <span className="badge bg-dark-surface3 text-muted-text border border-dark-border">Multi-select</span>}
          </div>
          <h3 className="text-base font-semibold text-white">{poll.title}</h3>
        </div>
        {poll.totalVotes > 0 && showResults && (
          <span className="text-xs text-muted-text whitespace-nowrap mt-1">
            {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {poll.options.map((opt) => (
          <motion.button
            key={opt.id}
            onClick={() => toggleOption(opt.id)}
            disabled={!canVote}
            className={`w-full text-left rounded-xl border p-3.5 transition-all duration-200 relative overflow-hidden ${getOptionStyle(opt)} ${canVote ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
            whileTap={canVote ? { scale: 0.99 } : {}}
          >
            {/* Result bar */}
            {showResults && opt.percentage !== undefined && (
              <div
                className="absolute inset-0 bg-rose-500/10 rounded-xl poll-bar origin-left"
                style={{ width: `${opt.percentage}%` }}
              />
            )}
            <div className="relative flex items-center gap-3">
              {/* Checkbox icon */}
              <div className="flex-shrink-0">
                {poll.state === 'revealed' && opt.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : isMulti ? (
                  selectedIds.includes(opt.id) ? (
                    <CheckSquare className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Square className="w-5 h-5 text-dark-border2" />
                  )
                ) : selectedIds.includes(opt.id) ? (
                  <CheckCircle2 className="w-5 h-5 text-rose-400" />
                ) : (
                  <Circle className="w-5 h-5 text-dark-border2" />
                )}
              </div>
              <span className="text-sm font-medium text-white flex-1">{opt.text}</span>
              {showResults && opt.percentage !== undefined && (
                <span className="text-sm font-bold text-white">{opt.percentage}%</span>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Vote button */}
      <AnimatePresence>
        {canVote && selectedIds.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="btn-primary w-full"
            onClick={handleVote}
          >
            Submit Vote{isMulti && selectedIds.length > 1 ? `s (${selectedIds.length})` : ''}
          </motion.button>
        )}
      </AnimatePresence>

      {poll.hasVoted && poll.state === 'open' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-green-400 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Vote recorded! Waiting for results…
        </motion.p>
      )}

      {poll.state === 'locked' && (
        <p className="text-center text-xs text-muted-text">Voting closed · results shown above</p>
      )}
    </div>
  );
}
