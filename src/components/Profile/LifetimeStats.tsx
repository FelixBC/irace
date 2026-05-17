import React from 'react';
import { motion } from 'framer-motion';
import type { LifetimeStats as LifetimeStatsData } from '../../types';

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
);

interface StatCardProps {
  label: string;
  value?: string;
  unit?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="text-center"
  >
    {value != null ? (
      <>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
        {unit && <p className="text-xs text-gray-500 dark:text-gray-400">{unit}</p>}
      </>
    ) : (
      <>
        <Sk className="h-7 w-16 mx-auto mb-1" />
        <Sk className="h-3 w-10 mx-auto" />
      </>
    )}
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1.5">{label}</p>
  </motion.div>
);

interface LifetimeStatsProps {
  stats?: LifetimeStatsData;
  errorMessage?: string | null;
}

const LifetimeStats: React.FC<LifetimeStatsProps> = ({ stats, errorMessage }) => (
  <section aria-label="Lifetime stats">
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Lifetime Stats</h2>
        {errorMessage ? (
          <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
            Error
          </span>
        ) : !stats ? (
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Coming soon
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <StatCard
          label="Total distance"
          value={stats ? stats.totalDistanceKm.toLocaleString() : undefined}
          unit="km"
          delay={0}
        />
        <StatCard
          label="Total time"
          value={stats ? Math.floor(stats.totalTimeSeconds / 3600).toLocaleString() : undefined}
          unit="hours"
          delay={0.04}
        />
        <StatCard
          label="Total activities"
          value={stats ? stats.totalActivities.toLocaleString() : undefined}
          delay={0.08}
        />
        <StatCard
          label="Total elevation"
          value={stats ? stats.totalElevationM.toLocaleString() : undefined}
          unit="m"
          delay={0.12}
        />
      </div>
    </div>
  </section>
);

export default LifetimeStats;
