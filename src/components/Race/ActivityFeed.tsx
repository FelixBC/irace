import React from 'react';
import { motion } from 'framer-motion';
import { Activity as ActivityIcon, Clock, Heart, TrendingUp, Flame } from 'lucide-react';
import { Activity, User, Sport } from '../../types';
import { formatDistanceToNow } from 'date-fns';

// Utility function to format duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}h`;
  }
  return `${minutes}m`;
};

interface ActivityFeedProps {
  activities: Activity[];
  users: User[];
}

const sportConfig = {
  RUNNING: { icon: '🏃‍♂️', color: 'text-orange-600' },
  CYCLING: { icon: '🚴‍♂️', color: 'text-blue-600' },
  SWIMMING: { icon: '🏊‍♂️', color: 'text-teal-600' },
  WALKING: { icon: '🚶‍♂️', color: 'text-green-600' },
  HIKING: { icon: '🥾', color: 'text-brown-600' },
  WEIGHT_TRAINING: { icon: '💪', color: 'text-purple-600' },
  YOGA: { icon: '🧘‍♀️', color: 'text-indigo-600' },
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, users }) => {
  const recentActivities = activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const getUserById = (id: string) => users.find(user => user.id === id);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <ActivityIcon className="w-5 h-5 text-gray-600 mr-2" />
        Recent Activities
      </h3>

      <div className="space-y-4">
        {recentActivities.map((activity, index) => {
          const user = getUserById(activity.userId);
          if (!user) return null;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
                              <img
                  src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=40&background=random`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <span className="text-lg">
                    {sportConfig[activity.sport]?.icon || '🏃‍♂️'}
                  </span>
                </div>
                
                {/* Heart Rate */}
                {activity.heartRate && (
                  <div className="flex items-center text-xs text-red-600 mb-1">
                    <Heart className="w-3 h-3 mr-1" />
                    <span className="font-medium">
                      {activity.heartRate.average}-{activity.heartRate.max} bpm
                    </span>
                  </div>
                )}
                
                {/* Main Activity Info */}
                <p className="text-sm text-gray-600 mb-1">
                  <span className={`font-semibold ${sportConfig[activity.sport]?.color || 'text-gray-600'}`}>
                    {activity.sport === Sport.WEIGHT_TRAINING 
                      ? (activity.calories ? `${activity.calories} calories` : 'strength training') // Show calories if available, otherwise just "strength training"
                      : `${activity.distance.toFixed(1)}${activity.unit || 'km'}` // Show "8.2km" for distance sports
                    }
                  </span>{' '}
                  {activity.sport === Sport.RUNNING ? 'run' : 
                   activity.sport === Sport.CYCLING ? 'ride' : 
                   activity.sport === Sport.SWIMMING ? 'swim' :
                   activity.sport === Sport.WALKING ? 'walk' :
                   activity.sport === Sport.HIKING ? 'hike' :
                   activity.sport === Sport.WEIGHT_TRAINING ? '' : 'activity'} {/* Empty string for weight training since we already show "strength training" above */}
                </p>
                
                {/* Elevation */}
                {activity.elevation && (
                  <div className="flex items-center text-xs text-green-600 mb-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span className="font-medium">
                      +{activity.elevation.gain.toFixed(0)}m elevation
                    </span>
                  </div>
                )}
                
                {/* Duration and Time */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span className="font-medium">{formatDuration(activity.duration)}</span>
                  </div>
                  <span>{formatDistanceToNow(activity.date, { addSuffix: true })}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        {recentActivities.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No activities yet. Start exercising to see them here!
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ActivityFeed;