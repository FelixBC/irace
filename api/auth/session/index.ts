import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createLogger } from '../../../server/logger.js';

const log = createLogger('authSession');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Disable SSL verification for this request
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      
      // Use native pg client to avoid Prisma prepared statement issues
      const { Client } = await import('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false
      });
      
      await client.connect();
      log.debug('db connected');

      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No valid authorization header' });
      }

      const sessionToken = authHeader.substring(7);
      log.debug('session lookup');

      // Find session and include user data using raw SQL
      const sessionResult = await client.query(`
        SELECT 
          s."id", s."sessionToken", s."userId", s."expires",
          u."id" as user_id, u."name", u."email", u."image", 
          u."stravaId", u."stravaTokens"
        FROM "Session" s
        JOIN "User" u ON s."userId" = u."id"
        WHERE s."sessionToken" = $1
      `, [sessionToken]);

      if (sessionResult.rows.length === 0) {
        log.warn('session not found');
        await client.end();
        return res.status(401).json({ error: 'Session not found' });
      }

      const session = sessionResult.rows[0];
      log.debug('session ok', session.id);

      // Check if session is expired
      if (new Date(session.expires) < new Date()) {
        // Delete expired session using raw SQL
        await client.query('DELETE FROM "Session" WHERE "sessionToken" = $1', [sessionToken]);
        await client.end();
        return res.status(401).json({ error: 'Session expired' });
      }

      // Return user data
      res.status(200).json({
        user: {
          id: session.user_id,
          name: session.name,
          email: session.email,
          image: session.image,
          stravaId: session.stravaId,
          stravaTokens: session.stravaTokens
        },
        stravaTokens: session.stravaTokens
      });

      await client.end();
    } catch (error) {
      log.error('session validation error', error);

      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('connect')) {
        return res.status(500).json({ 
          error: 'Session validation failed',
          details: 'Database connection issue. Please try again.',
          fallback: true
        });
      }
      
      res.status(500).json({
        error: 'Session validation failed',
        details: message,
        fallback: true
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
