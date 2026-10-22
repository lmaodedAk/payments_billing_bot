// routes/chat.js
import { Router } from 'express';
import { randomUUID } from 'crypto';
import { askAgent } from '../services/ziaAgent.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { message, sessionId } = req.body ?? {};

    // ── Validation ────────────────────────────────────────────────────────────
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required and must be a string.' });
    }

    const trimmed = message.trim();

    if (!trimmed) {
      return res.status(400).json({ error: 'message must not be empty.' });
    }

    if (trimmed.length > 1000) {
      return res
        .status(400)
        .json({ error: 'message must be 1000 characters or fewer.' });
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Use the provided session ID or create a fresh one
    const activeSessionId =
      typeof sessionId === 'string' && sessionId.trim()
        ? sessionId.trim()
        : randomUUID();

    const { reply, sessionId: returnedSessionId } = await askAgent({
      message: trimmed,
      sessionId: activeSessionId,
      userId: req.user.id,
    });

    return res.json({ reply, sessionId: returnedSessionId });
  } catch (err) {
    next(err);
  }
});

export default router;
