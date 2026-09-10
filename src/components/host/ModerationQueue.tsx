'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Pin, MessageSquare, Archive, Clock } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import type { QAQuestion, QAStatus } from '@/lib/types';

interface ModerationQueueProps {
  pending: QAQuestion[];
  approved: QAQuestion[];
  onModerate: (questionId: string, action: QAStatus) => void;
}

export default function ModerationQueue({ pending, approved, onModerate }: ModerationQueueProps) {
  return (
    <div className="space-y-6">
      {/* Pending queue */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-white">Moderation Queue</h3>
          {pending.length > 0 && (
            <span className="badge-amber">{pending.length} pending</span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="card-sm text-center py-6">
            <Clock className="w-8 h-8 text-dark-border2 mx-auto mb-2" />
            <p className="text-muted-text text-xs">No questions pending approval</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {pending.map((q) => (
                <motion.div
                  key={q.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="card-sm border-amber-800/30 bg-amber-900/5"
                >
                  <p className="text-sm text-white mb-2">{q.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-text">
                      {q.isAnonymous ? 'Anonymous' : q.displayName} · {formatTimeAgo(q.createdAt)}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onModerate(q.id, 'approved')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-900/40 border border-green-800/40 text-green-400 hover:bg-green-900/60 text-xs font-medium transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => onModerate(q.id, 'rejected')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-900/40 border border-red-800/40 text-red-400 hover:bg-red-900/60 text-xs font-medium transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Approved questions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-white">Live Questions</h3>
          <span className="text-muted-text text-xs">({approved.length})</span>
        </div>
        {approved.length === 0 ? (
          <div className="card-sm text-center py-6">
            <MessageSquare className="w-8 h-8 text-dark-border2 mx-auto mb-2" />
            <p className="text-muted-text text-xs">No questions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {approved.map((q) => (
              <div
                key={q.id}
                className={`card-sm ${q.status === 'pinned' ? 'border-rose-700/40' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white">{q.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-text">
                        {q.isAnonymous ? 'Anonymous' : q.displayName}
                      </span>
                      <span className="text-xs text-rose-400">▲ {q.upvotes}</span>
                      <span className="text-xs text-muted-text">{formatTimeAgo(q.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {q.status !== 'pinned' ? (
                      <button
                        onClick={() => onModerate(q.id, 'pinned')}
                        className="w-7 h-7 rounded-lg border border-dark-border hover:border-rose-700/50 hover:bg-rose-900/20 flex items-center justify-center text-muted-text hover:text-rose-300 transition-all"
                        title="Pin to top"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onModerate(q.id, 'approved')}
                        className="w-7 h-7 rounded-lg border border-rose-700/50 bg-rose-900/20 flex items-center justify-center text-rose-300 hover:border-dark-border transition-all"
                        title="Unpin"
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    {q.status !== 'answered' ? (
                      <button
                        onClick={() => onModerate(q.id, 'answered')}
                        className="w-7 h-7 rounded-lg border border-dark-border hover:border-green-700/50 hover:bg-green-900/20 flex items-center justify-center text-muted-text hover:text-green-400 transition-all"
                        title="Mark answered"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                    <button
                      onClick={() => onModerate(q.id, 'archived')}
                      className="w-7 h-7 rounded-lg border border-dark-border hover:border-red-800/50 hover:bg-red-900/20 flex items-center justify-center text-muted-text hover:text-red-400 transition-all"
                      title="Archive"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
