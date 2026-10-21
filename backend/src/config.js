// config.js — reads and validates all required environment variables.
// Throws at startup if anything is missing so the server fails fast.
import 'dotenv/config';

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`[config] Missing required env var: ${name}`);
  return val;
}

function list(name) {
  return (process.env[name] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = Object.freeze({
  PORT: parseInt(process.env.PORT || '4000', 10),
  ZOHO_ACCOUNTS_URL:
    process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com',
  ZOHO_CLIENT_ID: required('ZOHO_CLIENT_ID'),
  ZOHO_CLIENT_SECRET: required('ZOHO_CLIENT_SECRET'),
  ZOHO_REFRESH_TOKEN: required('ZOHO_REFRESH_TOKEN'),
  ZIA_ORG_ID: required('ZIA_ORG_ID'),
  ZIA_AGENT_ID: required('ZIA_AGENT_ID'),
  ZIA_VERSION_ID: required('ZIA_VERSION_ID'),
  ALLOWED_ORIGINS: list('ALLOWED_ORIGINS'),
  API_KEYS: list('API_KEYS'),
});

export function isOriginAllowed(origin) {
  if (!origin) return true;
  // If allowed origins has '*' or is empty, allow all origins
  if (config.ALLOWED_ORIGINS.includes('*') || config.ALLOWED_ORIGINS.length === 0) {
    return true;
  }
  // Exact match
  if (config.ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  // Support any vercel deployment
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
    return true;
  }
  // Support localhost
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
}
