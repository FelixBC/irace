import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Activity } from 'lucide-react';
import { RaceTrack as RaceTrackType, Sport } from '../../types';

interface RaceTrackProps {
  track: RaceTrackType;
  timeRemaining: string;
}

const sportConfig = {
  RUNNING: {
    icon: '🏃‍♂️',
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
  },
  CYCLING: {
    icon: '🚴‍♂️',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  SWIMMING: {
    icon: '🏊‍♂️',
    color: 'from-teal-400 to-cyan-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
  },
  WALKING: {
    icon: '🚶‍♂️',
    color: 'from-green-400 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
  HIKING: {
    icon: '🥾',
    color: 'from-amber-400 to-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  WEIGHT_TRAINING: {
    icon: '💪',
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
  },
};

const RaceTrack: React.FC<RaceTrackProps> = ({ track, timeRemaining }) => {
  const config = sportConfig[track.sport];
  const trackWidth = 100; // percentage

  return (
    <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-6 mb-6`}>
      {/* Track Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`text-lg font-semibold ${config.textColor} capitalize`}>
              {track.sport}
            </h3>
            <p className="text-sm text-gray-500">
              {track.participants.length} participants
            </p>
            {/* Progress vs Goal */}
            {track.participants.length === 1 && track.participants[0] && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">
                  Progress: {track.participants[0].distance.toFixed(1)}km / {track.maxDistance.toFixed(1)}km
                </span>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${track.participants[0].percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          {track.leader && (
            <div className="flex items-center space-x-2 mb-1">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                {track.leader.name}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500">{timeRemaining} left</p>
        </div>
      </div>

      {/* Track Container */}
      <div className="relative">
        {/* Track Background */}
        <div className="h-20 bg-white rounded-lg border-2 border-gray-200 relative overflow-hidden">
          {/* Grid Lines */}
          {[25, 50, 75].map((position) => (
            <div
              key={position}
              className="absolute top-0 bottom-0 w-px bg-gray-300 opacity-30"
              style={{ left: `${position}%` }}
            />
          ))}

          {/* Start and Finish Lines */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500" />

          {/* Distance Markers */}
          <div className="absolute -bottom-6 left-0 text-xs text-gray-500 font-mono">
            0km
          </div>
          <div className="absolute -bottom-6 right-0 text-xs text-gray-500 font-mono">
            {track.maxDistance.toFixed(1)}km
          </div>
        </div>

        {/* Participant Avatars */}
        <div className="absolute top-0 left-0 right-0 h-20">
          {track.participants.map((participant, index) => (
            <motion.div
              key={participant.user.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${Math.min(participant.percentage, 95)}%`,
                top: `${(index % 3) * 24 + 4}px`,
                zIndex: track.participants.length - index,
              }}
              initial={{ left: '0%' }}
              animate={{ left: `${Math.min(participant.percentage, 95)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              {/* Avatar */}
              <div className="relative">
                <img
                  src={participant.user.image}
                  alt={participant.user.name}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg object-cover"
                />
                {participant.percentage > 95 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
                  >
                    <Crown className="w-2 h-2 text-yellow-700" />
                  </motion.div>
                )}
              </div>

              {/* Distance Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute -top-8 bg-gradient-to-r ${config.color} text-white px-2 py-1 rounded text-xs font-mono shadow-lg whitespace-nowrap`}
              >
                {participant.distance.toFixed(1)}km
              </motion.div>

              {/* Progress Trail */}
              <div
                className={`absolute top-3 right-full h-2 bg-gradient-to-r ${config.color} opacity-30 rounded-full`}
                style={{
                  width: `${participant.percentage * 4}px`,
                  maxWidth: '200px',
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mini Progress Bars for Each Participant */}
      <div className="mt-8 space-y-2">
        {track.participants.map((participant) => (
          <div key={participant.user.id} className="flex items-center space-x-3">
            <img
              src={participant.user.image}
              alt={participant.user.name}
              className="w-4 h-4 rounded-full object-cover"
            />
            <span className="text-xs text-gray-600 w-16 truncate">
              {participant.user.name}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <motion.div
                className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${participant.percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs font-mono text-gray-500 w-12 text-right">
              {participant.distance.toFixed(1)}km
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RaceTrack;