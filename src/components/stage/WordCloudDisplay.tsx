'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WordCloudWord } from '@/lib/types';

interface WordCloudDisplayProps {
  words: WordCloudWord[];
  emptyMessage?: string;
  maxWords?: number;
}

interface PlacedWord {
  text: string;
  x: number;      // center x in px
  y: number;      // center y in px
  w: number;      // measured text width
  h: number;      // measured text height
  fontSize: number;
  color: string;
  opacity: number;
  hasGlow: boolean;
  value: number;
  norm: number;
}

// Slido-style word cloud:
// 1. Measure each word's rendered size using a hidden canvas
// 2. Place from center outward on an Archimedean spiral
// 3. Reject placements that collide with already-placed words
// 4. Words stay fully within the container
function buildLayout(
  words: WordCloudWord[],
  containerW: number,
  containerH: number,
  maxWords: number
): PlacedWord[] {
  if (!words.length || containerW === 0 || containerH === 0) return [];

  const sorted = [...words].sort((a, b) => b.value - a.value).slice(0, maxWords);
  const maxVal = sorted[0]?.value || 1;
  const minVal = sorted[sorted.length - 1]?.value || 1;

  const MIN_FONT = 14;
  const MAX_FONT = Math.min(containerH * 0.18, 72);

  // Slido-style color palette: vibrant on dark
  const COLORS = [
    '#f472b6', // pink-400
    '#e879f9', // fuchsia-400
    '#a78bfa', // violet-400
    '#60a5fa', // blue-400
    '#34d399', // emerald-400
    '#fbbf24', // amber-400
    '#fb7185', // rose-400
    '#38bdf8', // sky-400
  ];

  // Measure text using an off-screen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const measureText = (text: string, fontSize: number): { w: number; h: number } => {
    ctx.font = `700 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
    const metrics = ctx.measureText(text);
    return {
      w: metrics.width + fontSize * 0.3, // horizontal padding
      h: fontSize * 1.2,                 // line height
    };
  };

  // Axis-aligned bounding box overlap check with a small gap between words
  const GAP = 6;
  const overlaps = (
    placed: PlacedWord[],
    cx: number, cy: number, w: number, h: number
  ): boolean => {
    const halfW = w / 2 + GAP;
    const halfH = h / 2 + GAP;
    for (const p of placed) {
      const pHalfW = p.w / 2 + GAP;
      const pHalfH = p.h / 2 + GAP;
      if (
        Math.abs(cx - p.x) < halfW + pHalfW &&
        Math.abs(cy - p.y) < halfH + pHalfH
      ) return true;
    }
    return false;
  };

  const placed: PlacedWord[] = [];
  const cx = containerW / 2;
  const cy = containerH / 2;

  for (let i = 0; i < sorted.length; i++) {
    const w = sorted[i];
    const norm = maxVal === minVal ? 0.5 : (w.value - minVal) / (maxVal - minVal);
    const fontSize = MIN_FONT + norm * (MAX_FONT - MIN_FONT);
    const { w: tw, h: th } = measureText(w.text, fontSize);

    const color = COLORS[i % COLORS.length];
    const opacity = 0.75 + norm * 0.25;
    const hasGlow = norm >= 0.6;

    // Archimedean spiral from center
    const STEP = 0.15;
    const MAX_ITERS = 3000;
    let placed_ok = false;

    for (let t = 0; t < MAX_ITERS; t++) {
      const angle = STEP * t;
      const r = 0.7 * angle; // tighter spiral
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle) * 0.85; // slightly compress Y

      // Keep fully inside container
      const halfW = tw / 2;
      const halfH = th / 2;
      if (
        px - halfW < 4 || px + halfW > containerW - 4 ||
        py - halfH < 4 || py + halfH > containerH - 4
      ) continue;

      if (!overlaps(placed, px, py, tw, th)) {
        placed.push({ text: w.text, x: px, y: py, w: tw, h: th, fontSize, color, opacity, hasGlow, value: w.value, norm });
        placed_ok = true;
        break;
      }
    }

    // If we couldn't fit it, skip — don't render overlapping
    if (!placed_ok) continue;
  }

  return placed;
}

export default function WordCloudDisplay({
  words,
  emptyMessage = 'Word cloud will appear as responses come in…',
  maxWords = 60,
}: WordCloudDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [positioned, setPositioned] = useState<PlacedWord[]>([]);

  // Observe container size changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Re-run layout whenever words or container size changes
  useEffect(() => {
    if (size.w === 0 || size.h === 0) return;
    const result = buildLayout(words, size.w, size.h, maxWords);
    setPositioned(result);
  }, [words, size, maxWords]);

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
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl bg-dark-bg/40 border border-dark-border/40"
      style={{ minHeight: 280, height: '100%' }}
    >
      <AnimatePresence>
        {positioned.map((word) => (
          <motion.span
            key={word.text}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: word.opacity, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            whileHover={{ scale: 1.2, zIndex: 40 }}
            className="absolute select-none font-bold cursor-default leading-none group"
            style={{
              left: word.x,
              top: word.y,
              transform: 'translate(-50%, -50%)',
              fontSize: word.fontSize,
              color: word.color,
              textShadow: word.hasGlow
                ? `0 0 20px ${word.color}88, 0 0 6px ${word.color}44`
                : undefined,
              whiteSpace: 'nowrap',
              fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            }}
            title={`${word.text}: ${word.value}`}
          >
            {word.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
