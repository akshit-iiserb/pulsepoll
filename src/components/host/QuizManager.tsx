'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Play, SkipForward, StopCircle, Zap, Clock } from 'lucide-react';
import type { Quiz, QuizQuestion } from '@/lib/types';

interface QuizManagerProps {
  quiz: Quiz | null;
  onCreateQuiz: (data: { title: string; questions: Omit<QuizQuestion, 'id' | 'quizId'>[] }) => void;
  onStartQuiz: (quizId: string) => void;
  onNextQuestion: (quizId: string) => void;
  onEndQuiz: (quizId: string) => void;
}

interface DraftQuestion {
  text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  timeLimit: number;
}

const defaultQuestion = (): DraftQuestion => ({
  text: '',
  timeLimit: 20,
  options: [
    { id: crypto.randomUUID(), text: '', isCorrect: false },
    { id: crypto.randomUUID(), text: '', isCorrect: false },
    { id: crypto.randomUUID(), text: '', isCorrect: false },
    { id: crypto.randomUUID(), text: '', isCorrect: false },
  ],
});

export default function QuizManager({
  quiz,
  onCreateQuiz,
  onStartQuiz,
  onNextQuestion,
  onEndQuiz,
}: QuizManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([defaultQuestion()]);

  const addQuestion = () => {
    if (draftQuestions.length >= 20) return;
    setDraftQuestions([...draftQuestions, defaultQuestion()]);
  };

  const removeQuestion = (i: number) => {
    if (draftQuestions.length <= 1) return;
    setDraftQuestions(draftQuestions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, field: keyof DraftQuestion, value: any) => {
    setDraftQuestions(draftQuestions.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)));
  };

  const updateOption = (qi: number, oi: number, field: 'text' | 'isCorrect', value: any) => {
    setDraftQuestions(
      draftQuestions.map((q, qi2) =>
        qi2 === qi
          ? {
              ...q,
              options: q.options.map((o, oi2) => {
                if (oi2 !== oi) return field === 'isCorrect' ? { ...o, isCorrect: false } : o; // single correct
                return { ...o, [field]: value };
              }),
            }
          : q
      )
    );
  };

  const handleCreate = () => {
    const valid = draftQuestions.every(
      (q) =>
        q.text.trim() &&
        q.options.filter((o) => o.text.trim()).length >= 2 &&
        q.options.some((o) => o.isCorrect)
    );
    if (!valid || !quizTitle.trim()) return;

    onCreateQuiz({
      title: quizTitle.trim(),
      questions: draftQuestions.map((q, i) => ({
        text: q.text.trim(),
        options: q.options.filter((o) => o.text.trim()),
        timeLimit: q.timeLimit,
        order: i,
      })),
    });
    setIsCreating(false);
    setQuizTitle('');
    setDraftQuestions([defaultQuestion()]);
  };

  const timeLimits = [10, 20, 30, 60];

  // Active quiz controls
  if (quiz && quiz.state === 'active') {
    const total = quiz.questions.length;
    const current = quiz.currentQuestionIndex;
    return (
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <span className="badge-pink flex items-center gap-1.5">
            <Zap className="w-3 h-3" />
            Quiz Active
          </span>
          <span className="text-muted-text text-xs">
            Question {current + 1} / {total}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-white">{quiz.title}</h3>
        <div className="w-full bg-dark-border rounded-full h-1.5">
          <div
            className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {current < total - 1 ? (
            <button
              onClick={() => onNextQuestion(quiz.id)}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Next Question
            </button>
          ) : (
            <button
              onClick={() => onEndQuiz(quiz.id)}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              End Quiz
            </button>
          )}
          <button
            onClick={() => onEndQuiz(quiz.id)}
            className="btn-danger flex items-center justify-center gap-2"
          >
            <StopCircle className="w-4 h-4" />
            Stop Early
          </button>
        </div>
      </div>
    );
  }

  // Waiting quiz
  if (quiz && quiz.state === 'waiting') {
    return (
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-white">{quiz.title}</h3>
        <p className="text-muted-text text-xs">{quiz.questions.length} questions ready</p>
        <button
          onClick={() => onStartQuiz(quiz.id)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start Quiz
        </button>
      </div>
    );
  }

  // No quiz or finished
  if (!isCreating) {
    return (
      <div className="space-y-3">
        {quiz?.state === 'finished' && (
          <div className="card-sm border-green-800/30 bg-green-900/10 text-center py-4">
            <p className="text-green-400 text-sm font-medium">Quiz finished! 🎉</p>
          </div>
        )}
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Quiz
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-rose-400" />
          New Quiz
        </h3>
        <button onClick={() => setIsCreating(false)} className="btn-ghost text-xs">Cancel</button>
      </div>

      <div>
        <label className="label">Quiz Title</label>
        <input className="input" placeholder="e.g. Product Knowledge Quiz" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {draftQuestions.map((q, qi) => (
          <div key={qi} className="card-sm space-y-3 border border-dark-border2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300">Question {qi + 1}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-text" />
                  {timeLimits.map((t) => (
                    <button
                      key={t}
                      onClick={() => updateQuestion(qi, 'timeLimit', t)}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${q.timeLimit === t ? 'bg-rose-900/40 text-rose-300' : 'text-muted-text hover:text-white'}`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
                {draftQuestions.length > 1 && (
                  <button onClick={() => removeQuestion(qi)} className="text-muted-text hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <input
              className="input py-2 text-sm"
              placeholder="Question text"
              value={q.text}
              onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <div key={opt.id} className="flex gap-1.5">
                  <button
                    onClick={() => updateOption(qi, oi, 'isCorrect', true)}
                    className={`w-6 h-6 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
                      opt.isCorrect
                        ? 'bg-green-900/40 border-green-700/60 text-green-400'
                        : 'border-dark-border text-dark-border2 hover:border-dark-border2'
                    }`}
                  >
                    <span className="text-xs">✓</span>
                  </button>
                  <input
                    className="input py-1.5 px-2 text-xs flex-1"
                    placeholder={`Option ${oi + 1}`}
                    value={opt.text}
                    onChange={(e) => {
                      const updated = draftQuestions.map((dq, dqi) =>
                        dqi !== qi ? dq : {
                          ...dq,
                          options: dq.options.map((o, ooi) =>
                            ooi !== oi ? o : { ...o, text: e.target.value }
                          ),
                        }
                      );
                      setDraftQuestions(updated);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addQuestion} className="btn-ghost text-xs flex items-center gap-1.5 w-full justify-center">
        <Plus className="w-3.5 h-3.5" />
        Add Question
      </button>

      <button onClick={handleCreate} className="btn-primary w-full">
        Save Quiz
      </button>
    </motion.div>
  );
}
