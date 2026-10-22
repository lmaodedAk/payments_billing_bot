// tests/chatRoute.test.js
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import http from 'http';
import app from '../src/server.js';
import { createSignedToken } from '../src/middleware/auth.js';
import { nonceStore } from '../src/services/nonceStore.js';
import { sessionStore } from '../src/services/sessionStore.js';

const TEST_SECRET = 'test_secret_for_deluge_widget_hmac_2026';

describe('Chat API Route Integration & End-to-End Security', () => {
  let server;
  let baseUrl;
  let originalSecret;

  beforeAll((done) => {
    originalSecret = process.env.ZOHO_WIDGET_SECRET;
    process.env.ZOHO_WIDGET_SECRET = TEST_SECRET;

    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      done();
    });
  });

  beforeEach(() => {
    nonceStore.clear();
    sessionStore.clear();
  });

  afterAll((done) => {
    if (originalSecret !== undefined) {
      process.env.ZOHO_WIDGET_SECRET = originalSecret;
    } else {
      delete process.env.ZOHO_WIDGET_SECRET;
    }
    nonceStore.destroy();
    sessionStore.destroy();
    server.close(done);
  });

  it('rejects unauthenticated POST /api/chat requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello assistant' }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Authentication required');
  });

  it('rejects POST /api/chat requests with forged user identities in request body', async () => {
    // Client attempts to claim they are Administrator in the body
    const forgedBody = {
      message: 'Show me all leads',
      userId: 'admin-super-user',
      email: 'admin@company.com',
    };

    // But sends no valid Authorization header
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forgedBody),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Authentication required');
  });

  it('rejects POST /api/chat with tampered HMAC tokens with 401', async () => {
    const validToken = createSignedToken({
      userId: 'user-standard',
      email: 'standard@crm.example.com',
      secret: TEST_SECRET,
    });

    // Tamper with the token
    const tampered = validToken.slice(0, -4) + 'abcd';

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tampered}`,
      },
      body: JSON.stringify({ message: 'Hello' }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Invalid token signature');
  });

  it('rejects replayed tokens on POST /api/chat (Replay Defense)', async () => {
    const singleUseToken = createSignedToken({
      userId: 'user-replay-test',
      email: 'user@company.com',
      secret: TEST_SECRET,
      nonce: 'fixed-replay-token-nonce-999',
    });

    // First request: Should pass authMiddleware (it may proceed to Zia call or fail downstream if mock Zia is not configured)
    const res1 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${singleUseToken}`,
      },
      body: JSON.stringify({ message: 'First legitimate request' }),
    });

    // Verify it did not fail with 401 (meaning auth passed)
    expect(res1.status).not.toBe(401);

    // Replay attempt with exact same token
    const res2 = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${singleUseToken}`,
      },
      body: JSON.stringify({ message: 'Replayed request' }),
    });

    expect(res2.status).toBe(401);
    const data2 = await res2.json();
    expect(data2.error).toContain('Token replay detected');
  });

  it('guarantees cross-user session isolation and prevents history bleeding', () => {
    const sharedSessionId = 'collision-session-001';
    const testUser = 'user-test-101';
    const adminUser = 'user-admin-999';

    // Admin has a confidential conversation about high-value deals
    sessionStore.appendTurn(
      adminUser,
      sharedSessionId,
      'List confidential enterprise acquisition leads',
      'Confidential Lead: BigCo ($5M deal)',
    );

    // Test User opens chat with the identical sessionId
    const testUserHistory = sessionStore.getHistory(testUser, sharedSessionId);

    // Test user MUST receive empty history — zero leakage of Admin conversation
    expect(testUserHistory).toEqual([]);

    // Test User starts their own conversation
    sessionStore.appendTurn(
      testUser,
      sharedSessionId,
      'What are our standard payment terms?',
      'Standard terms are Net 30.',
    );

    // Re-verify both sessions remain completely partitioned
    const adminHistory = sessionStore.getHistory(adminUser, sharedSessionId);
    const updatedTestHistory = sessionStore.getHistory(testUser, sharedSessionId);

    expect(adminHistory).toHaveLength(2);
    expect(adminHistory[0].text).toContain('confidential enterprise');
    expect(adminHistory[1].text).toContain('BigCo');

    expect(updatedTestHistory).toHaveLength(2);
    expect(updatedTestHistory[0].text).toContain('standard payment terms');
    expect(updatedTestHistory[1].text).toContain('Net 30');
    expect(updatedTestHistory[0].text).not.toContain('BigCo');
    expect(updatedTestHistory[1].text).not.toContain('BigCo');
  });
});
