'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Zap } from 'lucide-react';
import CountdownTimer from '@/components/shared/CountdownTimer';
import type { QuizQuestion, LeaderboardEntry } from '@/lib/types';

interface QuizParticipantProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  leaderboard: LeaderboardEntry[];
  onAnswer: (optionId: string, timeTaken: number) => void;
  timesUp: boolean;
}

export default function QuizParticipant({
  question,
  questionIndex,
  totalQuestions,
  leaderboard,
  onAnswer,
  timesUp,
}: QuizParticipantProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [answered, setAnswered] = useState(false);

  // Reset on question change
  useEffect(() => {
    setSelectedId(null);
    setAnswered(false);
  }, [question.id]);

  const handleSelect = (optionId: string) => {
    if (answered || timesUp) return;
    const timeTaken = Math.min((Date.now() - startTime) / 1000, question.timeLimit);
    setSelectedId(optionId);
    setAnswered(true);
    onAnswer(optionId, timeTaken);
  };

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="badge-pink flex items-center gap-1.5 w-fit">
            <Zap className="w-3 h-3" />
            Quiz · {questionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <CountdownTimer
          key={question.id}
          totalSeconds={question.timeLimit}
          running={!answered && !timesUp}
        />
      </div>

      {/* Question */}
      <h3 className="text-base font-semibold text-white">{question.text}</h3>

      {/* Options */}
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSelected = selectedId === opt.id;
          return (
            <motion.button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              disabled={answered || timesUp}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left rounded-xl border p-3.5 transition-all duration-200 flex items-center gap-3 ${
                isSelected
                  ? 'border-rose-500 bg-rose-900/20'
                  : answered || timesUp
                  ? 'border-dark-border bg-dark-surface2 opacity-50 cursor-not-allowed'
                  : 'border-dark-border bg-dark-surface2 hover:border-dark-border2 cursor-pointer'
              }`}
            >
              {isSelected ? (
                <CheckCircle2 className="w-5 h-5 text-rose-400 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-dark-border2 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-white">{opt.text}</span>
            </motion.button>
          );
        })}
      </div>

      {answered && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-green-400"
        >
          Answer locked in! Waiting for next question…
        </motion.p>
      )}

      {timesUp && !answered && (
        <p className="text-center text-sm text-amber-400">Time's up!</p>
      )}

      {/* Mini leaderboard */}
      {leaderboard.length > 0 && (
        <div className="border-t border-dark-border pt-4">
          <p className="text-xs font-medium text-muted-text mb-2">Leaderboard</p>
          <div className="space-y-1.5">
            {leaderboard.slice(0, 5).map((entry) => (
              <div key={entry.sessionId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-text w-4">#{entry.rank}</span>
                  <span className="text-sm text-white">{entry.displayName}</span>
                </div>
                <span className="text-sm font-bold text-rose-300">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
