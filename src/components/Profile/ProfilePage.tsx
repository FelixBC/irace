import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Challenge, ChallengeStatus, UserStats } from '../../types';
import { ChallengeService } from '../../services/challengeService';
import { getUserStats } from '../../services/userStatsService';
import { createLogger } from '../../lib/logger';
import ProfileHero from './ProfileHero';
import ActiveChallenges from './ActiveChallenges';
import StreaksAndPBs from './StreaksAndPBs';
import ActivityHeatmap from './ActivityHeatmap';
import LifetimeStats from './LifetimeStats';
import ChallengesHistory from './ChallengesHistory';
import HeadToHead from './HeadToHead';
import ProfileFooterStrip from './ProfileFooterStrip';

const log = createLogger('profile-page');

const ProfilePage: React.FC = () => {
  const { user, isConnectedToStrava } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    ChallengeService.getUserChallenges(user.id)
      .then(setChallenges)
      .catch(err => log.error('failed to load challenges', err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isConnectedToStrava) return;
    let cancelled = false;
    setStatsError(null);
    getUserStats(user.id)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        log.error('failed to load stats', err);
        if (!cancelled) {
          setStats(null);
          setStatsError(err instanceof Error ? err.message : 'Failed to load profile stats');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, isConnectedToStrava]);

  const activeChallenges = challenges.filter(c => c.status === ChallengeStatus.ACTIVE);
  const pastChallenges = challenges.filter(c => c.status !== ChallengeStatus.ACTIVE);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" />
      </div>
    );
  }

  if (!isConnectedToStrava) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <ProfileHero
            user={user}
            isConnectedToStrava={isConnectedToStrava}
            activeChallenges={[]}
            pastChallenges={[]}
          />
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              Connect Strava to populate your profile
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Activity history, streaks, and challenge stats all come from Strava.
            </p>
            <a
              href="/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors"
            >
              Go to Settings
            </a>
          </div>
          <ProfileFooterStrip />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {statsError && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
          >
            <p className="font-medium">Profile stats could not be loaded</p>
            <p className="text-amber-800/90 dark:text-amber-200/90 mt-1">{statsError}</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-2">
              If you use local dev, run <code className="font-mono">vercel dev</code> so{' '}
              <code className="font-mono">/api</code> routes are available (Vite alone does not serve them).
            </p>
          </div>
        )}
        <ProfileHero
          user={user}
          isConnectedToStrava={isConnectedToStrava}
          activeChallenges={activeChallenges}
          pastChallenges={pastChallenges}
          stats={stats}
        />
        <ActiveChallenges challenges={activeChallenges} loading={loading} />
        <StreaksAndPBs stats={stats} errorMessage={statsError} />
        <ActivityHeatmap cells={stats?.heatmap} />
        <LifetimeStats stats={stats?.lifetimeStats} errorMessage={statsError} />
        <ChallengesHistory challenges={pastChallenges} loading={loading} />
        <HeadToHead />
        <ProfileFooterStrip />
      </div>
    </div>
  );
};

export default ProfilePage;
