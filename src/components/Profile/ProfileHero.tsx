import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, TrendingUp, Trophy } from 'lucide-react';
import { User, Challenge, Sport } from '../../types';

const SPORT_ICONS: Partial<Record<Sport, string>> = {
  [Sport.RUNNING]: '🏃',
  [Sport.CYCLING]: '🚴',
  [Sport.SWIMMING]: '🏊',
  [Sport.WALKING]: '🚶',
  [Sport.HIKING]: '🥾',
  [Sport.WEIGHT_TRAINING]: '💪',
  [Sport.YOGA]: '🧘',
};

const SPORT_LABELS: Partial<Record<Sport, string>> = {
  [Sport.RUNNING]: 'Runner',
  [Sport.CYCLING]: 'Cyclist',
  [Sport.SWIMMING]: 'Swimmer',
  [Sport.WALKING]: 'Walker',
  [Sport.HIKING]: 'Hiker',
  [Sport.WEIGHT_TRAINING]: 'Strength Athlete',
  [Sport.YOGA]: 'Yogi',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0][0] ?? 'A').toUpperCase();
}

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
);

interface ProfileHeroProps {
  user: User;
  isConnectedToStrava: boolean;
  activeChallenges: Challenge[];
  pastChallenges: Challenge[];
}

const ProfileHero: React.FC<ProfileHeroProps> = ({
  user,
  activeChallenges,
  pastChallenges,
}) => {
  const primarySport = useMemo<Sport | null>(() => {
    const sports = [...activeChallenges, ...pastChallenges].flatMap(c => c.sports);
    if (sports.length === 0) return null;
    const counts = new Map<Sport, number>();
    sports.forEach(s => counts.set(s, (counts.get(s) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }, [activeChallenges, pastChallenges]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
        {/* Avatar */}
        <div className="shrink-0">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? 'Athlete'}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-brand-dark to-brand flex items-center justify-center ring-4 ring-white dark:ring-gray-900 shadow-md">
              <span className="text-white font-bold text-3xl sm:text-4xl select-none">
                {getInitials(user.name ?? 'A')}
              </span>
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
              {user.name ?? 'Athlete'}
            </h1>
            {primarySport && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-faint dark:bg-brand/20 text-brand dark:text-brand-light">
                <span aria-hidden="true">{SPORT_ICONS[primarySport]}</span>
                {SPORT_LABELS[primarySport]}
              </span>
            )}
          </div>

          {/* Member since — TODO(backend): user.createdAt not in User type */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <Sk className="h-3 w-28" />
          </div>

          {/* Hero stats — all require backend endpoints */}
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            {/* Current Streak — TODO(backend): no streak endpoint */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Flame className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              </div>
              <Sk className="h-6 w-10 mx-auto mb-1" />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                Current streak
              </p>
            </div>

            {/* This Week — TODO(backend): no weekly stats endpoint */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              </div>
              <Sk className="h-6 w-12 mx-auto mb-1" />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                This week
              </p>
            </div>

            {/* Win Rate — TODO(backend): finishPosition needed for accurate W/L */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
              </div>
              <Sk className="h-6 w-10 mx-auto mb-1" />
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                Win rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ProfileHero;
