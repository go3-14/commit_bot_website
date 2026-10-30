'use client';

import React, { useMemo } from 'react';
import { ContributionDay } from '@/types';
import { computeInsights } from '@/lib/core/insights';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

interface YearInsightsProps {
  data: ContributionDay[][];
  year: number;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-dim">{label}</span>
      <span className="text-xl font-bold text-mint tabular-nums">{value}</span>
      {hint && <span className="text-[11px] text-dim">{hint}</span>}
    </div>
  );
}

export default function YearInsights({ data, year }: YearInsightsProps) {
  const insights = useMemo(() => computeInsights(data, year), [data, year]);
  const peak = Math.max(1, ...insights.months);

  const busiestHint = insights.busiest
    ? new Date(`${insights.busiest.date}T00:00:00Z`)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
        .toLowerCase()
    : undefined;

  return (
    <section className="w-full rounded-xl border border-line bg-panel p-5" aria-label={`${year} summary`}>
      <div className="flex flex-wrap gap-x-12 gap-y-4">
        <Stat label="current streak" value={`${insights.currentStreak} d`} />
        <Stat label="longest streak" value={`${insights.longestStreak} d`} />
        <Stat label="active days" value={String(insights.activeDays)} />
        <Stat
          label="busiest day"
          value={insights.busiest ? String(insights.busiest.count) : '0'}
          hint={busiestHint}
        />
      </div>

      <div className="mt-5 flex items-end gap-2 h-24" role="img" aria-label="contributions per month">
        {insights.months.map((count, i) => (
          <div key={MONTHS[i]} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
            <div
              className="w-full max-w-10 rounded-sm bg-[#2e6334] hover:bg-mint transition-colors"
              style={{ height: `${Math.max(count > 0 ? 4 : 2, (count / peak) * 100)}%`, opacity: count > 0 ? 1 : 0.35 }}
              title={`${MONTHS[i]}: ${count}`}
            />
            <span className="text-[11px] text-dim">{MONTHS[i]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
