// services/nonceStore.js
// Dual-mode nonce store with atomic consumption and TTL eviction:
// 1. Production (Vercel Serverless): Uses atomic SET NX PX on Vercel KV / Upstash Redis REST API across instances.
// 2. Development / Testing: Uses an atomic in-memory Map with automatic TTL sweeps.

class NonceStore {
  constructor(sweepIntervalMs = 60000) {
    this.nonces = new Map(); // nonce -> expiresAt (ms timestamp)
    this.sweepIntervalMs = sweepIntervalMs;
    this.timer = null;

    if (process.env.NODE_ENV !== 'test') {
      this.timer = setInterval(() => this.cleanup(), this.sweepIntervalMs);
      if (this.timer.unref) this.timer.unref();

      // Warn at startup if distributed replay protection is unavailable.
      // Without KV, a replayed token can succeed on a different Vercel instance.
      if (!this.kvUrl || !this.kvToken) {
        console.warn(
          '[nonceStore] WARNING: KV_REST_API_URL / KV_REST_API_TOKEN are not set. ' +
          'Nonce replay protection is IN-MEMORY ONLY and will NOT prevent replays ' +
          'across separate serverless instances. ' +
          'Set KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV or Upstash Redis) ' +
          'before deploying to production.'
        );
      }
    }
  }

  get kvUrl() {
    return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || null;
  }

  get kvToken() {
    return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || null;
  }

  /**
   * Atomically consumes a nonce across multi-instance serverless deployments.
   * If Vercel KV / Upstash Redis is configured, executes atomic SET NX PX.
   * Otherwise, executes atomic check-and-set in memory.
   * @param {string} nonce 
   * @param {number} ttlMs 
   * @returns {Promise<boolean>} true if fresh and consumed; false if replayed
   */
  async consumeNonce(nonce, ttlMs = 120000) {
    if (!nonce || typeof nonce !== 'string') return false;

    // Multi-instance persistent store via Vercel KV / Upstash Redis
    if (this.kvUrl && this.kvToken) {
      try {
        const key = `nonce:${nonce}`;
        const url = `${this.kvUrl}/set/${encodeURIComponent(key)}/1?nx=true&px=${ttlMs}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.kvToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Redis returns "OK" if key was set (fresh), null if key already existed (replayed)
          return data?.result === 'OK';
        }
        console.warn(`[nonceStore] KV REST API returned ${res.status}, falling back to memory.`);
      } catch (err) {
        console.error(`[nonceStore] KV network error: ${err.message}, falling back to memory.`);
      }
    }

    // In-memory atomic fallback
    const now = Date.now();
    const existingExpiry = this.nonces.get(nonce);

    if (existingExpiry && existingExpiry > now) {
      return false; // Replay detected
    }

    this.nonces.set(nonce, now + ttlMs);
    return true;
  }

  /**
   * Removes expired nonces from memory.
   */
  cleanup() {
    const now = Date.now();
    for (const [nonce, expiresAt] of this.nonces.entries()) {
      if (expiresAt <= now) {
        this.nonces.delete(nonce);
      }
    }
  }

  /**
   * Clears all stored nonces (useful for testing).
   */
  clear() {
    this.nonces.clear();
  }

  /**
   * Stop background timer.
   */
  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const nonceStore = new NonceStore();
