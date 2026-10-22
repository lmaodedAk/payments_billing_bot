// tests/auth.test.js
import { describe, it, expect, beforeEach, afterAll, beforeAll } from '@jest/globals';
import { authMiddleware, createSignedToken } from '../src/middleware/auth.js';
import { nonceStore } from '../src/services/nonceStore.js';
import { config } from '../src/config.js';

const TEST_SECRET = 'test_secret_for_deluge_widget_hmac_2026';

describe('Auth Middleware & Deluge Assertion Verification', () => {
  let originalSecret;

  beforeAll(() => {
    originalSecret = process.env.ZOHO_WIDGET_SECRET;
    process.env.ZOHO_WIDGET_SECRET = TEST_SECRET;
  });

  beforeEach(() => {
    nonceStore.clear();
  });

  afterAll(() => {
    if (originalSecret !== undefined) {
      process.env.ZOHO_WIDGET_SECRET = originalSecret;
    } else {
      delete process.env.ZOHO_WIDGET_SECRET;
    }
    nonceStore.destroy();
  });

  function createMockContext(headers = {}) {
    const req = {
      headers: { ...headers },
      user: null,
    };
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    return { req, res, next, wasNextCalled: () => nextCalled };
  }

  it('rejects requests with missing Authorization header (401)', async () => {
    const { req, res, next, wasNextCalled } = createMockContext({});

    await authMiddleware(req, res, next);

    expect(wasNextCalled()).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error).toContain('Missing authorization token');
  });

  it('rejects malformed token strings without delimiter (401)', async () => {
    const { req, res, next, wasNextCalled } = createMockContext({
      authorization: 'Bearer malformed-token-without-dot',
    });

    await authMiddleware(req, res, next);

    expect(wasNextCalled()).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error).toContain('Invalid token structure');
  });

  it('rejects malformed token strings with invalid JSON payload (401)', async () => {
    const { req, res, next, wasNextCalled } = createMockContext({
      authorization: 'Bearer notjson.fakehexsignature',
    });

    await authMiddleware(req, res, next);

    expect(wasNextCalled()).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error).toContain('Invalid token payload encoding');
  });

  it('rejects tokens with forged or tampered signatures (401)', async () => {
    const validToken = createSignedToken({
      userId: 'zoho-user-123',
      email: 'user@company.com',
      secret: TEST_SECRET,
    });

    // Tamper with userId in payload
    const [payloadB64, signature] = validToken.split('.');
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    decoded.userId = 'forged-admin-id';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decoded)).toString('base64');
    const tamperedToken = `${tamperedPayloadB64}.${signature}`;

    const { req, res, next, wasNextCalled } = createMockContext({
      authorization: `Bearer ${tamperedToken}`,
    });

    await authMiddleware(req, res, next);

    expect(wasNextCalled()).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error).toContain('Invalid token signature');
  });

  it('rejects tokens signed with an incorrect secret (401)', async () => {
    const wrongSecretToken = createSignedToken({
      userId: 'zoho-user-123',
      email: 'user@company.com',
      secret: 'wrong_unauthorized_secret_key',
    });

    const { req, res, next, wasNextCalled } = createMockContext({
      authorization: `Bearer ${wrongSecretToken}`,
    });

    await authMiddleware(req, res, next);

    expect(wasNextCalled()).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error).toContain('Invalid token signature');
  });

  it('rejects expired tokens older than the 2-minute validity window (401)', async () => {
    const expiredTimestamp = Date.now() - (3 * 60 * 1000); // 3 minutes ago
    const expiredToken = createSignedToken({
      userId: 'zoho-user-123',
      email: 'user@company.com',
      secret: TEST_SECRET,
      timestamp: expiredTimestamp,
    });

    const { req, res, next, wasNextCalled } = createMockContext({
      authorization: `Bearer ${expiredToken}`,
    });

    await authMiddleware(req, res, next);

    expect(wasNextCalled()).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.error).toContain('Token has expired');
  });

  it('rejects replayed tokens using the same nonce (401)', async () => {
    const token = createSignedToken({
      userId: 'zoho-user-123',
      email: 'user@company.com',
      secret: TEST_SECRET,
      nonce: 'fixed-replay-nonce-001',
    });

    // First request -> should pass
    const ctx1 = createMockContext({ authorization: `Bearer ${token}` });
    await authMiddleware(ctx1.req, ctx1.res, ctx1.next);
    expect(ctx1.wasNextCalled()).toBe(true);
    expect(ctx1.req.user).toEqual({ id: 'zoho-user-123', email: 'user@company.com' });

    // Second request with exact same token/nonce -> should fail (Replay detected)
    const ctx2 = createMockContext({ authorization: `Bearer ${token}` });
    await authMiddleware(ctx2.req, ctx2.res, ctx2.next);
    expect(ctx2.wasNextCalled()).toBe(false);
    expect(ctx2.res.statusCode).toBe(401);
    expect(ctx2.res.jsonData.error).toContain('Token replay detected');
  });

  it('authenticates valid tokens and attaches verified req.user', async () => {
    const validToken = createSignedToken({
      userId: 'zoho-test-user-456',
      email: 'testuser@crm.example.com',
      secret: TEST_SECRET,
    });

    const { req, res, next, wasNextCalled } = createMockContext({
      authorization: `Bearer ${validToken}`,
    });

    await authMiddleware(req, res, next);

    expect(wasNextCalled()).toBe(true);
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('zoho-test-user-456');
    expect(req.user.email).toBe('testuser@crm.example.com');
  });
});
