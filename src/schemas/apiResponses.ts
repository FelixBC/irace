import { z } from 'zod';
import { ChallengeStatus, ChallengeType, Sport } from '../types';

/** Strava token blob from our API / OAuth (extra keys allowed). */
export const stravaTokensSchema = z
  .object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_at: z.number(),
    expires_in: z.number(),
  })
  .passthrough();

/** Normalize API nulls to omitted fields so outputs match our `User` type. */
export const userSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    email: z.string().nullish(),
    image: z.string().nullish(),
    stravaId: z.string().nullish(),
    stravaTokens: stravaTokensSchema.nullish(),
  })
  .passthrough()
  .transform((u) => ({
    ...u,
    name: u.name ?? undefined,
    email: u.email ?? undefined,
    image: u.image ?? undefined,
    stravaId: u.stravaId ?? undefined,
    stravaTokens: u.stravaTokens ?? undefined,
  }));

export const sessionResponseSchema = z.object({
  user: userSchema,
  stravaTokens: stravaTokensSchema.nullable().optional(),
});

export const stravaRefreshEnvelopeSchema = z.object({
  stravaTokens: stravaTokensSchema,
});

const sportSchema = z.nativeEnum(Sport);
const challengeTypeSchema = z.nativeEnum(ChallengeType);
const challengeStatusSchema = z.nativeEnum(ChallengeStatus);

export const challengeParticipantSchema = z
  .object({
    user: userSchema,
    distance: z.number().optional(),
    percentage: z.number().optional(),
    dailyProgress: z.array(z.unknown()).optional(),
    joinedAt: z.coerce.date().optional(),
    progress: z.record(z.string(), z.number()).nullable().optional(),
    lastActivityDate: z.coerce.date().nullable().optional(),
    finishedAt: z.coerce.date().nullable().optional(),
    finishPosition: z.number().nullable().optional(),
    finalDistance: z.number().nullable().optional(),
    status: z.string().optional(),
  })
  .passthrough();

/**
 * Challenge JSON from our API (dates as ISO strings; `participants` may be a count or full rows).
 */
export const challengeSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    sports: z.array(sportSchema),
    challengeType: challengeTypeSchema,
    goal: z.number(),
    goalUnit: z.string(),
    sportGoals: z.record(sportSchema, z.number()),
    duration: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isPublic: z.boolean(),
    inviteCode: z.string(),
    maxParticipants: z.number(),
    status: challengeStatusSchema,
    creatorId: z
      .string()
      .optional()
      .transform((c) => c ?? ''),
    completedAt: z.coerce.date().nullable().optional(),
    participants: z.union([z.array(challengeParticipantSchema), z.number()]).optional(),
    myProgress: z.number().optional(),
    isCreator: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  })
  .passthrough();

export const createChallengeResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    challengeId: z.string(),
    data: z.record(z.unknown()),
  })
  .transform(({ challengeId, data }) =>
    challengeSchema.parse({
      ...data,
      id: (data as { id?: string }).id ?? challengeId,
    })
  );

export const stravaSyncResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    syncedCount: z.number().optional(),
    totalDistance: z.number().optional(),
    activities: z.number().optional(),
    error: z.string().optional(),
  })
  .passthrough();

export const tauntUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
});

export const tauntsListResponseSchema = z.object({
  presets: z.array(
    z.object({
      key: z.string(),
      text: z.string(),
    })
  ),
  taunts: z.array(
    z.object({
      id: z.string(),
      presetKey: z.string(),
      text: z.string(),
      createdAt: z.string(),
      user: tauntUserSchema,
    })
  ),
});

export const sendTauntResponseSchema = z.object({
  taunt: z.any(),
});

export const apiErrorBodySchema = z.object({
  error: z.string().optional(),
});
