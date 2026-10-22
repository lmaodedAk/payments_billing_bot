// middleware/auth.js
// Authenticates Zoho CRM users via cryptographically signed assertion tokens.
// Validates HMAC-SHA256 signature, enforces a 2-minute validity window,
// and protects against replay attacks via atomic nonce consumption.
// Attaches verified `req.user = { id, email }` on success.

import crypto from 'crypto';
import { config } from '../config.js';
import { nonceStore } from '../services/nonceStore.js';

const TOKEN_VALIDITY_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Helper to generate a valid signed token (used by Deluge and unit tests).
 * Format: `${base64Payload}.${signatureHex}`
 * @param {{ userId: string, email: string, secret: string, timestamp?: number, nonce?: string }} opts
 * @returns {string}
 */
export function createSignedToken({
  userId,
  email,
  secret,
  timestamp = Date.now(),
  nonce = crypto.randomBytes(16).toString('hex'),
}) {
  if (!userId || !email || !secret) {
    throw new Error('userId, email, and secret are required to generate a signed token.');
  }

  const payloadJson = JSON.stringify({
    userId: String(userId).trim(),
    email: String(email).trim(),
    timestamp,
    nonce,
  });

  const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `${payloadB64}.${signature}`;
}

/**
 * Authentication middleware for user-scoped endpoints.
 * Rejects unauthenticated, tampered, expired, or replayed requests.
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization ?? req.headers['x-widget-token'] ?? '';

  if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required. Missing authorization token.',
    });
  }

  // Support "Bearer <token>" or raw token
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Invalid authorization header format.',
    });
  }

  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) {
    return res.status(401).json({
      error: 'Invalid token structure.',
    });
  }

  const payloadB64 = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  if (!payloadB64 || !signature) {
    return res.status(401).json({
      error: 'Invalid token structure.',
    });
  }

  let payload;
  try {
    const jsonStr = Buffer.from(payloadB64, 'base64').toString('utf8');
    payload = JSON.parse(jsonStr);
  } catch {
    return res.status(401).json({
      error: 'Invalid token payload encoding.',
    });
  }

  const { userId, email, timestamp, nonce } = payload || {};

  // Basic payload validation
  if (!userId || typeof userId !== 'string' || !userId.trim() ||
      !email || typeof email !== 'string' || !email.includes('@') ||
      !nonce || typeof nonce !== 'string' || !nonce.trim()) {
    return res.status(401).json({
      error: 'Invalid token payload components.',
    });
  }

  // Timestamp validation
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime)) {
    return res.status(401).json({
      error: 'Invalid token timestamp.',
    });
  }

  const now = Date.now();
  if (Math.abs(now - tokenTime) > TOKEN_VALIDITY_WINDOW_MS) {
    return res.status(401).json({
      error: 'Token has expired.',
    });
  }

  // Signature verification — secret is validated at startup by config.js.
  // In production, a missing secret causes config.js to throw before the server starts.
  // We read from process.env at request time so tests can set it in beforeAll()
  // without needing to bust Jest's module cache.
  const secret = process.env.ZOHO_WIDGET_SECRET || config.ZOHO_WIDGET_SECRET;
  if (!secret) {
    // This branch can only be reached in a test that has not set the env var.
    // In production, config.js already throws at startup.
    console.error('[authMiddleware] ZOHO_WIDGET_SECRET not set — authentication cannot proceed.');
    return res.status(500).json({
      error: 'Authentication service unavailable.',
    });
  }

  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).json({
        error: 'Invalid token signature.',
      });
    }
  } catch {
    return res.status(401).json({
      error: 'Invalid token signature encoding.',
    });
  }

  // Nonce validation (Replay Defense)
  const isFresh = await nonceStore.consumeNonce(nonce, TOKEN_VALIDITY_WINDOW_MS);
  if (!isFresh) {
    return res.status(401).json({
      error: 'Token replay detected.',
    });
  }

  // Attach verified user identity
  req.user = Object.freeze({
    id: userId.trim(),
    email: email.trim(),
  });

  next();
}
