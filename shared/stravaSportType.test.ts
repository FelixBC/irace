import { describe, it, expect } from 'vitest';
import {
  mapStravaActivityTypeToSport,
  STRAVA_ACTIVITY_TYPE_TO_SPORT,
  STRAVA_ACTIVITY_TYPES_CLIENT_PRIMARY,
} from './stravaSportType.js';

describe('mapStravaActivityTypeToSport', () => {
  it('maps Strava types to Sport enum names', () => {
    expect(mapStravaActivityTypeToSport('Run')).toBe('RUNNING');
    expect(mapStravaActivityTypeToSport('Ride')).toBe('CYCLING');
    expect(mapStravaActivityTypeToSport('VirtualRide')).toBe('CYCLING');
    expect(mapStravaActivityTypeToSport('WeightTraining')).toBe('WEIGHT_TRAINING');
  });

  it('defaults unknown or empty to RUNNING', () => {
    expect(mapStravaActivityTypeToSport('Kitesurf')).toBe('RUNNING');
    expect(mapStravaActivityTypeToSport('')).toBe('RUNNING');
    expect(mapStravaActivityTypeToSport(undefined)).toBe('RUNNING');
    expect(mapStravaActivityTypeToSport(null)).toBe('RUNNING');
  });
});

describe('STRAVA_ACTIVITY_TYPE_TO_SPORT', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(STRAVA_ACTIVITY_TYPE_TO_SPORT)).toBe(true);
  });
});

describe('STRAVA_ACTIVITY_TYPES_CLIENT_PRIMARY', () => {
  it('includes Run, Ride, Swim variants', () => {
    expect(STRAVA_ACTIVITY_TYPES_CLIENT_PRIMARY).toContain('Run');
    expect(STRAVA_ACTIVITY_TYPES_CLIENT_PRIMARY).toContain('VirtualRide');
  });
});
