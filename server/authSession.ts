import type { PrismaClient } from '@prisma/client';

/** Minimal request shape for Bearer session resolution (Vercel / Connect). */
export type SessionAuthRequest = {
  headers?: { authorization?: string };
};

/**
 * Resolve logged-in user id from `Authorization: Bearer <sessionToken>`.
 */
export async function resolveBearerUserId(
  prisma: PrismaClient,
  req: SessionAuthRequest
): Promise<string | null> {
  const authHeader = req.headers?.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const sessionToken = authHeader.slice(7);
  const session = await prisma.session.findFirst({
    where: { sessionToken, expires: { gt: new Date() } },
    select: { userId: true },
  });
  return session?.userId ?? null;
}
