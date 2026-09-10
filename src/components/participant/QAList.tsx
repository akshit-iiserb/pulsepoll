'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Pin, CheckCircle, MessageSquare } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import type { QAQuestion } from '@/lib/types';

interface QAListProps {
  questions: QAQuestion[];
  onUpvote: (questionId: string) => void;
  sessionId: string;
}

export default function QAList({ questions, onUpvote, sessionId }: QAListProps) {
  const pinned = questions.filter((q) => q.status === 'pinned');
  const rest = questions.filter((q) => q.status !== 'pinned');

  if (questions.length === 0) {
    return (
      <div className="card text-center py-8">
        <MessageSquare className="w-10 h-10 text-dark-border2 mx-auto mb-3" />
        <p className="text-muted-text text-sm">No questions yet. Be the first to ask!</p>
      </div>
    );
  }

  const renderQuestion = (q: QAQuestion, isPinned?: boolean) => (
    <motion.div
      key={q.id}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-xl border p-4 transition-all ${
        isPinned
          ? 'border-rose-700/50 bg-rose-900/10'
          : q.status === 'answered'
          ? 'border-green-800/40 bg-green-900/10 opacity-75'
          : 'border-dark-border bg-dark-surface2'
      }`}
    >
      <div className="flex gap-3">
        {/* Upvote button */}
        <button
          onClick={() => onUpvote(q.id)}
          className={`flex flex-col items-center gap-0.5 flex-shrink-0 px-2 py-1.5 rounded-lg transition-all ${
            q.hasUpvoted
              ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50'
              : 'hover:bg-dark-surface3 text-muted-text hover:text-white border border-transparent'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${q.hasUpvoted ? 'fill-rose-400 text-rose-400' : ''}`} />
          <span className="text-xs font-bold">{q.upvotes}</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white leading-relaxed">{q.text}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-muted-text">
              {q.isAnonymous ? 'Anonymous' : q.displayName}
            </span>
            <span className="text-dark-border2 text-xs">·</span>
            <span className="text-xs text-muted-text">{formatTimeAgo(q.createdAt)}</span>
            {isPinned && (
              <span className="flex items-center gap-1 text-xs text-rose-400">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            {q.status === 'answered' && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle className="w-3 h-3" /> Answered
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {pinned.map((q) => renderQuestion(q, true))}
        {rest.map((q) => renderQuestion(q, false))}
      </AnimatePresence>
    </div>
  );
}
