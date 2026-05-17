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

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function outcomeFor(c: Challenge): { label: string; color: string; icon: React.ReactNode } {
  if (c.status === ChallengeStatus.CANCELLED) {
    return {
      label: 'Cancelled',
      color: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
      icon: <X className="w-3 h-3" />,
    };
  }
  if (c.status === ChallengeStatus.COMPLETED) {
    const pos = c.myFinishPosition;
    if (pos === 1) {
      return {
        label: '1st place',
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30',
        icon: <Trophy className="w-3 h-3" />,
      };
    }
    if (pos === 2) {
      return {
        label: '2nd place',
        color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30',
        icon: <Trophy className="w-3 h-3" />,
      };
    }
    if (pos === 3) {
      return {
        label: '3rd place',
        color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30',
        icon: <Trophy className="w-3 h-3" />,
      };
    }
    if (pos != null && pos > 3) {
      return {
        label: `${ordinal(pos)} place`,
        color: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800',
        icon: null,
      };
    }
    // No finishPosition recorded — fall back to progress
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

function isWon(c: Challenge): boolean {
  if (c.status !== ChallengeStatus.COMPLETED) return false;
  if (c.myFinishPosition != null) return c.myFinishPosition === 1;
  return (c.myProgress ?? 0) >= 100;
}

function isPodium(c: Challenge): boolean {
  if (c.status !== ChallengeStatus.COMPLETED) return false;
  if (c.myFinishPosition != null) return c.myFinishPosition <= 3;
  return (c.myProgress ?? 0) >= 100;
}

function isLost(c: Challenge): boolean {
  if (c.status !== ChallengeStatus.COMPLETED) return false;
  if (c.myFinishPosition != null) return c.myFinishPosition > 1;
  return (c.myProgress ?? 0) < 100;
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
    if (tab === 'won') return sorted.filter(isWon);
    if (tab === 'lost') return sorted.filter(isLost);
    if (tab === 'podium') return sorted.filter(isPodium);
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
              const won = isWon(c);

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 ${
                      won ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <span aria-hidden="true">{SPORT_ICONS[sports[0]] ?? '🏆'}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        won ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {c.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateRange(c.startDate, c.endDate)}
                    </p>
                  </div>

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
