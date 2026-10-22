// tests/sessionStore.test.js
import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { sessionStore } from '../src/services/sessionStore.js';

describe('SessionStore Service (User-Scoped Session Isolation)', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  afterAll(() => {
    sessionStore.destroy();
  });

  it('strictly isolates history between different users sharing the same sessionId', () => {
    const sharedSessionId = 'shared-session-xyz';
    const userA = 'user-1001';
    const userB = 'user-2002';

    // User A conducts a conversation
    sessionStore.appendTurn(userA, sharedSessionId, 'User A query about invoice #1', 'Agent answer to User A');

    // User B opens chat with the identical sessionId
    const userBHistory = sessionStore.getHistory(userB, sharedSessionId);
    expect(userBHistory).toEqual([]);

    // User B conducts their own conversation
    sessionStore.appendTurn(userB, sharedSessionId, 'User B query about lead #2', 'Agent answer to User B');

    // Verify User A and User B histories are completely independent
    const historyA = sessionStore.getHistory(userA, sharedSessionId);
    const historyB = sessionStore.getHistory(userB, sharedSessionId);

    expect(historyA).toHaveLength(2);
    expect(historyA[0]).toEqual({ role: 'user', text: 'User A query about invoice #1' });
    expect(historyA[1]).toEqual({ role: 'agent', text: 'Agent answer to User A' });

    expect(historyB).toHaveLength(2);
    expect(historyB[0]).toEqual({ role: 'user', text: 'User B query about lead #2' });
    expect(historyB[1]).toEqual({ role: 'agent', text: 'Agent answer to User B' });
  });

  it('limits stored conversation turns to maxPairs', () => {
    const user = 'user-1001';
    const session = 'session-limit';
    const maxPairs = 2; // 4 messages total

    sessionStore.appendTurn(user, session, 'Msg 1', 'Reply 1', maxPairs);
    sessionStore.appendTurn(user, session, 'Msg 2', 'Reply 2', maxPairs);
    sessionStore.appendTurn(user, session, 'Msg 3', 'Reply 3', maxPairs);

    const history = sessionStore.getHistory(user, session);
    expect(history).toHaveLength(4); // 2 pairs
    expect(history[0].text).toBe('Msg 2');
    expect(history[1].text).toBe('Reply 2');
    expect(history[2].text).toBe('Msg 3');
    expect(history[3].text).toBe('Reply 3');
  });

  it('expires inactive sessions after TTL', async () => {
    const shortStore = new (sessionStore.constructor)(50, 100);
    const user = 'user-expiring';
    const session = 'session-expiring';

    shortStore.appendTurn(user, session, 'Hello', 'Hi');
    expect(shortStore.getHistory(user, session)).toHaveLength(2);

    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(shortStore.getHistory(user, session)).toEqual([]);
    shortStore.destroy();
  });

  it('throws an error if accessed without both userId and sessionId', () => {
    expect(() => sessionStore.getHistory(null, 'session-1')).toThrow();
    expect(() => sessionStore.getHistory('user-1', null)).toThrow();
    expect(() => sessionStore.appendTurn(null, 'session-1', 'a', 'b')).toThrow();
  });
});
