import { UserStats } from '../types';
import { USER_STATS } from '../config/api';
import { createLogger } from '../lib/logger';
import { ApiError, authFetch, parseJsonResponse } from '../lib/apiClient';
import { userStatsSchema } from '../schemas/apiResponses';

const log = createLogger('userStatsService');

export async function getUserStats(userId: string): Promise<UserStats> {
  const res = await authFetch(USER_STATS(userId));
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let detail = text.trim().slice(0, 200) || res.statusText;
    try {
      const body = JSON.parse(text) as { error?: string };
      if (typeof body?.error === 'string' && body.error.trim()) detail = body.error.trim();
    } catch {
      /* keep text snippet */
    }
    log.error('getUserStats failed', { status: res.status, detail });
    throw new ApiError(`Could not load profile stats (${res.status})`, res.status, detail);
  }
  return parseJsonResponse(res, userStatsSchema) as Promise<UserStats>;
}
