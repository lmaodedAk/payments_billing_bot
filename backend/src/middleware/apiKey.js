// middleware/apiKey.js
// Requests from an allowed browser origin pass through without a key.
// Requests from any other origin require a valid x-api-key header.
import { config } from '../config.js';

export function apiKeyMiddleware(req, res, next) {
  const origin = req.headers.origin ?? '';
  const providedKey = req.headers['x-api-key'] ?? '';

  // Browser requests from an allowed CORS origin — no key needed
  if (origin && config.ALLOWED_ORIGINS.includes(origin)) {
    return next();
  }

  // Server-to-server (no matching origin) — key required
  if (!config.API_KEYS.length) {
    // No keys configured at all → reject non-origin requests
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!providedKey || !config.API_KEYS.includes(providedKey)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}
