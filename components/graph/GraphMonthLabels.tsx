import React from 'react';
import { yearGridToDate } from '@/lib/core/grid-mapper';

interface GraphMonthLabelsProps {
  year: number;
}

const MONTH_NAMES = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

export default function GraphMonthLabels({ year }: GraphMonthLabelsProps) {
  // Determine which week each month starts on
  const monthLabels: { weekIndex: number; name: string }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < 53; week++) {
    const date = yearGridToDate(week, 3, year);
    if (date.getUTCFullYear() === year) {
      const month = date.getUTCMonth();
      if (month !== lastMonth) {
        monthLabels.push({ weekIndex: week, name: MONTH_NAMES[month] });
        lastMonth = month;
      }
    }
  }

  return (
    <div className="flex text-[11px] text-[#607b62] font-mono h-5 relative select-none pl-14 mt-2">
      {monthLabels.map((item, idx) => {
        // Each column is 13px cell + 3px gap = 16px
        const left = item.weekIndex * 16;
        return (
          <span
            key={idx}
            className="absolute"
            style={{ left: `${left + 56}px` }}
          >
            {item.name}
          </span>
        );
      })}
    </div>
  );
}
