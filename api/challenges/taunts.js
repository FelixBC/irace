import { createFreshPrismaClient } from '../../server/prisma.js';
import { resolveBearerUserId } from '../../server/authSession.js';
import { createLogger } from '../../server/logger.js';

const log = createLogger('challenges/taunts');

const PRESET_TAUNTS = [
  { key: 'plateau', text: 'That plateau seems long.' },
  { key: 'pace', text: 'Pick up the pace.' },
  { key: 'breathing', text: 'Breathe. Then push.' },
  { key: 'still_running', text: 'Still running?' },
  { key: 'finish', text: 'Save it for the finish.' },
  { key: 'nice_try', text: 'Nice try. Not enough.' },
];

const PRESET_KEYS = new Set(PRESET_TAUNTS.map((t) => t.key));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const prisma = createFreshPrismaClient();
  try {
    const inviteCode = typeof req.query?.id === 'string' ? req.query.id : '';
    if (!inviteCode) {
      return res.status(400).json({ error: 'Missing challenge invite code' });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { inviteCode },
      select: { id: true },
    });
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (req.method === 'GET') {
      const limitRaw = typeof req.query?.limit === 'string' ? req.query.limit : '';
      const limit = Math.max(1, Math.min(50, Number(limitRaw || 20) || 20));

      const rows = await prisma.challengeTaunt.findMany({
        where: { challengeId: challenge.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          presetKey: true,
          createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      });

      return res.status(200).json({
        presets: PRESET_TAUNTS,
        taunts: rows.map((r) => ({
          id: r.id,
          presetKey: r.presetKey,
          text: PRESET_TAUNTS.find((p) => p.key === r.presetKey)?.text ?? r.presetKey,
          createdAt: r.createdAt,
          user: r.user,
        })),
      });
    }

    if (req.method === 'POST') {
      const userId = await resolveBearerUserId(prisma, req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const participation = await prisma.participation.findFirst({
        where: { challengeId: challenge.id, userId },
        select: { id: true },
      });
      if (!participation) {
        return res.status(403).json({ error: 'Only participants can send taunts in this challenge' });
      }

      const body = req.body || {};
      const presetKey = typeof body.presetKey === 'string' ? body.presetKey : '';
      if (!presetKey || !PRESET_KEYS.has(presetKey)) {
        return res.status(400).json({ error: 'Invalid presetKey' });
      }

      const created = await prisma.challengeTaunt.create({
        data: {
          challengeId: challenge.id,
          userId,
          presetKey,
        },
        select: {
          id: true,
          presetKey: true,
          createdAt: true,
          user: { select: { id: true, name: true, image: true } },
        },
      });

      return res.status(201).json({
        taunt: {
          id: created.id,
          presetKey: created.presetKey,
          text: PRESET_TAUNTS.find((p) => p.key === created.presetKey)?.text ?? created.presetKey,
          createdAt: created.createdAt,
          user: created.user,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    log.error('handler error', err);
    return res.status(500).json({ error: 'Server error' });
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

