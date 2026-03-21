import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const activityKey = useMemo(() => activities.map((a) => a.id).join(','), [activities]);
  useEffect(() => {
    setCurrentIndex(0);
  }, [activityKey]);

  // Sort activities by date and group by user
  const sortedActivities = activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group activities by user to ensure fair distribution
  const activitiesByUser = sortedActivities.reduce((acc, activity) => {
    if (!acc[activity.userId]) {
      acc[activity.userId] = [];
    }
    acc[activity.userId].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  // Create a fair distribution of activities (max 3-4 per user if many participants)
  const maxPerUser = Math.max(1, Math.floor(4 / Object.keys(activitiesByUser).length));
  const fairActivities: Activity[] = [];
  
  Object.values(activitiesByUser).forEach(userActivities => {
    fairActivities.push(...userActivities.slice(0, maxPerUser));
  });

  // Sort again to maintain chronological order
  const displayActivities = fairActivities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10); // Show max 10 activities

  const getUserById = (id: string) => users.find(user => user.id === id);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (!isAutoRotating || displayActivities.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayActivities.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoRotating, displayActivities.length]);

  // Get current batch of activities to display (3-4 at a time)
  const getCurrentBatch = () => {
    if (displayActivities.length <= 3) {
      return displayActivities;
    }
    
    const batchSize = 3;
    const startIndex = currentIndex;
    const endIndex = Math.min(startIndex + batchSize, displayActivities.length);
    
    if (endIndex <= displayActivities.length) {
      return displayActivities.slice(startIndex, endIndex);
    } else {
      // Handle wrap-around
      const firstPart = displayActivities.slice(startIndex);
      const secondPart = displayActivities.slice(0, batchSize - firstPart.length);
      return [...firstPart, ...secondPart];
    }
  };

  const currentBatch = getCurrentBatch();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      onMouseEnter={() => setIsAutoRotating(false)}
      onMouseLeave={() => setIsAutoRotating(true)}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <ActivityIcon className="w-5 h-5 text-gray-600 mr-2" />
          Recent Activities
        </h3>
        {displayActivities.length > 3 && (
          <div className="flex space-x-1">
            {Array.from({ length: Math.ceil(displayActivities.length / 3) }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(currentIndex / 3) === index ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="space-y-4"
          >
            {currentBatch.map((activity, index) => {
              const user = getUserById(activity.userId);
              if (!user) return null;

              return (
                <motion.div
                  key={`${activity.id}-${currentIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={
                      user.image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=80&background=f97316&color=fff`
                    }
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
                          ? (activity.calories ? `${activity.calories} calories` : 'strength training')
                          : `${activity.distance.toFixed(1)}${activity.unit || 'km'}`
                        }
                      </span>{' '}
                      {activity.sport === Sport.RUNNING ? 'run' : 
                       activity.sport === Sport.CYCLING ? 'ride' : 
                       activity.sport === Sport.SWIMMING ? 'swim' :
                       activity.sport === Sport.WALKING ? 'walk' :
                       activity.sport === Sport.HIKING ? 'hike' :
                       activity.sport === Sport.WEIGHT_TRAINING ? '' : 'activity'}
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
          </motion.div>
        </AnimatePresence>

        {displayActivities.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No activities yet. Start exercising to see them here!
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ActivityFeed;