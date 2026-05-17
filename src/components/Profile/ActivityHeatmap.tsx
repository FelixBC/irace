import React, { useState, useMemo } from 'react';
import { subDays, format, startOfDay } from 'date-fns';
import { HeatmapCell } from '../../types';

type Range = '12wk' | '6mo' | '1yr';

const RANGE_DAYS: Record<Range, number> = { '12wk': 84, '6mo': 182, '1yr': 365 };
const RANGE_LABELS: Record<Range, string> = { '12wk': '12 weeks', '6mo': '6 months', '1yr': '1 year' };

function intensityClass(distance: number): string {
  if (distance <= 0) return 'bg-gray-100 dark:bg-gray-800';
  if (distance < 5) return 'bg-brand/25';
  if (distance < 15) return 'bg-brand/50';
  if (distance < 30) return 'bg-brand/75';
  return 'bg-brand';
}

interface ActivityHeatmapProps {
  cells?: HeatmapCell[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ cells = [] }) => {
  const [range, setRange] = useState<Range>('12wk');
  const weeks = useMemo(() => {
    const days = RANGE_DAYS[range];
    const today = startOfDay(new Date());
    const cellMap = new Map(cells.map(c => [c.date, c]));
    const flat = Array.from({ length: days }, (_, i) => {
      const d = subDays(today, days - 1 - i);
      const key = format(d, 'yyyy-MM-dd');
      const cell = cellMap.get(key);
      return {
        key,
        label: format(d, 'MMM d'),
        month: format(d, 'MMM'),
        distance: cell?.distance ?? 0,
        count: cell?.count ?? 0,
      };
    });
    const result: typeof flat[] = [];
    for (let i = 0; i < flat.length; i += 7) result.push(flat.slice(i, i + 7));
    return result;
  }, [range, cells]);

  return (
    <section aria-label="Activity heatmap">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Activity Heatmap</h2>
          <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {(['12wk', '6mo', '1yr'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  range === r
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {cells.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Full activity history coming soon — requires backend aggregation endpoint.
          </p>
        )}

        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1 min-w-fit">
            {weeks.map((week, wi) => {
              const prevMonth = wi > 0 ? weeks[wi - 1][0].month : '';
              const showMonth = week[0].month !== prevMonth;
              return (
                <div key={wi} className="flex flex-col gap-1 shrink-0">
                  <div className="h-3 text-[9px] leading-3 text-gray-400 dark:text-gray-600">
                    {showMonth ? week[0].month : ''}
                  </div>
                  {week.map((cell, di) => (
                    <div
                      key={di}
                      title={`${cell.label}: ${cell.distance > 0 ? `${cell.distance.toFixed(1)} km (${cell.count} ${cell.count === 1 ? 'activity' : 'activities'})` : 'No activity'}`}
                      className={`w-3 h-3 rounded-sm ${intensityClass(cell.distance)} transition-colors cursor-default`}
                    />
                  ))}
                  {Array.from({ length: 7 - week.length }).map((_, pi) => (
                    <div key={`pad-${pi}`} className="w-3 h-3" />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[9px] text-gray-400 dark:text-gray-600">Less</span>
          {[
            'bg-gray-100 dark:bg-gray-800',
            'bg-brand/25',
            'bg-brand/50',
            'bg-brand/75',
            'bg-brand',
          ].map((cls, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
          ))}
          <span className="text-[9px] text-gray-400 dark:text-gray-600">More</span>
        </div>
      </div>
    </section>
  );
};

export default ActivityHeatmap;
