// Simple keyword-based profanity filter (no external library)
// Add words to the blocklist as needed.

const BLOCKLIST: string[] = [
  'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'damn', 'crap', 'piss',
  'cock', 'dick', 'pussy', 'cunt', 'nigger', 'faggot', 'retard', 'whore',
  'slut', 'motherfucker', 'bullshit', 'jackass', 'wanker', 'twat',
];

// Build regex patterns for each word (whole word, case-insensitive, leet-speak-aware)
const PATTERNS: RegExp[] = BLOCKLIST.map(
  (word) =>
    new RegExp(
      `\\b${word
        .split('')
        .map((c) => {
          const leet: Record<string, string> = { a: '[a@4]', e: '[e3]', i: '[i!1]', o: '[o0]', s: '[s$5]' };
          return leet[c] || c;
        })
        .join('[^a-z]*')}\\b`,
      'i'
    )
);

/**
 * Returns true if the text contains profanity.
 */
export function checkProfanity(text: string): boolean {
  return PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Replaces profane words with asterisks.
 */
export function cleanProfanity(text: string): string {
  let cleaned = text;
  for (let i = 0; i < PATTERNS.length; i++) {
    cleaned = cleaned.replace(PATTERNS[i], '*'.repeat(BLOCKLIST[i].length));
  }
  return cleaned;
}
