// Shared TypeScript types for the entire application

// ─── Enums ─────────────────────────────────────────────────────────────────

export type PollType = 'single' | 'multi' | 'assessment' | 'word-cloud';
export type PollState = 'open' | 'locked' | 'revealed';
export type QAStatus = 'pending' | 'approved' | 'answered' | 'pinned' | 'archived' | 'rejected';
export type QuizState = 'waiting' | 'active' | 'finished';

// ─── Core Models ───────────────────────────────────────────────────────────

export interface Room {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  requireModeration: boolean;
  createdAt: Date | string;
}

export interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
  voteCount?: number;
  percentage?: number;
}

export interface Poll {
  id: string;
  roomId: string;
  title: string;
  type: PollType;
  state: PollState;
  options: PollOption[];
  words?: WordCloudWord[];
  totalVotes: number;
  createdAt: Date | string;
  hasVoted?: boolean; // Client-side only
}

export interface QAQuestion {
  id: string;
  roomId: string;
  text: string;
  displayName: string;
  isAnonymous: boolean;
  upvotes: number;
  status: QAStatus;
  createdAt: Date | string;
  hasUpvoted?: boolean; // Client-side only
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  text: string;
  options: QuizOption[];
  timeLimit: number;
  order: number;
}

export interface Quiz {
  id: string;
  roomId: string;
  title: string;
  state: QuizState;
  currentQuestionIndex: number;
  questions: QuizQuestion[];
}

export interface LeaderboardEntry {
  sessionId: string;
  displayName: string;
  score: number;
  rank: number;
}

// ─── Room State (emitted on join) ───────────────────────────────────────────

export interface RoomState {
  room: Room;
  activePoll: Poll | null;
  questions: QAQuestion[];
  activeQuiz: Quiz | null;
  leaderboard: LeaderboardEntry[];
  participantCount: number;
}

// ─── Socket.IO Event Maps ───────────────────────────────────────────────────

export interface ServerToClientEvents {
  'room:joined': (state: RoomState) => void;
  'room:participants': (count: number) => void;
  'poll:new': (poll: Poll) => void;
  'poll:update': (poll: Poll) => void;
  'poll:removed': (pollId: string) => void;
  'qa:update': (questions: QAQuestion[]) => void;
  'qa:pending': (question: QAQuestion) => void;
  'qa:pendingQueue': (questions: QAQuestion[]) => void;
  'quiz:question': (question: QuizQuestion, index: number, total: number) => void;
  'quiz:timesUp': (data: { questionId: string }) => void;
  'quiz:ended': (leaderboard: LeaderboardEntry[]) => void;
  'leaderboard:update': (leaderboard: LeaderboardEntry[]) => void;
  'wordcloud:update': (words: WordCloudWord[]) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  'room:join': (data: { roomCode: string; sessionId: string; displayName: string }) => void;

  'poll:create': (data: {
    roomCode: string;
    hostSecret: string;
    poll: { title: string; type: PollType; options: Array<{ text: string; isCorrect: boolean }> };
  }) => void;
  'poll:vote': (data: { pollId: string; optionIds: string[]; sessionId: string }) => void;
  'poll:word:submit': (data: {
    pollId: string;
    roomCode: string;
    word: string;
    sessionId: string;
  }) => void;
  'poll:setState': (data: { pollId: string; state: PollState; hostSecret: string }) => void;
  'poll:delete': (data: { pollId: string; hostSecret: string }) => void;

  'qa:submit': (data: {
    roomCode: string;
    text: string;
    displayName: string;
    isAnonymous: boolean;
    sessionId: string;
  }) => void;
  'qa:upvote': (data: { questionId: string; sessionId: string }) => void;
  'qa:moderate': (data: { questionId: string; action: QAStatus; hostSecret: string }) => void;
  'qa:getPending': (data: { roomCode: string; hostSecret: string }) => void;

  'quiz:create': (data: { roomCode: string; hostSecret: string; quiz: { title: string; questions: Omit<QuizQuestion, 'id' | 'quizId'>[] } }) => void;
  'quiz:start': (data: { quizId: string; hostSecret: string }) => void;
  'quiz:answer': (data: { questionId: string; optionId: string; sessionId: string; timeTaken: number; displayName: string }) => void;
  'quiz:next': (data: { quizId: string; hostSecret: string }) => void;
  'quiz:end': (data: { quizId: string; hostSecret: string }) => void;
}

// ─── Word Cloud ─────────────────────────────────────────────────────────────

export interface WordCloudWord {
  text: string;
  value: number;
}
