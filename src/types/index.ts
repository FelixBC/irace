export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  /** Strava athlete payload; shape varies by scope — narrow at call sites if needed. */
  athlete?: Record<string, unknown>;
}

export interface StravaActivity {
  id: number;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  manual: boolean;
  sport_type?: string;
  average_heartrate?: number;
  max_heartrate?: number;
  total_elevation_gain?: number;
  calories?: number;
  athlete?: {
    id: number;
  };
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  city: string;
  state: string;
  country: string;
  weight: number;
  email?: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  stravaId?: string;
  stravaTokens?: StravaTokens;
}

export interface Challenge {
  id: string;
  name: string;
  description?: string;
  sports: Sport[];
  challengeType: ChallengeType;
  goal: number;
  goalUnit: string;
  sportGoals: Record<Sport, number>; // Sport-specific goals
  duration: string;
  startDate: Date;
  endDate: Date;
  isPublic: boolean;
  inviteCode: string;
  maxParticipants: number;
  status: ChallengeStatus;
  creatorId: string;
  completedAt?: Date;
  participants?: ChallengeParticipant[];
  /** 0–100 for the current user on “My challenges” (distance vs challenge goal). */
  myProgress?: number;
  /** Finish rank (1 = winner). Present on completed challenges from the user list endpoint. */
  myFinishPosition?: number | null;
  myFinalDistance?: number | null;
  /** Present when listing challenges for the current user. */
  isCreator?: boolean;
}

export interface ChallengeParticipant {
  user: User;
  status?: ParticipationStatus;
  joinedAt?: Date;
  distance?: number;
  /** When set, per-sport km (or other units) for multi-sport challenges; preferred over aggregate `distance`. */
  progress?: Partial<Record<Sport, number>> | null;
  lastActivityDate?: Date;
  finishedAt?: Date;
  finishPosition?: number;
  finalDistance?: number;
}

export interface Participation {
  id: string;
  userId: string;
  challengeId: string;
  avatarId?: string;
  joinedAt: Date;
  status: ParticipationStatus;
  progress?: Record<string, unknown> | null;
  lastActivityDate?: Date;
  currentDistance: number;
  lastActivityAt?: Date;
}

export interface Activity {
  id: string;
  stravaActivityId: string;
  userId: string;
  challengeId?: string;
  sport: Sport;
  distance: number;
  duration: number;
  unit: string; // Unit of measurement (km, sets, minutes, etc.)
  date: Date;
  synced: boolean;
  heartRate?: {
    average: number;
    max: number;
  };
  elevation?: {
    gain: number; // meters
    loss: number; // meters
  };
  calories?: number;
}

export enum Sport {
  RUNNING = 'RUNNING',
  CYCLING = 'CYCLING',
  SWIMMING = 'SWIMMING',
  WALKING = 'WALKING',
  HIKING = 'HIKING',
  YOGA = 'YOGA',
  WEIGHT_TRAINING = 'WEIGHT_TRAINING'
}

export enum ChallengeType {
  DISTANCE = 'DISTANCE',
  TIME = 'TIME',
  FREQUENCY = 'FREQUENCY'
}

export enum ChallengeStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DRAFT = 'DRAFT'
}

export enum ParticipationStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  INVITED = 'INVITED'
}

export interface ParticipantProgress {
  user: User;
  distance: number;
  percentage: number;
  /** Per-day buckets for charts — structure defined by UI consumer. */
  dailyProgress: unknown[];
}

export interface RaceTrack {
  sport: Sport;
  participants: ParticipantProgress[];
  maxDistance: number;
  leader: User | null;
}

// ─── Profile page types ──────────────────────────────────────────────────────

export interface ProfileStreaks {
  current: number;
  longest: number;
  hoursUntilLost: number | null;
}

export interface ProfileWeeklyStats {
  distance: number;
  distanceLastWeek: number;
}

export interface ProfileWinRecord {
  wins: number;
  losses: number;
  rate: number;
}

export interface PersonalBest {
  longestActivityKm: number;
  /** Seconds per km for running. Null when no running activities exist. */
  fastestPaceSecPerKm: number | null;
  biggestElevationGainM: number;
}

export interface HeatmapCell {
  date: string;
  distance: number;
  count: number;
}

export interface LifetimeStats {
  totalDistanceKm: number;
  totalTimeSeconds: number;
  totalActivities: number;
  totalElevationM: number;
  sportBreakdown: Partial<Record<Sport, number>>;
}

export interface HeadToHeadRecord {
  userId: string;
  name: string;
  image: string | null;
  wins: number;
  losses: number;
}

export interface UserStats {
  memberSince: string | null;
  streaks: ProfileStreaks;
  weeklyStats: ProfileWeeklyStats;
  lifetimeStats: LifetimeStats;
  personalBests: PersonalBest;
  heatmap: HeatmapCell[];
  winRecord: ProfileWinRecord;
}