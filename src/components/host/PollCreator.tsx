'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, BarChart3, CheckSquare } from 'lucide-react';
import type { PollType } from '@/lib/types';

interface PollCreatorProps {
  onCreatePoll: (poll: {
    title: string;
    type: PollType;
    options: Array<{ text: string; isCorrect: boolean }>;
  }) => void;
}

export default function PollCreator({ onCreatePoll }: PollCreatorProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PollType>('single');
  const [options, setOptions] = useState([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [isOpen, setIsOpen] = useState(false);

  const addOption = () => {
    if (options.length >= 8) return;
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  };

  const updateOption = (i: number, text: string) => {
    setOptions(options.map((o, idx) => (idx === i ? { ...o, text } : o)));
  };

  const toggleCorrect = (i: number) => {
    if (type === 'single' || type === 'assessment') {
      // For assessment, allow multiple correct answers
      if (type === 'single') {
        setOptions(options.map((o, idx) => ({ ...o, isCorrect: idx === i })));
      } else {
        setOptions(options.map((o, idx) => (idx === i ? { ...o, isCorrect: !o.isCorrect } : o)));
      }
    } else {
      setOptions(options.map((o, idx) => (idx === i ? { ...o, isCorrect: !o.isCorrect } : o)));
    }
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    if (type !== 'word-cloud' && options.filter((o) => o.text.trim()).length < 2) return;
    onCreatePoll({
      title: title.trim(),
      type,
      options: type === 'word-cloud' ? [] : options.filter((o) => o.text.trim()),
    });
    setTitle('');
    setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
    setIsOpen(false);
  };

  const pollTypes: { value: PollType; label: string; desc: string }[] = [
    { value: 'single', label: 'Single Choice', desc: 'One answer only' },
    { value: 'multi', label: 'Multi-Select', desc: 'Multiple answers' },
    { value: 'assessment', label: 'Assessment', desc: 'Correct answer reveal' },
    { value: 'word-cloud', label: 'Word Cloud', desc: 'Live text collage' },
  ];

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="btn-primary flex items-center gap-2 w-full justify-center">
        <Plus className="w-4 h-4" />
        Launch New Poll
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-rose-400" />
          New Poll
        </h3>
        <button onClick={() => setIsOpen(false)} className="btn-ghost text-xs">Cancel</button>
      </div>

      <div>
        <label className="label">Question</label>
        <input
          className="input"
          placeholder="What would you like to ask?"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 200))}
          autoFocus
        />
      </div>

      {/* Poll type */}
      <div>
        <label className="label">Poll Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {pollTypes.map((pt) => (
            <button
              key={pt.value}
              onClick={() => setType(pt.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                type === pt.value
                  ? 'border-rose-600 bg-rose-900/20'
                  : 'border-dark-border bg-dark-surface2 hover:border-dark-border2'
              }`}
            >
              <p className="text-xs font-semibold text-white">{pt.label}</p>
              <p className="text-xs text-muted-text mt-0.5">{pt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      {type === 'word-cloud' ? (
        <div className="p-3.5 rounded-xl bg-dark-surface2 border border-dark-border text-xs text-muted-text flex items-center gap-2">
          <span className="text-rose-400 text-base">☁️</span>
          <span>
            Audience members will submit words dynamically from their devices. No predefined choices needed.
          </span>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Options</label>
            {(type === 'assessment') && (
              <span className="text-xs text-muted-text">Click ✓ to mark correct answers</span>
            )}
          </div>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="input flex-1 py-2"
                  placeholder={`Option ${i + 1}`}
                  value={opt.text}
                  onChange={(e) => updateOption(i, e.target.value.slice(0, 100))}
                />
              {type === 'assessment' && (
                <button
                  onClick={() => toggleCorrect(i)}
                  className={`w-9 h-9 rounded-lg border flex-shrink-0 flex items-center justify-center transition-all ${
                    opt.isCorrect
                      ? 'bg-green-900/40 border-green-700/60 text-green-400'
                      : 'bg-dark-surface2 border-dark-border text-dark-border2 hover:border-dark-border2'
                  }`}
                  title="Mark as correct"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => removeOption(i)}
                className="w-9 h-9 rounded-lg border border-dark-border hover:border-red-800/60 hover:bg-red-900/20 flex-shrink-0 flex items-center justify-center text-muted-text hover:text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {options.length < 8 && (
          <button onClick={addOption} className="btn-ghost mt-2 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add option
          </button>
        )}
      </div>
      )}

      <button
        onClick={handleCreate}
        disabled={!title.trim() || (type !== 'word-cloud' && options.filter((o) => o.text.trim()).length < 2)}
        className="btn-primary w-full"
      >
        Launch Poll
      </button>
    </motion.div>
  );
}
