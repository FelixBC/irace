import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogger } from '../../../server/logger.js';
import { createFreshPrismaClient } from '../../../server/prisma.js';
import { applyOptionalInsecureTlsFromEnv } from '../../../server/optionalInsecureTls.js';
import { getQueryString } from '../../../server/vercelQuery.js';
import { resolveBearerUserId } from '../../../server/authSession.js';
import { sendJsonError } from '../../../server/apiHelpers.js';
import { applyCors } from '../../../server/cors.js';

const log = createLogger('users/stats');

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function computeStreaks(days: Set<string>): { current: number; longest: number } {
  if (days.size === 0) return { current: 0, longest: 0 };
  const sorted = [...days].sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00Z');
    const curr = new Date(sorted[i] + 'T00:00:00Z');
    if (Math.round((curr.getTime() - prev.getTime()) / 86_400_000) === 1) {
      if (++run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak: walk back from today (or yesterday if today has no activity)
  const todayStr = dateKey(new Date());
  const yesterStr = dateKey(new Date(Date.now() - 86_400_000));
  const startStr = days.has(todayStr) ? todayStr : days.has(yesterStr) ? yesterStr : null;

  let current = 0;
  if (startStr) {
    let d = new Date(startStr + 'T00:00:00Z');
    while (days.has(dateKey(d))) {
      current++;
      d = new Date(d.getTime() - 86_400_000);
    }
  }

  return { current, longest };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyOptionalInsecureTlsFromEnv();
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return sendJsonError(res, 405, 'Method not allowed');

  const userId = getQueryString(req, 'userId');
  if (!userId) return sendJsonError(res, 400, 'userId is required');

  const prisma = createFreshPrismaClient();

  try {
    const sessionUserId = await resolveBearerUserId(prisma, req);
    if (!sessionUserId) return sendJsonError(res, 401, 'Unauthorized');
    if (sessionUserId !== userId) return sendJsonError(res, 403, 'Forbidden');

    const [user, activities, participations] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
      prisma.activity.findMany({
        where: { userId },
        select: { date: true, distance: true, duration: true, sport: true },
        orderBy: { date: 'asc' },
      }),
      prisma.participation.findMany({
        where: { userId, status: 'COMPLETED' },
        select: { finishPosition: true },
      }),
    ]);

    // Streaks
    const daySet = new Set(activities.map(a => dateKey(a.date)));
    const { current, longest } = computeStreaks(daySet);

    // Weekly stats (Mon–Sun UTC)
    const now = new Date();
    const dow = now.getUTCDay();
    const daysFromMon = dow === 0 ? 6 : dow - 1;
    const thisMonday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMon)
    );
    const lastMonday = new Date(thisMonday.getTime() - 7 * 86_400_000);
    const lastSundayEnd = new Date(thisMonday.getTime() - 1);

    let weekDist = 0;
    let lastWeekDist = 0;
    for (const a of activities) {
      if (a.date >= thisMonday) weekDist += a.distance;
      else if (a.date >= lastMonday && a.date <= lastSundayEnd) lastWeekDist += a.distance;
    }

    // Lifetime stats
    const totalDistanceKm = activities.reduce((s, a) => s + a.distance, 0);
    const totalTimeSeconds = activities.reduce((s, a) => s + a.duration, 0);
    const sportBreakdown: Record<string, number> = {};
    for (const a of activities) {
      sportBreakdown[a.sport] = (sportBreakdown[a.sport] ?? 0) + a.distance;
    }

    // Personal bests (no elevation in schema — omitted)
    const longestActivityKm = activities.reduce((m, a) => Math.max(m, a.distance), 0);
    const runActivities = activities.filter(
      a => a.sport === 'RUNNING' && a.distance > 0.1 && a.duration > 0
    );
    const fastestPaceSecPerKm =
      runActivities.length > 0
        ? Math.min(...runActivities.map(a => a.duration / a.distance))
        : null;

    // Heatmap — last 365 days
    const cutoff = new Date(Date.now() - 365 * 86_400_000);
    const byDay = new Map<string, { distance: number; count: number }>();
    for (const a of activities) {
      if (a.date < cutoff) continue;
      const key = dateKey(a.date);
      const prev = byDay.get(key) ?? { distance: 0, count: 0 };
      byDay.set(key, { distance: prev.distance + a.distance, count: prev.count + 1 });
    }
    const heatmap = [...byDay.entries()].map(([date, d]) => ({ date, ...d }));

    // Win record
    const wins = participations.filter(p => p.finishPosition === 1).length;
    const totalRaced = participations.length;
    const losses = totalRaced - wins;
    const rate = totalRaced > 0 ? Math.round((wins / totalRaced) * 100) : 0;

    return res.status(200).json({
      memberSince: user?.createdAt?.toISOString() ?? null,
      streaks: { current, longest, hoursUntilLost: null },
      weeklyStats: { distance: weekDist, distanceLastWeek: lastWeekDist },
      lifetimeStats: {
        totalDistanceKm,
        totalTimeSeconds,
        totalActivities: activities.length,
        totalElevationM: 0,
        sportBreakdown,
      },
      personalBests: { longestActivityKm, fastestPaceSecPerKm },
      heatmap,
      winRecord: { wins, losses, rate },
    });
  } catch (error) {
    log.error('stats fetch failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return sendJsonError(res, 500, 'Failed to fetch stats', message);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
