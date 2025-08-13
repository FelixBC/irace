import { Challenge, Activity, Sport, User, ChallengeType, ChallengeStatus } from '../types';
import { addDays, subDays } from 'date-fns';

export const mockUsers: User[] = [
  {
    id: '1',
    stravaId: 'strava_1',
    name: 'Alex Chen',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    email: 'alex@example.com',
  },
  {
    id: '2',
    stravaId: 'strava_2',
    name: 'Sarah Johnson',
    image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    email: 'sarah@example.com',
  },
  {
    id: '3',
    stravaId: 'strava_3',
    name: 'Mike Rodriguez',
    image: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    email: 'mike@example.com',
  },
  {
    id: '4',
    stravaId: 'strava_4',
    name: 'Emma Wilson',
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    email: 'emma@example.com',
  },
];

export const mockChallenge: Challenge = {
  id: 'demo-challenge',
  name: 'Winter Fitness Challenge 2025',
  description: 'A winter fitness challenge with multiple sports',
  sports: [Sport.RUNNING, Sport.CYCLING, Sport.SWIMMING, Sport.WALKING, Sport.HIKING, Sport.WEIGHT_TRAINING],
  challengeType: ChallengeType.DISTANCE,
  goal: 100,
  goalUnit: 'km',
  sportGoals: {
    [Sport.RUNNING]: 42, // Marathon distance
    [Sport.CYCLING]: 150, // Century ride
    [Sport.SWIMMING]: 10, // 10km swim
    [Sport.WALKING]: 50, // 50km walk
    [Sport.HIKING]: 30, // 30km hike
    [Sport.WEIGHT_TRAINING]: 20, // 20 sessions
  },
  duration: '7 days',
  startDate: subDays(new Date(), 3),
  endDate: addDays(new Date(), 4),
  isPublic: true,
  inviteCode: 'WF2025',
  maxParticipants: 10,
  status: ChallengeStatus.ACTIVE,
  creatorId: '1',
};

export const mockActivities: Activity[] = [
  // Alex Chen activities
  { id: '1', userId: '1', challengeId: 'demo-challenge', sport: Sport.RUNNING, distance: 8.2, duration: 45, unit: 'km', date: subDays(new Date(), 3), stravaActivityId: 'act_1' },
  { id: '2', userId: '1', challengeId: 'demo-challenge', sport: Sport.RUNNING, distance: 5.5, duration: 32, unit: 'km', date: subDays(new Date(), 2), stravaActivityId: 'act_2' },
  { id: '3', userId: '1', challengeId: 'demo-challenge', sport: Sport.CYCLING, distance: 25.3, duration: 78, unit: 'km', date: subDays(new Date(), 1), stravaActivityId: 'act_3' },
  { id: '4', userId: '1', challengeId: 'demo-challenge', sport: Sport.RUNNING, distance: 10.1, duration: 58, unit: 'km', date: new Date(), stravaActivityId: 'act_4' },

  // Sarah Johnson activities
  { id: '5', userId: '2', challengeId: 'demo-challenge', sport: Sport.RUNNING, distance: 12.4, duration: 67, unit: 'km', date: subDays(new Date(), 3), stravaActivityId: 'act_5' },
  { id: '6', userId: '2', challengeId: 'demo-challenge', sport: Sport.SWIMMING, distance: 1.2, duration: 28, unit: 'km', date: subDays(new Date(), 2), stravaActivityId: 'act_6' },
  { id: '7', userId: '2', challengeId: 'demo-challenge', sport: Sport.RUNNING, distance: 7.8, duration: 42, unit: 'km', date: subDays(new Date(), 1), stravaActivityId: 'act_7' },
  { id: '8', userId: '2', challengeId: 'demo-challenge', sport: Sport.CYCLING, distance: 18.5, duration: 56, unit: 'km', date: new Date(), stravaActivityId: 'act_8' },

  // Mike Rodriguez activities
  { id: '9', userId: '3', challengeId: 'demo-challenge', sport: Sport.CYCLING, distance: 32.1, duration: 95, unit: 'km', date: subDays(new Date(), 3), stravaActivityId: 'act_9' },
  { id: '10', userId: '3', challengeId: 'demo-challenge', sport: Sport.RUNNING, distance: 6.2, duration: 35, unit: 'km', date: subDays(new Date(), 2), stravaActivityId: 'act_10' },
  { id: '11', userId: '3', challengeId: 'demo-challenge', sport: Sport.CYCLING, distance: 28.7, duration: 87, unit: 'km', date: subDays(new Date(), 1), stravaActivityId: 'act_11' },
  { id: '12', userId: '3', challengeId: 'demo-challenge', sport: Sport.SWIMMING, distance: 2.1, duration: 45, unit: 'km', date: new Date(), stravaActivityId: 'act_12' },

  // Emma Wilson activities
  { id: '13', userId: '4', challengeId: 'demo-challenge', sport: Sport.SWIMMING, distance: 1.8, duration: 38, unit: 'km', date: subDays(new Date(), 3), stravaActivityId: 'act_13' },
  { id: '14', userId: '4', challengeId: 'demo-challenge', sport: Sport.RUNNING, distance: 9.3, duration: 51, unit: 'km', date: subDays(new Date(), 2), stravaActivityId: 'act_14' },
  { id: '15', userId: '4', challengeId: 'demo-challenge', sport: Sport.SWIMMING, distance: 1.5, duration: 32, unit: 'km', date: subDays(new Date(), 1), stravaActivityId: 'act_15' },
  { id: '16', userId: '4', challengeId: 'demo-challenge', sport: Sport.RUNNING, distance: 11.2, duration: 61, unit: 'km', date: new Date(), stravaActivityId: 'act_16' },

  // Additional activities for new sports
  { id: '17', userId: '1', challengeId: 'demo-challenge', sport: Sport.WALKING, distance: 3.2, duration: 42, unit: 'km', date: subDays(new Date(), 2), stravaActivityId: 'act_17' },
  { id: '18', userId: '2', challengeId: 'demo-challenge', sport: Sport.HIKING, distance: 8.5, duration: 156, unit: 'km', date: subDays(new Date(), 1), stravaActivityId: 'act_18' },
  { id: '19', userId: '3', challengeId: 'demo-challenge', sport: Sport.WEIGHT_TRAINING, distance: 12, duration: 45, unit: 'sets', date: subDays(new Date(), 1), stravaActivityId: 'act_19' },
  { id: '20', userId: '4', challengeId: 'demo-challenge', sport: Sport.WALKING, distance: 2.8, duration: 38, unit: 'km', date: new Date(), stravaActivityId: 'act_20' },
];

export const generateShareCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};