import type { WordCloudWord } from './types';

// ─── Room Code Generation ───────────────────────────────────────────────────

/** Generates a random 6-digit alphanumeric room code */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Generates a cryptographically secure host secret */
export function generateHostSecret(): string {
  const array = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Node.js fallback
    const nodeCrypto = require('crypto');
    const buf = nodeCrypto.randomBytes(24);
    for (let i = 0; i < buf.length; i++) array[i] = buf[i];
  }
  return Buffer.from(array).toString('base64url');
}

/** Generates a UUID-like session ID */
export function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ─── Word Cloud NLP ─────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'shall', 'can', 'need', 'dare', 'ought', 'used',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they',
  'them', 'their', 'this', 'that', 'these', 'those', 'what', 'which', 'who',
  'how', 'when', 'where', 'why', 'not', 'no', 'so', 'if', 'then', 'than',
  'more', 'very', 'just', 'also', 'there', 'here', 'any', 'all', 'some',
]);

/**
 * Extracts key words from an array of text strings, filtered by stop words.
 * Returns words sorted by frequency for use in a word cloud.
 */
export function extractWordCloudWords(texts: string[], maxWords = 40): WordCloudWord[] {
  const freq = new Map<string, number>();

  for (const text of texts) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords)
    .map(([text, value]) => ({ text, value }));
}

/**
 * Aggregates user submitted words for word cloud polls.
 * Normalizes case for matching while preserving clean display text.
 */
export function aggregateWordCloud(
  responses: Array<{ word: string }>,
  maxWords = 60
): WordCloudWord[] {
  const map = new Map<string, { display: string; count: number }>();

  for (const r of responses) {
    const raw = (r.word || '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      const display = raw.charAt(0).toUpperCase() + raw.slice(1);
      map.set(key, { display, count: 1 });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxWords)
    .map((item) => ({ text: item.display, value: item.count }));
}

// ─── Poll Result Calculation ─────────────────────────────────────────────────

export function calculatePollResults(
  options: Array<{ id: string; text: string; isCorrect: boolean; votes: Array<{ sessionId: string }> }>
) {
  const totalVotes = options.reduce((sum, opt) => sum + opt.votes.length, 0);
  return {
    totalVotes,
    options: options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      isCorrect: opt.isCorrect,
      voteCount: opt.votes.length,
      percentage: totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0,
    })),
  };
}

// ─── Misc ────────────────────────────────────────────────────────────────────

export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
