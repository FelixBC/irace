import type { VercelResponse } from '@vercel/node';

/** Consistent JSON error body for API routes (`{ error: string }`, optional `details`). */
export function sendJsonError(
  res: VercelResponse,
  status: number,
  message: string,
  details?: unknown
): VercelResponse {
  const body: { error: string; details?: unknown } = { error: message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}
