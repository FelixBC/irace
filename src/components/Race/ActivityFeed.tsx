import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity as ActivityIcon, Clock, Heart, TrendingUp, ExternalLink } from 'lucide-react';
import { Activity, User, Sport } from '../../types';
import { formatDistanceToNow } from 'date-fns';

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}h`;
  return `${minutes}m`;
};

interface ActivityFeedProps {
  activities: Activity[];
  user: User | null;
}

const sportConfig: Record<string, { icon: string; color: string }> = {
  RUNNING: { icon: '🏃', color: 'text-orange-600 dark:text-orange-400' },
  CYCLING: { icon: '🚴', color: 'text-blue-600 dark:text-blue-400' },
  SWIMMING: { icon: '🏊', color: 'text-teal-600 dark:text-teal-400' },
  WALKING: { icon: '🚶', color: 'text-green-600 dark:text-green-400' },
  HIKING: { icon: '🥾', color: 'text-amber-600 dark:text-amber-400' },
  WEIGHT_TRAINING: { icon: '💪', color: 'text-purple-600 dark:text-purple-400' },
  YOGA: { icon: '🧘', color: 'text-indigo-600 dark:text-indigo-400' },
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, user }) => {
  const displayActivities = useMemo(
    () =>
      [...activities]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [activities],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
        <ActivityIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
        My Recent Activities
      </h3>

      {displayActivities.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
          {user
            ? 'No recent activities. Start exercising to see them here!'
            : 'Connect Strava to see your activities.'}
        </p>
      ) : (
        <div className="space-y-4">
          {displayActivities.map((activity, index) => {
            const config = sportConfig[activity.sport];
            const stravaLink =
              activity.stravaActivityId && activity.stravaActivityId !== '0'
                ? `https://www.strava.com/activities/${activity.stravaActivityId}`
                : null;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {user && (
                  <img
                    src={
                      user.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=80&background=2563EB&color=fff`
                    }
                    alt={user.name || 'User'}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg" aria-hidden="true">
                      {config?.icon || '🏃'}
                    </span>
                    <p className={`text-sm font-semibold ${config?.color || 'text-gray-600'}`}>
                      {activity.sport === Sport.WEIGHT_TRAINING
                        ? activity.calories
                          ? `${activity.calories} cal`
                          : 'Strength training'
                        : `${activity.distance.toFixed(1)} ${activity.unit || 'km'}`}
                    </p>
                  </div>

                  {activity.heartRate && (
                    <div className="flex items-center text-xs text-red-600 dark:text-red-400 mb-1">
                      <Heart className="w-3 h-3 mr-1" />
                      <span>
                        {activity.heartRate.average}–{activity.heartRate.max} bpm
                      </span>
                    </div>
                  )}

                  {activity.elevation && (
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400 mb-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span>+{activity.elevation.gain.toFixed(0)} m</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{formatDuration(activity.duration)}</span>
                    </div>
                    <span>{formatDistanceToNow(new Date(activity.date), { addSuffix: true })}</span>
                  </div>

                  {/* R4: "View on Strava" exact text, Strava orange, bold — only for real activities */}
                  {stravaLink && (
                    <a
                      href={stravaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-bold underline mt-1 text-strava-orange"
                    >
                      View on Strava
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ActivityFeed;
