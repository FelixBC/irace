import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { RaceTrack, Sport } from '../../types';

interface LeaderboardProps {
  raceTracks: RaceTrack[];
}

const sportConfig = {
  RUNNING: { icon: '🏃‍♂️', color: 'text-orange-600' },
  CYCLING: { icon: '🚴‍♂️', color: 'text-blue-600' },
  SWIMMING: { icon: '🏊‍♂️', color: 'text-teal-600' },
  WALKING: { icon: '🚶‍♂️', color: 'text-green-600' },
  HIKING: { icon: '🥾', color: 'text-amber-600' },
  WEIGHT_TRAINING: { icon: '💪', color: 'text-purple-600' },
};

const Leaderboard: React.FC<LeaderboardProps> = ({ raceTracks }) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
        Leaderboard
      </h3>

      <div className="space-y-6">
        {raceTracks.map((track) => (
          <div key={track.sport}>
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-lg">{sportConfig[track.sport].icon}</span>
              <h4 className={`font-medium capitalize ${sportConfig[track.sport].color}`}>
                {track.sport}
              </h4>
            </div>

            <div className="space-y-2">
              {track.participants.slice(0, 3).map((participant, index) => (
                <motion.div
                  key={participant.user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(index + 1)}
                  </div>
                  <img
                    src={participant.user.image}
                    alt={participant.user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {participant.user.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-gray-900">
                      {participant.distance.toFixed(1)}km
                    </p>
                    <p className="text-xs text-gray-500">
                      {participant.percentage.toFixed(0)}%
                    </p>
                  </div>
                </motion.div>
              ))}

              {track.participants.length === 0 && (
                <p className="text-sm text-gray-500 italic">No participants yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Leaderboard;