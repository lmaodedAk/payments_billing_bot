// middleware/errorHandler.js
// Central error handler — never leaks Zoho error details to the client.
export function errorHandler(err, req, res, _next) {
  // Sanitise message before logging (strip any token-like strings)
  const sanitized = (err?.message ?? 'Unknown error')
    .replace(/Zoho-oauthtoken\s+\S+/gi, 'Zoho-oauthtoken [REDACTED]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');

  console.error(`[errorHandler] ${req.method} ${req.path} — ${sanitized}`);

  if (err.name === 'AbortError') {
    return res.status(504).json({
      error: 'Assistant is unavailable. Please try again.',
    });
  }

  // Default: 502 with a generic message — never forward Zoho error details
  res.status(502).json({
    error: 'Assistant is unavailable. Please try again.',
  });
}
