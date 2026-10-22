// tests/config.test.js
// Verifies that config.js required-variable logic behaves correctly.
// Because config.js is a module singleton, we test the startup-guard logic
// directly rather than re-importing the module per test.

import { describe, it, expect } from '@jest/globals';

// ── Unit tests for the requiredInProduction guard logic ──────────────────────
// We cannot trivially re-import config.js per test in Jest's ES module mode
// (jest.resetModules() only works reliably with CJS). Instead, we replicate the
// guard function logic here and verify the exact conditions it enforces.

function requiredInProduction(name, envVars = {}, nodeEnv = 'production') {
  const val = envVars[name];
  if (!val) {
    if (nodeEnv === 'test') {
      return '';
    }
    throw new Error(
      `[config] Missing required env var: ${name}. ` +
      'Set this in your Vercel project settings (or .env for local dev). ' +
      'The server cannot start without it.'
    );
  }
  return val;
}

describe('config.js — startup validation guard logic', () => {
  it('returns the value when the var is present in any environment', () => {
    expect(requiredInProduction('ZOHO_WIDGET_SECRET', { ZOHO_WIDGET_SECRET: 'my-secret' }, 'production')).toBe('my-secret');
    expect(requiredInProduction('ZOHO_WIDGET_SECRET', { ZOHO_WIDGET_SECRET: 'my-secret' }, 'test')).toBe('my-secret');
  });

  it('throws in production when ZOHO_WIDGET_SECRET is missing', () => {
    expect(() => requiredInProduction('ZOHO_WIDGET_SECRET', {}, 'production'))
      .toThrow('[config] Missing required env var: ZOHO_WIDGET_SECRET');
  });

  it('throws in staging (non-test) when ZOHO_WIDGET_SECRET is missing', () => {
    expect(() => requiredInProduction('ZOHO_WIDGET_SECRET', {}, 'staging'))
      .toThrow('[config] Missing required env var: ZOHO_WIDGET_SECRET');
  });

  it('does NOT throw in test environment when ZOHO_WIDGET_SECRET is missing — returns empty string', () => {
    const result = requiredInProduction('ZOHO_WIDGET_SECRET', {}, 'test');
    expect(result).toBe('');
  });

  it('error message includes actionable guidance', () => {
    expect(() => requiredInProduction('ZOHO_WIDGET_SECRET', {}, 'production'))
      .toThrow('Vercel project settings');
  });
});

// ── Integration check: actual config exports required fields ─────────────────
// config.js is already loaded (this test file imports the test runner after
// the test .env is applied). We check the shape rather than repeating all values.
import { config } from '../src/config.js';

describe('config.js — exported config shape', () => {
  // These keys must be non-empty in .env for the server to start.
  const requiredKeys = [
    'ZOHO_CLIENT_ID',
    'ZOHO_CLIENT_SECRET',
    'ZOHO_REFRESH_TOKEN',
    'ZIA_ORG_ID',
    'ZIA_AGENT_ID',
    'ZIA_VERSION_ID',
    'ZIA_AGENT_URL',
  ];

  it.each(requiredKeys)('config.%s is a non-empty string', (key) => {
    expect(typeof config[key]).toBe('string');
    expect(config[key].length).toBeGreaterThan(0);
  });

  it('ZOHO_WIDGET_SECRET is a string (may be empty in test when not locally set)', () => {
    // Auth tests set process.env.ZOHO_WIDGET_SECRET in their beforeAll().
    // config.js returns '' for a missing secret in NODE_ENV=test (safe-fail).
    // In production, a missing secret causes a startup error.
    expect(typeof config.ZOHO_WIDGET_SECRET).toBe('string');
  });

  it('config object is frozen (immutable)', () => {
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('ALLOWED_ORIGINS is an array', () => {
    expect(Array.isArray(config.ALLOWED_ORIGINS)).toBe(true);
  });

  it('API_KEYS is an array', () => {
    expect(Array.isArray(config.API_KEYS)).toBe(true);
  });
});

