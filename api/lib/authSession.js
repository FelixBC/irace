/**
 * Resolve logged-in user id from `Authorization: Bearer <sessionToken>`.
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ headers?: { authorization?: string } }} req
 * @returns {Promise<string | null>}
 */
export async function resolveBearerUserId(prisma, req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const sessionToken = authHeader.slice(7);
  const session = await prisma.session.findFirst({
    where: { sessionToken, expires: { gt: new Date() } },
    select: { userId: true },
  });
  return session?.userId ?? null;
}
