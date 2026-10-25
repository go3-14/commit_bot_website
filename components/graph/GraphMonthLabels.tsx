import React from 'react';
import { yearGridToDate } from '@/lib/core/grid-mapper';

interface GraphMonthLabelsProps {
  year: number;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function GraphMonthLabels({ year }: GraphMonthLabelsProps) {
  // Determine which week each month starts on
  const monthLabels: { weekIndex: number; name: string }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < 53; week++) {
    // Check Wednesday (day 3) or Sunday (day 0) to avoid edge jitter
    const date = yearGridToDate(week, 3, year);
    if (date.getFullYear() === year) {
      const month = date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ weekIndex: week, name: MONTH_NAMES[month] });
        lastMonth = month;
      }
    }
  }

  return (
    <div className="flex text-[11px] text-[#8b949e] font-mono h-4 relative select-none pl-8 mb-1">
      {monthLabels.map((item, idx) => {
        // Calculate horizontal position (each column is 12px + 3px gap = 15px)
        const left = item.weekIndex * 15;
        return (
          <span
            key={idx}
            className="absolute"
            style={{ left: `${left + 32}px` }}
          >
            {item.name}
          </span>
        );
      })}
    </div>
  );
}
