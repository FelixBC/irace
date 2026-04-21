import { StravaService } from './stravaService';
import { StravaTokens, User, Activity, Sport } from '../types';
import { createLogger } from '../lib/logger';

const log = createLogger('stravaData');

export interface RealTimeStravaData {
  user: User;
  activities: Activity[];
  lastSync: Date;
}

export class StravaDataService {
  private stravaService: StravaService;

  constructor(tokens: StravaTokens) {
    this.stravaService = new StravaService(tokens);
  }

  async getUserProfile(): Promise<User> {
    const athlete = await this.stravaService.getAthlete();
    
    return {
      id: athlete.id.toString(),
      name: `${athlete.firstname} ${athlete.lastname}`,
      email: athlete.email || undefined,
      image: athlete.profile,
      stravaId: athlete.id.toString(),
    };
  }

  async getRecentActivities(days: number = 2): Promise<Activity[]> {
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - days);
    
    log.debug('fetch activities since', afterDate.toISOString(), `days=${days}`);

    const stravaActivities = await this.stravaService.getActivitiesAfterDate(afterDate);

    log.debug('activities returned', stravaActivities.length);
    
    return stravaActivities.map(stravaActivity => ({
      id: stravaActivity.id.toString(),
      stravaActivityId: stravaActivity.id.toString(),
      userId: stravaActivity.athlete?.id?.toString() || 'unknown',
      challengeId: undefined, // Will be set when added to a challenge
      sport: this.mapStravaTypeToSport(stravaActivity.type),
      distance: stravaActivity.distance / 1000, // Convert meters to kilometers
      duration: stravaActivity.moving_time,
      unit: this.getUnitForSport(this.mapStravaTypeToSport(stravaActivity.type)),
      date: new Date(stravaActivity.start_date),
      synced: true,
      heartRate: stravaActivity.average_heartrate && stravaActivity.max_heartrate ? {
        average: stravaActivity.average_heartrate,
        max: stravaActivity.max_heartrate
      } : undefined,
      elevation: stravaActivity.total_elevation_gain ? {
        gain: stravaActivity.total_elevation_gain,
        loss: stravaActivity.total_elevation_gain * 0.8 // Approximate loss as 80% of gain
      } : undefined,
      calories: stravaActivity.calories || undefined,
    }));
  }

  async getActivitiesForChallenge(challengeId: string, startDate: Date, endDate: Date): Promise<Activity[]> {
    // Only get activities from the last 2 days, regardless of challenge dates
    const activities = await this.getRecentActivities(2);
    
    log.debug('filter activities for challenge', challengeId, activities.length);

    return activities.filter((activity) => {
      const activityDate = new Date(activity.date);
      const isInChallengePeriod = activityDate >= startDate && activityDate <= endDate;
      const isRecent = activityDate >= new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      return isInChallengePeriod && isRecent;
    });
  }

  private mapStravaTypeToSport(stravaType: string): Sport {
    const type = stravaType.toLowerCase();
    
    if (type.includes('run') || type.includes('trail')) {
      return Sport.RUNNING;
    } else if (type.includes('ride') || type.includes('cycle') || type.includes('bike')) {
      return Sport.CYCLING;
    } else if (type.includes('swim')) {
      return Sport.SWIMMING;
    } else if (type.includes('walk')) {
      return Sport.WALKING;
    } else if (type.includes('hike')) {
      return Sport.HIKING;
    } else if (type.includes('weight') || type.includes('strength') || type.includes('gym')) {
      return Sport.WEIGHT_TRAINING;
    } else {
      return Sport.RUNNING; // Default fallback
    }
  }

  private getUnitForSport(sport: Sport): string {
    switch (sport) {
      case Sport.RUNNING:
      case Sport.CYCLING:
      case Sport.WALKING:
      case Sport.HIKING:
        return 'km';
      case Sport.SWIMMING:
        return 'm';
      case Sport.WEIGHT_TRAINING:
        return 'min';
      case Sport.YOGA:
        return 'min';
      default:
        return 'km';
    }
  }

  async refreshUserData(): Promise<RealTimeStravaData> {
    const [user, activities] = await Promise.all([
      this.getUserProfile(),
      this.getRecentActivities(2) // Only last 2 days
    ]);

    return {
      user,
      activities,
      lastSync: new Date()
    };
  }
}

// Utility function to create the service from tokens
export function createStravaDataService(tokens: StravaTokens): StravaDataService {
  return new StravaDataService(tokens);
}
