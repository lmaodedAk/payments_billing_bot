// middleware/apiKey.js
// Requests from an allowed browser origin pass through without a key.
// Requests from any other origin require a valid x-api-key header if API_KEYS are set.
import { config, isOriginAllowed } from '../config.js';

export function apiKeyMiddleware(req, res, next) {
  const origin = req.headers.origin ?? '';
  const providedKey = req.headers['x-api-key'] ?? '';

  // Browser requests from an allowed CORS origin — no key needed
  if (origin && isOriginAllowed(origin)) {
    return next();
  }

  // If no API keys are configured, allow requests through
  if (!config.API_KEYS.length) {
    return next();
  }

  // Key required if API_KEYS are defined
  if (!providedKey || !config.API_KEYS.includes(providedKey)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
}
