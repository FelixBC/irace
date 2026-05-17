import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { Challenge, Sport } from '../../types';

const SPORT_ICONS: Partial<Record<Sport, string>> = {
  [Sport.RUNNING]: '🏃',
  [Sport.CYCLING]: '🚴',
  [Sport.SWIMMING]: '🏊',
  [Sport.WALKING]: '🚶',
  [Sport.HIKING]: '🥾',
  [Sport.WEIGHT_TRAINING]: '💪',
  [Sport.YOGA]: '🧘',
};

function daysRemaining(end: Date | string): number {
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000));
}

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
);

const SkeletonRow: React.FC = () => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
    <Sk className="w-10 h-10 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2 min-w-0">
      <Sk className="h-4 w-40" />
      <Sk className="h-2 w-full rounded-full" />
    </div>
    <Sk className="h-4 w-16 shrink-0" />
  </div>
);

interface ActiveChallengesProps {
  challenges: Challenge[];
  loading: boolean;
}

const ActiveChallenges: React.FC<ActiveChallengesProps> = ({ challenges, loading }) => (
  <section aria-label="Active challenges">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Active Challenges</h2>
      <Link
        to="/create"
        className="inline-flex items-center gap-1 text-xs font-medium text-brand dark:text-brand-light hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        New
      </Link>
    </div>

    <div className="space-y-3">
      {loading && (
        <>
          <SkeletonRow />
          <SkeletonRow />
        </>
      )}

      {!loading && challenges.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            No active challenges
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Race a friend to fill this in.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              to="/create"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create challenge
            </Link>
            <Link
              to="/my-challenges"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
            >
              Browse invites
            </Link>
          </div>
        </div>
      )}

      {!loading &&
        challenges.map((c, i) => {
          const progress = c.myProgress ?? 0;
          const left = daysRemaining(c.endDate);
          const sports = c.sports.slice(0, 3);

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={`/race/${c.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-brand dark:hover:border-brand hover:shadow-sm transition-all group"
              >
                {/* Sport icons */}
                <div className="w-10 h-10 rounded-lg bg-brand-faint dark:bg-brand/20 flex items-center justify-center text-lg shrink-0">
                  <span aria-hidden="true">{SPORT_ICONS[sports[0]] ?? '🏆'}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1.5">
                    {c.name}
                  </p>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-brand h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 tabular-nums">
                      {Math.round(progress)}%
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {left === 0 ? 'Ends today' : `${left}d left`}
                    </span>
                  </div>
                </div>

                {/* Rank — TODO(backend): finishPosition not in list endpoint */}
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-400 dark:text-gray-500">Rank</div>
                  <div className="text-sm font-bold text-gray-300 dark:text-gray-600">—</div>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0" />
              </Link>
            </motion.div>
          );
        })}
    </div>
  </section>
);

export default ActiveChallenges;
