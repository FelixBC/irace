import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Route, Timer, Mountain } from 'lucide-react';
import { UserStats } from '../../types';

function formatPace(secPerKm: number): string {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
);

interface BentoCardProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  sub?: string;
  delay?: number;
}

const BentoCard: React.FC<BentoCardProps> = ({ icon, label, value, sub, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2"
  >
    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    {value != null ? (
      <>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white leading-none">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
      </>
    ) : (
      <>
        <Sk className="h-8 w-20" />
        <Sk className="h-3 w-14" />
      </>
    )}
  </motion.div>
);

interface StreaksAndPBsProps {
  stats?: UserStats | null;
  errorMessage?: string | null;
}

const StreaksAndPBs: React.FC<StreaksAndPBsProps> = ({ stats, errorMessage }) => {
  const current = stats?.streaks.current;
  const longest = stats?.streaks.longest;
  const longestKm = stats?.personalBests.longestActivityKm;
  const paceSecPerKm = stats?.personalBests.fastestPaceSecPerKm;

  return (
    <section aria-label="Streaks and personal bests">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Streaks &amp; Personal Bests
        </h2>
        {errorMessage ? (
          <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
            Error
          </span>
        ) : !stats ? (
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Loading…
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <BentoCard
          icon={<Flame className="w-4 h-4" />}
          label="Current streak"
          value={current != null ? String(current) : undefined}
          sub={current === 1 ? 'day' : current != null ? 'days' : undefined}
          delay={0}
        />
        <BentoCard
          icon={<Zap className="w-4 h-4" />}
          label="Longest streak"
          value={longest != null ? String(longest) : undefined}
          sub={longest === 1 ? 'day' : longest != null ? 'days' : undefined}
          delay={0.04}
        />
        <BentoCard
          icon={<Route className="w-4 h-4" />}
          label="Longest activity"
          value={longestKm != null ? longestKm.toFixed(1) : undefined}
          sub={longestKm != null ? 'km' : undefined}
          delay={0.08}
        />
        <BentoCard
          icon={<Timer className="w-4 h-4" />}
          label="Fastest pace"
          value={paceSecPerKm != null ? formatPace(paceSecPerKm) : undefined}
          sub={paceSecPerKm != null ? 'min/km (running)' : undefined}
          delay={0.12}
        />
        <BentoCard
          icon={<Mountain className="w-4 h-4" />}
          label="Best elevation day"
          value={
            stats == null
              ? undefined
              : '—'
          }
          sub={stats != null ? 'Per-activity elevation not stored yet' : undefined}
          delay={0.16}
        />
      </div>
    </section>
  );
};

export default StreaksAndPBs;
