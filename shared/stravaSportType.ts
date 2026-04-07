/**
 * Strava activity `type` / `sport_type` strings → Prisma `Sport` enum values (string form).
 * No `@prisma/client` import here — this module is shared with the browser bundle.
 */
export const STRAVA_ACTIVITY_TYPE_TO_SPORT = Object.freeze({
  Run: 'RUNNING',
  Ride: 'CYCLING',
  Swim: 'SWIMMING',
  Walk: 'WALKING',
  Hike: 'HIKING',
  Yoga: 'YOGA',
  WeightTraining: 'WEIGHT_TRAINING',
  VirtualRide: 'CYCLING',
  EBikeRide: 'CYCLING',
} as const);

export type MappedStravaSport = (typeof STRAVA_ACTIVITY_TYPE_TO_SPORT)[keyof typeof STRAVA_ACTIVITY_TYPE_TO_SPORT];

/** Primary endurance modes for client-side `isActivityRelevant` filtering. */
export const STRAVA_ACTIVITY_TYPES_CLIENT_PRIMARY = Object.freeze([
  'Run',
  'Ride',
  'Swim',
  'VirtualRide',
  'EBikeRide',
]);

export function mapStravaActivityTypeToSport(stravaType: string | null | undefined): MappedStravaSport {
  if (stravaType == null || stravaType === '') return 'RUNNING';
  const v = STRAVA_ACTIVITY_TYPE_TO_SPORT[stravaType as keyof typeof STRAVA_ACTIVITY_TYPE_TO_SPORT];
  return v ?? 'RUNNING';
}
