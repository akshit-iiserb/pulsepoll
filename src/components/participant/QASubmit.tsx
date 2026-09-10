'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, EyeOff } from 'lucide-react';

interface QASubmitProps {
  onSubmit: (text: string, displayName: string, isAnonymous: boolean) => void;
  defaultName?: string;
}

export default function QASubmit({ onSubmit, defaultName = '' }: QASubmitProps) {
  const [text, setText] = useState('');
  const [name, setName] = useState(defaultName);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const MAX = 300;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSubmit(t, name.trim() || 'Anonymous', isAnonymous);
    setText('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const remaining = MAX - text.length;
  const isNearLimit = remaining < 50;

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Send className="w-4 h-4 text-rose-400" />
        Ask a Question
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-text pointer-events-none" />
              <input
                className="input pl-8 py-2 text-sm"
                placeholder="Your name"
                value={isAnonymous ? '' : name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                disabled={isAnonymous}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAnonymous((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              isAnonymous
                ? 'bg-rose-900/30 border-rose-700/50 text-rose-300'
                : 'bg-dark-surface2 border-dark-border text-muted-text hover:border-dark-border2 hover:text-white'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            {isAnonymous ? 'Anon' : 'Anon?'}
          </button>
        </div>

        {/* Text area */}
        <div className="relative">
          <textarea
            className="input resize-none text-sm"
            rows={3}
            placeholder="Type your question here…"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX))}
          />
          <span
            className={`absolute bottom-2.5 right-3 text-xs font-mono ${
              isNearLimit ? 'text-amber-400' : 'text-dark-border2'
            }`}
          >
            {remaining}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full py-2.5 rounded-xl bg-green-900/30 border border-green-800/40 text-green-400 text-sm font-medium text-center"
            >
              ✓ Question submitted!
            </motion.div>
          ) : (
            <motion.button
              key="submit"
              type="submit"
              disabled={!text.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
