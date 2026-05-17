import { UserStats } from '../types';
import { USER_STATS } from '../config/api';
import { createLogger } from '../lib/logger';
import { authFetch, parseJsonResponse } from '../lib/apiClient';
import { userStatsSchema } from '../schemas/apiResponses';

const log = createLogger('userStatsService');

export async function getUserStats(userId: string): Promise<UserStats> {
  const res = await authFetch(USER_STATS(userId));
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    log.error('getUserStats failed', { status: res.status, text });
    throw new Error(`Failed to fetch user stats: ${res.status}`);
  }
  return parseJsonResponse(res, userStatsSchema) as Promise<UserStats>;
}
