import type { VercelRequest } from '@vercel/node';

export type ParsePostJsonResult<T extends Record<string, unknown>> =
  | { ok: true; data: T }
  | { ok: false; reason: 'invalid_json' | 'body_not_object' };

type LogWarn = (message: unknown, ...details: unknown[]) => void;

/**
 * Read JSON object from a Vercel handler `req.body` (may be pre-parsed object or a string).
 * Malformed JSON is a distinct outcome so callers can return 400 instead of conflating with "missing field".
 */
export function parseVercelPostJsonObject<T extends Record<string, unknown>>(
  req: VercelRequest,
  logContext: string,
  logWarn: LogWarn
): ParsePostJsonResult<T> {
  const raw = req.body;

  if (raw == null) {
    return { ok: true, data: {} as T };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return { ok: true, data: {} as T };
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        logWarn(`${logContext}: JSON body must be an object`);
        return { ok: false, reason: 'body_not_object' };
      }
      return { ok: true, data: parsed as T };
    } catch (e) {
      logWarn(`${logContext}: invalid JSON`, e);
      return { ok: false, reason: 'invalid_json' };
    }
  }

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return { ok: true, data: raw as T };
  }

  logWarn(`${logContext}: unexpected body type`, typeof raw);
  return { ok: false, reason: 'body_not_object' };
}
