import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Minus, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Challenge, ChallengeStatus, Sport } from '../../types';

const SPORT_ICONS: Partial<Record<Sport, string>> = {
  [Sport.RUNNING]: '🏃',
  [Sport.CYCLING]: '🚴',
  [Sport.SWIMMING]: '🏊',
  [Sport.WALKING]: '🚶',
  [Sport.HIKING]: '🥾',
  [Sport.WEIGHT_TRAINING]: '💪',
  [Sport.YOGA]: '🧘',
};

type FilterTab = 'all' | 'won' | 'lost' | 'podium';

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'podium', label: 'Podium' },
];

function outcomeFor(c: Challenge): { label: string; color: string; icon: React.ReactNode } {
  if (c.status === ChallengeStatus.CANCELLED) {
    return {
      label: 'Cancelled',
      color: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
      icon: <X className="w-3 h-3" />,
    };
  }
  if (c.status === ChallengeStatus.COMPLETED) {
    const pct = c.myProgress ?? 0;
    if (pct >= 100) {
      return {
        label: 'Goal achieved',
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
        icon: <Trophy className="w-3 h-3" />,
      };
    }
    return {
      label: 'Did not finish',
      color: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
      icon: <Minus className="w-3 h-3" />,
    };
  }
  return {
    label: c.status,
    color: 'text-gray-400 bg-gray-50 dark:bg-gray-800',
    icon: null,
  };
}

function formatDateRange(start: Date | string, end: Date | string): string {
  return `${format(new Date(start), 'MMM d')} – ${format(new Date(end), 'MMM d, yyyy')}`;
}

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
);

const SkeletonRow: React.FC = () => (
  <div className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800">
    <Sk className="w-8 h-8 rounded-lg shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Sk className="h-4 w-48" />
      <Sk className="h-3 w-32" />
    </div>
    <Sk className="h-5 w-20 rounded-full shrink-0" />
  </div>
);

interface ChallengesHistoryProps {
  challenges: Challenge[];
  loading: boolean;
}

const ChallengesHistory: React.FC<ChallengesHistoryProps> = ({ challenges, loading }) => {
  const [tab, setTab] = useState<FilterTab>('all');

  const sorted = useMemo(
    () => [...challenges].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()),
    [challenges],
  );

  const filtered = useMemo(() => {
    if (tab === 'all') return sorted;
    if (tab === 'won') return sorted.filter(c => c.status === ChallengeStatus.COMPLETED && (c.myProgress ?? 0) >= 100);
    if (tab === 'lost') return sorted.filter(c => c.status === ChallengeStatus.COMPLETED && (c.myProgress ?? 0) < 100);
    if (tab === 'podium') return sorted.filter(c => c.status === ChallengeStatus.COMPLETED && (c.myProgress ?? 0) >= 100);
    return sorted;
  }, [sorted, tab]);

  return (
    <section aria-label="Challenges history">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Challenge History</h2>
          <Link
            to="/create"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand dark:text-brand-light hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(tab === 'won' || tab === 'podium') && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">
            Showing challenges where you reached your goal. Rank-based filtering (1st/podium) requires backend position data.
          </p>
        )}

        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No challenges here yet.</p>
            {challenges.length === 0 && (
              <Link
                to="/create"
                className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create your first challenge
              </Link>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((c, i) => {
              const { label, color, icon } = outcomeFor(c);
              const sports = c.sports.slice(0, 3);
              const isWin = c.status === ChallengeStatus.COMPLETED && (c.myProgress ?? 0) >= 100;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  {/* Sport icon */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 ${
                      isWin ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <span aria-hidden="true">{SPORT_ICONS[sports[0]] ?? '🏆'}</span>
                  </div>

                  {/* Name + dates */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isWin ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {c.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateRange(c.startDate, c.endDate)}
                    </p>
                  </div>

                  {/* Outcome chip */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${color} shrink-0`}
                  >
                    {icon}
                    {label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ChallengesHistory;
