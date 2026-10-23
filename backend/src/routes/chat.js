// routes/chat.js
import { Router } from 'express';
import { randomUUID } from 'crypto';
import { askAgent } from '../services/ziaAgent.js';

import { parseIntentFromMessage } from '../services/actionParser.js';

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

    // Parse intent for client-side SDK tool execution
    const intent = parseIntentFromMessage(trimmed);

    // If a CRM operation is requested, return the structured action proposal.
    // Do NOT execute privileged CRM operations on the backend using the shared Admin token.
    if (intent.action !== 'NONE') {
      return res.json({
        action: intent.action,
        params: intent.params,
        reply: intent.reply || '',
        sessionId: activeSessionId,
      });
    }

    // Fail-safe check: if the message contains lead, leads, contact, contacts, deal, deals,
    // record, CRM, or a 15-22 digit ID, and no safe action was parsed, return action NONE
    // with a fixed reply asking the user to rephrase. Do NOT call askAgent in that case.
    const CRM_KEYWORD_PATTERN = /\b(leads?|contacts?|deals?|records?|crm)\b|\b\d{15,22}\b/i;
    if (intent.blockedFromAgent || CRM_KEYWORD_PATTERN.test(trimmed)) {
      return res.json({
        action: 'NONE',
        params: {},
        reply:
          intent.reply ||
          'I detected a CRM-related request, but could not safely determine the exact action. For your security, CRM operations cannot run through the general AI assistant. Please rephrase using an approved format (for example: "search leads for <name>").',
        sessionId: activeSessionId,
      });
    }

    // Otherwise, route general conversational / billing inquiries to Zia Agent
    const { reply, sessionId: returnedSessionId } = await askAgent({
      message: trimmed,
      sessionId: activeSessionId,
      userId: req.user.id,
    });

    return res.json({
      action: 'NONE',
      params: {},
      reply,
      sessionId: returnedSessionId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
