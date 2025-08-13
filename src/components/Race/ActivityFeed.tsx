import React from 'react';
import { motion } from 'framer-motion';
import { Activity as ActivityIcon, Clock } from 'lucide-react';
import { Activity, User, Sport } from '../../types';
import { formatDistanceToNow } from 'date-fns';

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
                  src={user.image}
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
                <p className="text-sm text-gray-600 mb-1">
                  <span className={`font-semibold ${sportConfig[activity.sport]?.color || 'text-gray-600'}`}>
                    {activity.distance.toFixed(1)}km
                  </span>{' '}
                  {activity.sport === Sport.RUNNING ? 'run' : 
                   activity.sport === Sport.CYCLING ? 'ride' : 
                   activity.sport === Sport.SWIMMING ? 'swim' :
                   activity.sport === Sport.WALKING ? 'walk' :
                   activity.sport === Sport.HIKING ? 'hike' :
                   activity.sport === Sport.WEIGHT_TRAINING ? 'strength training' : 'activity'}
                </p>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(activity.date, { addSuffix: true })}
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