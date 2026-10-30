import React from 'react';
import { yearGridToDate } from '@/lib/core/grid-mapper';

interface GraphMonthLabelsProps {
  year: number;
}

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export default function GraphMonthLabels({ year }: GraphMonthLabelsProps) {
  // First column whose Thursday falls in each month
  const labels: { week: number; name: string }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < 53; week++) {
    const date = yearGridToDate(week, 4, year);
    if (date.getUTCFullYear() !== year) continue;
    const month = date.getUTCMonth();
    if (month !== lastMonth) {
      labels.push({ week, name: MONTH_NAMES[month] });
      lastMonth = month;
    }
  }

  return (
    <div className="relative h-5 mt-2 ml-9 text-[11px] text-dim select-none">
      {labels.map((item) => (
        <span key={item.name} className="absolute" style={{ left: `${item.week * 16}px` }}>
          {item.name}
        </span>
      ))}
    </div>
  );
}
