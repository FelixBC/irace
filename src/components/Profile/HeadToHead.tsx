import React from 'react';
import type { HeadToHeadRecord } from '../../types';

interface HeadToHeadProps {
  records?: HeadToHeadRecord[];
}

const HeadToHead: React.FC<HeadToHeadProps> = ({ records = [] }) => {
  if (records.length === 0) return null;

  return (
    <section aria-label="Head-to-head records">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Head-to-Head</h2>
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    r.image ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&size=40&background=2563EB&color=fff`
                  }
                  alt={r.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-medium text-gray-900 dark:text-white text-sm">{r.name}</span>
              </div>
              <span className="tabular-nums text-sm font-semibold text-gray-900 dark:text-white">
                {r.wins}–{r.losses}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          iRace-derived ranking only — no opponent activity details shown.
        </p>
      </div>
    </section>
  );
};

export default HeadToHead;
