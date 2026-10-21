// services/ziaAgent.js
// Calls the Zoho Zia Agents /query endpoint and returns the agent's reply.
import { config } from '../config.js';
import { getAccessToken, invalidateToken } from './zohoToken.js';

const ZIA_QUERY_URL = 'https://ziaagents.zoho.com/ziaagents/api/v1/agents/query';

// In-process conversation history keyed by sessionId.
// Stores the last N message pairs for context injection.
const MAX_HISTORY = 4; // pairs (user + agent)
const history = new Map(); // sessionId → [{ role, text }, ...]

/**
 * Extract the agent's reply text from the response JSON.
 * Reads data.response — the confirmed path from Phase 1 discovery.
 * Throws a clean error if the reply is missing; never dumps raw JSON to callers.
 * @param {object} responseJson
 * @returns {string}
 */
export function extractReply(responseJson) {
  const reply = responseJson?.data?.response;
  if (typeof reply === 'string' && reply.trim()) return reply;

  // Log the unexpected shape for the developer (server-side only).
  console.error(
    '[ziaAgent] extractReply: data.response missing. Top-level keys:',
    Object.keys(responseJson || {}),
  );
  throw new Error('Agent returned a response in an unexpected format.');
}

/**
 * Build the query string to send to Zia.
 * When a conversation history exists we prepend the last MAX_HISTORY pairs
 * so the stateless /query endpoint has context.
 * @param {string} message  The current user message.
 * @param {string} sessionId
 * @returns {string}
 */
function buildQuery(message, sessionId) {
  const prior = history.get(sessionId);
  if (!prior || prior.length === 0) return message;

  const ctx = prior
    .map(({ role, text }) => `${role === 'user' ? 'User' : 'Agent'}: ${text}`)
    .join('\n');
  return `${ctx}\nUser: ${message}`;
}

/**
 * Make one HTTP call to the Zia /query endpoint.
 * @param {string} query   Full query string (may include context prefix).
 * @param {string} token   OAuth access token.
 * @returns {Promise<Response>}
 */
async function callAgent(query, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    return await fetch(ZIA_QUERY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        'X-ZIAAGENTS-ORG': config.ZIA_ORG_ID,
        'X-ZIAAGENTS-AGENT-ID': config.ZIA_AGENT_ID,
        'X-ZIAAGENTS-AGENT-VERSION-ID': config.ZIA_VERSION_ID,
      },
      body: JSON.stringify({
        query,
        systemArgs: {},
        reasoning: false,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the Zia agent a question and return its reply plus the session ID.
 * Maintains an in-process conversation history for context across turns.
 * @param {{ message: string, sessionId: string }} opts
 * @returns {Promise<{ reply: string, sessionId: string }>}
 */
export async function askAgent({ message, sessionId }) {
  const query = buildQuery(message, sessionId);

  let token = await getAccessToken();
  let res = await callAgent(query, token);

  // 401 → refresh token once and retry
  if (res.status === 401) {
    console.warn('[ziaAgent] 401 received — refreshing token and retrying.');
    invalidateToken();
    token = await getAccessToken();
    res = await callAgent(query, token);
  }

  let responseJson;
  try {
    responseJson = await res.json();
  } catch {
    throw new Error(`[ziaAgent] Non-JSON response from agent (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    console.error(`[ziaAgent] Agent API returned ${res.status}:`, JSON.stringify(responseJson));
    throw new Error(`Agent API error: ${res.status}`);
  }

  const reply = extractReply(responseJson);

  // Update conversation history for this session
  const prior = history.get(sessionId) ?? [];
  prior.push({ role: 'user', text: message });
  prior.push({ role: 'agent', text: reply });
  // Keep only the last MAX_HISTORY pairs (2 entries per pair)
  if (prior.length > MAX_HISTORY * 2) prior.splice(0, prior.length - MAX_HISTORY * 2);
  history.set(sessionId, prior);

  return { reply, sessionId };
}
