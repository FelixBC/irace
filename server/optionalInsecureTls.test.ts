import { describe, it, expect } from 'vitest';
import { applyOptionalInsecureTlsFromEnv } from './optionalInsecureTls.js';

describe('applyOptionalInsecureTlsFromEnv', () => {
  const KEYS = ['ALLOW_INSECURE_TLS', 'NODE_TLS_REJECT_UNAUTHORIZED'];

  function withSavedEnv(fn: () => void) {
    const saved: Record<string, string | undefined> = {};
    for (const k of KEYS) saved[k] = process.env[k];
    for (const k of KEYS) delete process.env[k];
    try {
      fn();
    } finally {
      for (const k of KEYS) {
        if (saved[k] === undefined) delete process.env[k];
        else process.env[k] = saved[k];
      }
    }
  }

  it('does not set NODE_TLS when ALLOW_INSECURE_TLS is unset', () => {
    withSavedEnv(() => {
      applyOptionalInsecureTlsFromEnv();
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBeUndefined();
    });
  });

  it('sets NODE_TLS_REJECT_UNAUTHORIZED=0 when ALLOW_INSECURE_TLS is true', () => {
    withSavedEnv(() => {
      process.env.ALLOW_INSECURE_TLS = 'true';
      applyOptionalInsecureTlsFromEnv();
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe('0');
    });
  });

  it('accepts ALLOW_INSECURE_TLS=1', () => {
    withSavedEnv(() => {
      process.env.ALLOW_INSECURE_TLS = '1';
      applyOptionalInsecureTlsFromEnv();
      expect(process.env.NODE_TLS_REJECT_UNAUTHORIZED).toBe('0');
    });
  });
});
