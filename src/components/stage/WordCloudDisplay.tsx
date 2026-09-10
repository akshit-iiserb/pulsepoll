'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { WordCloudWord } from '@/lib/types';

interface WordCloudDisplayProps {
  words: WordCloudWord[];
  emptyMessage?: string;
  maxWords?: number;
}

// Interactive word cloud using a spiral placement algorithm with neon pink accents
export default function WordCloudDisplay({
  words,
  emptyMessage = 'Word cloud will appear as responses come in…',
  maxWords = 45,
}: WordCloudDisplayProps) {
  const positioned = useMemo(() => {
    if (!words || words.length === 0) return [];
    const sorted = [...words].sort((a, b) => b.value - a.value).slice(0, maxWords);
    const maxVal = sorted[0]?.value || 1;
    const minVal = sorted[sorted.length - 1]?.value || 1;

    const minSize = 15;
    const maxSize = 54;

    return sorted.map((w, i) => {
      const norm = maxVal === minVal ? 0.5 : (w.value - minVal) / (maxVal - minVal);
      const fontSize = minSize + norm * (maxSize - minSize);
      // Golden angle spiral distribution
      const angle = i * 137.5 * (Math.PI / 180);
      const radius = 13 * Math.sqrt(i);
      const x = 50 + (radius * Math.cos(angle)) / 2;
      const y = 50 + (radius * Math.sin(angle)) / 2;
      const opacity = 0.65 + norm * 0.35;
      const pinkScale = Math.round(norm * 4);
      // Muted pink palette with neon highlights
      const colors = ['#8888aa', '#8a3d68', '#a84e7e', '#c06890', '#f5d4e2'];
      const color = colors[Math.min(pinkScale, colors.length - 1)];
      const hasGlow = norm >= 0.5;

      return {
        text: w.text,
        fontSize,
        x,
        y,
        opacity,
        color,
        hasGlow,
        value: w.value,
        norm,
      };
    });
  }, [words, maxWords]);

  if (!words || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-muted-text text-sm p-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-dark-surface2 border border-dark-border flex items-center justify-center mb-3">
          <span className="text-xl">☁️</span>
        </div>
        <p className="text-muted-text max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[300px]" style={{ paddingBottom: '60%' }}>
      <div className="absolute inset-0 overflow-hidden rounded-2xl bg-dark-bg/40 border border-dark-border/40 p-4">
        {positioned.map((word, i) => (
          <motion.div
            key={word.text}
            layout
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: word.opacity,
              scale: 1,
              transition: { duration: 0.4, delay: Math.min(i * 0.02, 0.3) },
            }}
            whileHover={{ scale: 1.15, zIndex: 30 }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 select-none font-bold cursor-pointer group"
            style={{
              left: `${Math.min(Math.max(word.x, 10), 90)}%`,
              top: `${Math.min(Math.max(word.y, 10), 90)}%`,
              fontSize: `${word.fontSize}px`,
              color: word.color,
              textShadow: word.hasGlow ? '0 0 14px rgba(168, 78, 126, 0.55)' : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            {word.text}
            <span className="ml-1.5 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded-full bg-dark-surface3 border border-dark-border2 text-rose-300 align-middle">
              {word.value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
