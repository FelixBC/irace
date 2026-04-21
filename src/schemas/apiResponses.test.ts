import { describe, it, expect } from 'vitest';
import {
  sessionResponseSchema,
  challengeSchema,
  createChallengeResponseSchema,
} from './apiResponses.js';

describe('apiResponses schemas', () => {
  it('parses session envelope', () => {
    const out = sessionResponseSchema.parse({
      user: { id: 'user_1', name: 'Test', email: 't@example.com', image: null, stravaId: '99' },
      stravaTokens: {
        access_token: 'a',
        refresh_token: 'r',
        expires_at: 1700000000,
        expires_in: 3600,
      },
    });
    expect(out.user.id).toBe('user_1');
    expect(out.stravaTokens?.access_token).toBe('a');
  });

  it('parses challenge with ISO dates', () => {
    const out = challengeSchema.parse({
      id: 'c1',
      name: 'Run',
      sports: ['RUNNING'],
      challengeType: 'DISTANCE',
      goal: 10,
      goalUnit: 'km',
      sportGoals: { RUNNING: 10 },
      duration: '7 days',
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-08T00:00:00.000Z',
      isPublic: true,
      inviteCode: 'ABC123',
      maxParticipants: 10,
      status: 'ACTIVE',
      creatorId: 'user_1',
    });
    expect(out.startDate).toBeInstanceOf(Date);
    expect(out.id).toBe('c1');
  });

  it('parses create-challenge API envelope into challenge', () => {
    const out = createChallengeResponseSchema.parse({
      success: true,
      message: 'ok',
      challengeId: 'challenge_123',
      data: {
        name: 'Test',
        sports: ['RUNNING'],
        challengeType: 'DISTANCE',
        goal: 10,
        goalUnit: 'km',
        sportGoals: { RUNNING: 10 },
        duration: '7 days',
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-08T00:00:00.000Z',
        isPublic: true,
        inviteCode: 'XYZ',
        maxParticipants: 10,
        status: 'ACTIVE',
      },
    });
    expect(out.id).toBe('challenge_123');
    expect(out.inviteCode).toBe('XYZ');
  });
});
