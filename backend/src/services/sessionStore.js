// services/sessionStore.js
// Stores and isolates conversation turns strictly partitioned by verified userId and sessionId.
// Prevents cross-user conversation exposure and session spoofing.
// Automatically cleans up inactive sessions after a configurable TTL (default: 30 minutes).

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_MAX_PAIRS = 4;           // Max conversation turn pairs (user + agent)

class SessionStore {
  constructor(ttlMs = DEFAULT_TTL_MS, sweepIntervalMs = 60000) {
    this.sessions = new Map(); // compositeKey (`${userId}:${sessionId}`) -> { history: [...], lastAccessed: ms }
    this.ttlMs = ttlMs;
    this.sweepIntervalMs = sweepIntervalMs;
    this.timer = null;

    if (process.env.NODE_ENV !== 'test') {
      this.timer = setInterval(() => this.cleanup(), this.sweepIntervalMs);
      if (this.timer.unref) this.timer.unref();
    }
  }

  /**
   * Generates an isolated composite key for a user and session.
   * @param {string} userId 
   * @param {string} sessionId 
   * @returns {string}
   */
  _getCompositeKey(userId, sessionId) {
    if (!userId || !sessionId) {
      throw new Error('[sessionStore] userId and sessionId are both required to access session state.');
    }
    return `${userId}:${sessionId}`;
  }

  /**
   * Retrieve conversation history for a specific user and session.
   * Updates lastAccessed timestamp.
   * Returns empty array if session does not exist or has expired.
   * @param {string} userId 
   * @param {string} sessionId 
   * @returns {Array<{ role: string, text: string }>}
   */
  getHistory(userId, sessionId) {
    const key = this._getCompositeKey(userId, sessionId);
    const entry = this.sessions.get(key);

    if (!entry) return [];

    const now = Date.now();
    if (now - entry.lastAccessed > this.ttlMs) {
      this.sessions.delete(key);
      return [];
    }

    entry.lastAccessed = now;
    return entry.history.slice(); // Return shallow copy
  }

  /**
   * Append a completed conversation turn to a user's isolated session history.
   * @param {string} userId 
   * @param {string} sessionId 
   * @param {string} userText 
   * @param {string} agentReply 
   * @param {number} maxPairs 
   */
  appendTurn(userId, sessionId, userText, agentReply, maxPairs = DEFAULT_MAX_PAIRS) {
    const key = this._getCompositeKey(userId, sessionId);
    const now = Date.now();

    let entry = this.sessions.get(key);
    if (!entry || now - entry.lastAccessed > this.ttlMs) {
      entry = { history: [], lastAccessed: now };
    }

    entry.history.push({ role: 'user', text: userText });
    entry.history.push({ role: 'agent', text: agentReply });

    // Retain only the last maxPairs * 2 messages
    const maxEntries = maxPairs * 2;
    if (entry.history.length > maxEntries) {
      entry.history.splice(0, entry.history.length - maxEntries);
    }

    entry.lastAccessed = now;
    this.sessions.set(key, entry);
  }

  /**
   * Cleans up expired sessions.
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.sessions.entries()) {
      if (now - entry.lastAccessed > this.ttlMs) {
        this.sessions.delete(key);
      }
    }
  }

  /**
   * Total active session count.
   */
  get size() {
    return this.sessions.size;
  }

  /**
   * Clear all sessions (for tests).
   */
  clear() {
    this.sessions.clear();
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const sessionStore = new SessionStore();
