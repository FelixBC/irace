import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Route, Timer, Mountain } from 'lucide-react';

const Sk: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
);

const BentoCard: React.FC<{ icon: React.ReactNode; label: string; delay?: number }> = ({
  icon,
  label,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3"
  >
    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <Sk className="h-8 w-20" />
    <Sk className="h-3 w-14" />
  </motion.div>
);

const StreaksAndPBs: React.FC = () => (
  <section aria-label="Streaks and personal bests">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Streaks &amp; Personal Bests</h2>
      <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
        Coming soon
      </span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <BentoCard icon={<Flame className="w-4 h-4" />} label="Current streak" delay={0} />
      <BentoCard icon={<Zap className="w-4 h-4" />} label="Longest streak" delay={0.04} />
      <BentoCard icon={<Route className="w-4 h-4" />} label="Longest activity" delay={0.08} />
      <BentoCard icon={<Timer className="w-4 h-4" />} label="Fastest pace" delay={0.12} />
      <BentoCard icon={<Mountain className="w-4 h-4" />} label="Best elevation day" delay={0.16} />
    </div>
  </section>
);

export default StreaksAndPBs;
