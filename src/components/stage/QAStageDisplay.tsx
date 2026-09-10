'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Pin, CheckCircle, ThumbsUp } from 'lucide-react';
import type { QAQuestion } from '@/lib/types';

interface QAStageDisplayProps {
  questions: QAQuestion[];
  maxVisible?: number;
}

export default function QAStageDisplay({ questions, maxVisible = 6 }: QAStageDisplayProps) {
  const pinned = questions.filter((q) => q.status === 'pinned');
  const rest = questions.filter((q) => q.status !== 'pinned');
  const visible = [...pinned, ...rest].slice(0, maxVisible);

  if (visible.length === 0) {
    return (
      <div className="text-center py-12 text-muted-text text-lg">
        Waiting for questions…
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <AnimatePresence>
        {visible.map((q, i) => (
          <motion.div
            key={q.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.04 }}
            className={`rounded-2xl border p-5 ${
              q.status === 'pinned'
                ? 'border-rose-600/50 bg-rose-900/15 shadow-rose-glow-sm'
                : q.status === 'answered'
                ? 'border-green-800/30 bg-green-900/10 opacity-70'
                : 'border-dark-border bg-dark-surface2'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Upvote count */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <ThumbsUp className={`w-5 h-5 ${q.upvotes > 0 ? 'text-rose-400' : 'text-dark-border2'}`} />
                <span className={`text-lg font-bold ${q.upvotes > 0 ? 'text-rose-300' : 'text-dark-border2'}`}>
                  {q.upvotes}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-lg leading-relaxed">{q.text}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-muted-text text-sm">
                    {q.isAnonymous ? 'Anonymous' : q.displayName}
                  </span>
                  {q.status === 'pinned' && (
                    <span className="flex items-center gap-1 text-sm text-rose-400">
                      <Pin className="w-3.5 h-3.5" />
                      Pinned
                    </span>
                  )}
                  {q.status === 'answered' && (
                    <span className="flex items-center gap-1 text-sm text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Answered
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
