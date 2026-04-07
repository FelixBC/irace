import type { PrismaClient } from '@prisma/client';

type ChallengeDb = Pick<PrismaClient, 'challenge' | 'participation'>;

/**
 * Close a challenge if it's past endDate.
 * @returns true if the challenge is now completed (or was already closed / past end)
 */
export async function closeChallengeIfEnded(db: ChallengeDb, challengeId: string): Promise<boolean> {
  const result = await db.challenge.updateMany({
    where: {
      id: challengeId,
      status: 'ACTIVE',
      endDate: { lte: new Date() },
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  if (result.count > 0) return true;

  const ch = await db.challenge.findUnique({
    where: { id: challengeId },
    select: { status: true, endDate: true },
  });
  if (!ch) return false;
  return ch.status === 'COMPLETED' || (ch.endDate != null && ch.endDate <= new Date());
}

/**
 * If the participant has reached the challenge goal, assign the next finish position.
 * Call inside `prisma.$transaction` when you need atomicity with other updates.
 */
export async function maybeMarkParticipantFinished(
  db: ChallengeDb,
  { challengeId, userId }: { challengeId: string; userId: string }
): Promise<{ finished: boolean; finishPosition?: number }> {
  const participation = await db.participation.findUnique({
    where: { userId_challengeId: { userId, challengeId } },
    select: { currentDistance: true, finishPosition: true },
  });

  if (!participation) return { finished: false };
  if (participation.finishPosition != null) {
    return { finished: true, finishPosition: participation.finishPosition };
  }

  const challenge = await db.challenge.findUnique({
    where: { id: challengeId },
    select: { goal: true, status: true, endDate: true },
  });
  if (!challenge) return { finished: false };

  if (challenge.status !== 'ACTIVE' || challenge.endDate <= new Date()) {
    return { finished: false };
  }

  const goal = Number(challenge.goal);
  const currentDistance = Number(participation.currentDistance);
  if (!Number.isFinite(goal) || !Number.isFinite(currentDistance) || currentDistance < goal) {
    return { finished: false };
  }

  const agg = await db.participation.aggregate({
    where: { challengeId },
    _max: { finishPosition: true },
  });
  const nextPos = (agg._max.finishPosition ?? 0) + 1;

  const updated = await db.participation.updateMany({
    where: {
      challengeId,
      userId,
      finishPosition: null,
    },
    data: {
      status: 'COMPLETED',
      finishedAt: new Date(),
      finishPosition: nextPos,
      finalDistance: participation.currentDistance,
    },
  });

  if (updated.count === 0) return { finished: false };
  return { finished: true, finishPosition: nextPos };
}
