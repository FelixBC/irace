export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete?: any;
}

export interface StravaActivity {
  id: number;
  type: string;
  distance: number;
  moving_time: number;
  start_date: string;
  manual: boolean;
  sport_type?: string;
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
}

export interface Participation {
  id: string;
  userId: string;
  challengeId: string;
  avatarId?: string;
  joinedAt: Date;
  status: ParticipationStatus;
  progress?: any;
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
  dailyProgress: any[];
}

export interface RaceTrack {
  sport: Sport;
  participants: ParticipantProgress[];
  maxDistance: number;
  leader: User | null;
}