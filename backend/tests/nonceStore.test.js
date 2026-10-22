// tests/nonceStore.test.js
import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { nonceStore } from '../src/services/nonceStore.js';

describe('NonceStore Service', () => {
  beforeEach(() => {
    nonceStore.clear();
  });

  afterAll(() => {
    nonceStore.destroy();
  });

  it('atomically consumes a fresh nonce and allows first use', async () => {
    const isFresh = await nonceStore.consumeNonce('nonce-1', 5000);
    expect(isFresh).toBe(true);
  });

  it('rejects a replayed nonce within the validity window', async () => {
    const firstUse = await nonceStore.consumeNonce('nonce-replay', 5000);
    expect(firstUse).toBe(true);

    const replayAttempt = await nonceStore.consumeNonce('nonce-replay', 5000);
    expect(replayAttempt).toBe(false);
  });

  it('allows reuse after the TTL window expires and cleanup runs', async () => {
    const shortTtl = 50; // ms
    const firstUse = await nonceStore.consumeNonce('nonce-expiring', shortTtl);
    expect(firstUse).toBe(true);

    // Wait for TTL to elapse
    await new Promise((resolve) => setTimeout(resolve, 60));
    nonceStore.cleanup();

    const secondUse = await nonceStore.consumeNonce('nonce-expiring', shortTtl);
    expect(secondUse).toBe(true);
  });

  it('handles invalid or empty nonce inputs safely', async () => {
    expect(await nonceStore.consumeNonce('')).toBe(false);
    expect(await nonceStore.consumeNonce(null)).toBe(false);
    expect(await nonceStore.consumeNonce(undefined)).toBe(false);
    expect(await nonceStore.consumeNonce(123)).toBe(false);
  });
});
