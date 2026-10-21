// services/zohoToken.js
// Fetches and caches a Zoho OAuth access token.
// A single in-flight refresh promise is shared so concurrent requests don't
// each trigger their own refresh call.
import { config } from '../config.js';

let cachedToken = null;
let expiresAt = 0;      // ms timestamp when the token expires
let inflightRefresh = null;

const BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

export async function getAccessToken() {
  const now = Date.now();

  // Return cached token if still valid with buffer
  if (cachedToken && now < expiresAt - BUFFER_MS) {
    return cachedToken;
  }

  // Share one in-flight refresh — prevents stampede
  if (inflightRefresh) {
    return inflightRefresh;
  }

  inflightRefresh = _doRefresh(now).finally(() => {
    inflightRefresh = null;
  });

  return inflightRefresh;
}

async function _doRefresh(now) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.ZOHO_CLIENT_ID,
    client_secret: config.ZOHO_CLIENT_SECRET,
    refresh_token: config.ZOHO_REFRESH_TOKEN,
  });

  let res;
  try {
    res = await fetch(`${config.ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  } catch (err) {
    throw new Error(`[zohoToken] Network error during token refresh: ${err.message}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`[zohoToken] Invalid JSON from token endpoint (status ${res.status})`);
  }

  if (!res.ok || data.error) {
    // Log the error type only — never the secret or the token
    throw new Error(`[zohoToken] Token refresh failed: ${data.error || res.status}`);
  }

  cachedToken = data.access_token;
  expiresAt = now + (data.expires_in ?? 3600) * 1000;
  console.log('[zohoToken] Access token refreshed successfully.');
  return cachedToken;
}

/** Force the next call to getAccessToken() to refresh. */
export function invalidateToken() {
  cachedToken = null;
  expiresAt = 0;
}
