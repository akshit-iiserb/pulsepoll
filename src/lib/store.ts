/**
 * In-memory store for real-time state that doesn't need SQLite persistence.
 * Handles participant tracking, upvote deduplication, and quiz state.
 */

interface Participant {
  displayName: string;
  socketId: string;
}

interface QuizRuntimeState {
  currentIndex: number;
  // sessionId → Set of answered questionIds
  answered: Map<string, Set<string>>;
}

class MemoryStore {
  // roomCode → Map<sessionId, Participant>
  private participants = new Map<string, Map<string, Participant>>();
  // socketId → roomCode (for disconnect tracking)
  private socketRooms = new Map<string, string>();
  // questionId → Set<sessionId> (upvote deduplication)
  private upvotes = new Map<string, Set<string>>();
  // quizId → QuizRuntimeState
  private quizStates = new Map<string, QuizRuntimeState>();
  // pollId → Set<sessionId> (vote deduplication — in memory for speed)
  private votes = new Map<string, Set<string>>();

  // ─── Participants ──────────────────────────────────────────────────────────

  addParticipant(roomCode: string, sessionId: string, displayName: string, socketId: string) {
    if (!this.participants.has(roomCode)) {
      this.participants.set(roomCode, new Map());
    }
    this.participants.get(roomCode)!.set(sessionId, { displayName, socketId });
    this.socketRooms.set(socketId, roomCode);
  }

  removeParticipantBySocket(socketId: string): string | undefined {
    const roomCode = this.socketRooms.get(socketId);
    if (!roomCode) return undefined;
    this.socketRooms.delete(socketId);

    const room = this.participants.get(roomCode);
    if (room) {
      for (const [sessionId, p] of room.entries()) {
        if (p.socketId === socketId) {
          room.delete(sessionId);
          break;
        }
      }
    }
    return roomCode;
  }

  getParticipantCount(roomCode: string): number {
    return this.participants.get(roomCode)?.size ?? 0;
  }

  // ─── Upvotes ───────────────────────────────────────────────────────────────

  /** Toggles upvote. Returns true if upvoted, false if un-upvoted. */
  toggleUpvote(questionId: string, sessionId: string): boolean {
    if (!this.upvotes.has(questionId)) {
      this.upvotes.set(questionId, new Set());
    }
    const set = this.upvotes.get(questionId)!;
    if (set.has(sessionId)) {
      set.delete(sessionId);
      return false;
    }
    set.add(sessionId);
    return true;
  }

  hasUpvoted(questionId: string, sessionId: string): boolean {
    return this.upvotes.get(questionId)?.has(sessionId) ?? false;
  }

  // ─── Votes ─────────────────────────────────────────────────────────────────

  recordVote(pollId: string, sessionId: string) {
    if (!this.votes.has(pollId)) this.votes.set(pollId, new Set());
    this.votes.get(pollId)!.add(sessionId);
  }

  hasVoted(pollId: string, sessionId: string): boolean {
    return this.votes.get(pollId)?.has(sessionId) ?? false;
  }

  // ─── Quiz ──────────────────────────────────────────────────────────────────

  setQuizState(quizId: string, state: QuizRuntimeState) {
    this.quizStates.set(quizId, state);
  }

  getQuizState(quizId: string): QuizRuntimeState | undefined {
    return this.quizStates.get(quizId);
  }
}

// Singleton — persists for the lifetime of the Node process
export const store = new MemoryStore();
