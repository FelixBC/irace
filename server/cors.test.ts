import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { applyCors } from './cors.js';

describe('applyCors', () => {
  const envKeys = ['FRONTEND_URL', 'ALLOWED_ORIGINS', 'NODE_ENV'] as const;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of envKeys) saved[k] = process.env[k];
  });

  afterEach(() => {
    for (const k of envKeys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  function req(origin?: string): VercelRequest {
    return { headers: origin ? { origin } : {} } as VercelRequest;
  }

  function resWithHeaders(): VercelResponse & { _headers: Record<string, string> } {
    const _headers: Record<string, string> = {};
    const r = {
      _headers,
      setHeader(name: string, value: string | number) {
        _headers[name] = String(value);
      },
    };
    return r as VercelResponse & { _headers: Record<string, string> };
  }

  it('uses wildcard when no allowlist is configured in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.FRONTEND_URL;
    delete process.env.ALLOWED_ORIGINS;

    const res = resWithHeaders();
    applyCors(req('https://example.com'), res);

    expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('reflects Origin when it matches FRONTEND_URL (non-production merges dev defaults)', () => {
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'https://app.example.com';
    delete process.env.ALLOWED_ORIGINS;

    const res = resWithHeaders();
    applyCors(req('https://app.example.com'), res);

    expect(res._headers['Access-Control-Allow-Origin']).toBe('https://app.example.com');
    expect(res._headers.Vary).toBe('Origin');
  });

  it('does not set Allow-Origin for a disallowed browser Origin', () => {
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_URL = 'https://app.example.com';
    delete process.env.ALLOWED_ORIGINS;

    const res = resWithHeaders();
    applyCors(req('https://malicious.example'), res);

    expect(res._headers['Access-Control-Allow-Origin']).toBeUndefined();
    expect(res._headers.Vary).toBe('Origin');
  });

  it('uses first allowed origin when Origin header is absent', () => {
    process.env.NODE_ENV = 'test';
    process.env.ALLOWED_ORIGINS = 'https://a.example.com,https://b.example.com';
    delete process.env.FRONTEND_URL;

    const res = resWithHeaders();
    applyCors(req(undefined), res);

    expect(res._headers['Access-Control-Allow-Origin']).toBe('https://a.example.com');
  });
});
