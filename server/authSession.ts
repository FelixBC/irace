import type { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from './authTokens.js';

/** Minimal request shape for Bearer session resolution (Vercel / Connect). */
export type SessionAuthRequest = {
  headers?: { authorization?: string };
};

/**
 * Resolve logged-in user id from `Authorization: Bearer <access JWT>`.
 * Requires a valid access token and a session row whose refresh window has not ended.
 */
export async function resolveBearerUserId(
  prisma: PrismaClient,
  req: SessionAuthRequest
): Promise<string | null> {
  const authHeader = req.headers?.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const claims = verifyAccessToken(token);
  if (!claims) return null;

  const session = await prisma.session.findUnique({
    where: { id: claims.sessionId },
    select: { userId: true, refreshExpiresAt: true },
  });
  if (!session || session.refreshExpiresAt <= new Date()) return null;
  return session.userId;
}
