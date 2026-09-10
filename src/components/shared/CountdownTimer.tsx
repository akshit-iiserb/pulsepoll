'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  totalSeconds: number;
  onExpire?: () => void;
  running?: boolean;
}

export default function CountdownTimer({ totalSeconds, onExpire, running = true }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, onExpire]);

  const pct = Math.max(0, remaining / totalSeconds);
  const isUrgent = remaining <= 5;
  const circumference = 2 * Math.PI * 20;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border)" strokeWidth="3" />
          <motion.circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke={isUrgent ? '#f87171' : 'var(--pink)'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-bold text-lg ${isUrgent ? 'countdown-urgent' : 'text-white'}`}>
          {remaining}
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-text">
        <Clock className="w-3 h-3" />
        <span>{running ? 'Time remaining' : 'Paused'}</span>
      </div>
    </div>
  );
}
