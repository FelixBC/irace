import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, TrendingUp, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { User, Challenge, Sport, UserStats } from '../../types';

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
  stats?: UserStats | null;
}

const ProfileHero: React.FC<ProfileHeroProps> = ({
  user,
  activeChallenges,
  pastChallenges,
  stats,
}) => {
  const primarySport = useMemo<Sport | null>(() => {
    const sports = [...activeChallenges, ...pastChallenges].flatMap(c => c.sports);
    if (sports.length === 0) return null;
    const counts = new Map<Sport, number>();
    sports.forEach(s => counts.set(s, (counts.get(s) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }, [activeChallenges, pastChallenges]);

  const memberSince = stats?.memberSince
    ? `Member since ${format(new Date(stats.memberSince), 'MMM yyyy')}`
    : null;

  const weekDist = stats?.weeklyStats.distance ?? null;
  const lastWeekDist = stats?.weeklyStats.distanceLastWeek ?? null;
  const weekDelta = weekDist !== null && lastWeekDist !== null ? weekDist - lastWeekDist : null;

  const streak = stats?.streaks.current ?? null;
  const winRate = stats?.winRecord.rate ?? null;
  const wins = stats?.winRecord.wins ?? null;
  const losses = stats?.winRecord.losses ?? null;

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

          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-5">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {memberSince ? (
              <span>{memberSince}</span>
            ) : (
              <Sk className="h-3 w-28" />
            )}
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-3 gap-3 max-w-xs">
            {/* Current Streak */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Flame
                  className={`w-3.5 h-3.5 ${
                    streak && streak > 0
                      ? 'text-orange-500'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </div>
              {streak !== null ? (
                <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white leading-tight">
                  {streak}
                </p>
              ) : (
                <Sk className="h-6 w-10 mx-auto mb-1" />
              )}
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                {streak === 1 ? 'day streak' : 'day streak'}
              </p>
            </div>

            {/* This Week */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp
                  className={`w-3.5 h-3.5 ${
                    weekDist !== null ? 'text-brand' : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </div>
              {weekDist !== null ? (
                <>
                  <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white leading-tight">
                    {weekDist.toFixed(1)}
                  </p>
                  {weekDelta !== null && lastWeekDist !== null && lastWeekDist > 0 && (
                    <p
                      className={`text-[9px] leading-tight ${
                        weekDelta >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-500 dark:text-red-400'
                      }`}
                    >
                      {weekDelta >= 0 ? '+' : ''}
                      {weekDelta.toFixed(1)} km
                    </p>
                  )}
                </>
              ) : (
                <Sk className="h-6 w-12 mx-auto mb-1" />
              )}
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                km this week
              </p>
            </div>

            {/* Win Rate */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy
                  className={`w-3.5 h-3.5 ${
                    winRate !== null ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </div>
              {winRate !== null ? (
                <>
                  <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white leading-tight">
                    {winRate}%
                  </p>
                  {wins !== null && losses !== null && (
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">
                      {wins}W – {losses}L
                    </p>
                  )}
                </>
              ) : (
                <Sk className="h-6 w-10 mx-auto mb-1" />
              )}
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
