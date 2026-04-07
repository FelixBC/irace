/**
 * Challenge lifecycle helpers implemented with SQL so they can be used from
 * both serverless pg-based routes and webhook processors.
 *
 * Rules:
 * - A challenge closes at endDate (status -> COMPLETED, completedAt set).
 * - Participants can finish before endDate; their finish position is locked.
 */

/**
 * Close a challenge if it's past endDate.
 * @param {import('pg').Client} client
 * @param {string} challengeId
 * @returns {Promise<boolean>} true if the challenge is now completed
 */
export async function closeChallengeIfEnded(client, challengeId) {
  const res = await client.query(
    `
    UPDATE "Challenge"
    SET "status" = 'COMPLETED', "completedAt" = NOW(), "updatedAt" = NOW()
    WHERE "id" = $1 AND "status" = 'ACTIVE' AND "endDate" <= NOW()
    RETURNING "id"
  `,
    [challengeId]
  );

  if (res.rows.length > 0) return true;

  const row = await client.query(`SELECT "status", "endDate" FROM "Challenge" WHERE "id" = $1`, [challengeId]);
  return row.rows[0]?.status === 'COMPLETED' || (row.rows[0]?.endDate ? new Date(row.rows[0].endDate) <= new Date() : false);
}

/**
 * If the participant has reached the challenge goal and has not yet finished,
 * assign the next finish position and mark participation completed.
 *
 * Runs in a transaction (caller should BEGIN/COMMIT).
 *
 * @param {import('pg').Client} client
 * @param {{ challengeId: string, userId: string }} params
 * @returns {Promise<{ finished: boolean, finishPosition?: number }>}
 */
export async function maybeMarkParticipantFinished(client, { challengeId, userId }) {
  // Lock the participation row so concurrent updates don't double-finish the same user.
  const pRes = await client.query(
    `
    SELECT "currentDistance", "finishPosition"
    FROM "Participation"
    WHERE "challengeId" = $1 AND "userId" = $2
    FOR UPDATE
  `,
    [challengeId, userId]
  );

  if (pRes.rows.length === 0) return { finished: false };
  const participation = pRes.rows[0];
  if (participation.finishPosition != null) return { finished: true, finishPosition: participation.finishPosition };

  const cRes = await client.query(
    `
    SELECT "goal", "status", "endDate"
    FROM "Challenge"
    WHERE "id" = $1
    FOR UPDATE
  `,
    [challengeId]
  );
  if (cRes.rows.length === 0) return { finished: false };
  const challenge = cRes.rows[0];

  // If the challenge is already over, we don't assign new finish positions.
  if (challenge.status !== 'ACTIVE' || new Date(challenge.endDate) <= new Date()) {
    return { finished: false };
  }

  const goal = Number(challenge.goal);
  const currentDistance = Number(participation.currentDistance);
  if (!Number.isFinite(goal) || !Number.isFinite(currentDistance) || currentDistance < goal) {
    return { finished: false };
  }

  const maxRes = await client.query(
    `SELECT COALESCE(MAX("finishPosition"), 0) AS max FROM "Participation" WHERE "challengeId" = $1`,
    [challengeId]
  );
  const nextPos = Number(maxRes.rows[0]?.max || 0) + 1;

  await client.query(
    `
    UPDATE "Participation"
    SET
      "status" = 'COMPLETED',
      "finishedAt" = NOW(),
      "finishPosition" = $1,
      "finalDistance" = "currentDistance",
      "updatedAt" = NOW()
    WHERE "challengeId" = $2 AND "userId" = $3 AND "finishPosition" IS NULL
  `,
    [nextPos, challengeId, userId]
  );

  return { finished: true, finishPosition: nextPos };
}

