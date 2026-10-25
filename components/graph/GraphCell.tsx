'use client';

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GraphCellProps {
  week: number;
  day: number;
  dateStr?: string;
  realCount: number;
  queuedCount?: number;
  customColor?: string;
  onCellMouseDown?: (week: number, day: number) => void;
  onCellMouseEnter?: (week: number, day: number) => void;
  onCellClick?: (week: number, day: number) => void;
  onCellContextMenu?: (e: React.MouseEvent, week: number, day: number) => void;
}

export default function GraphCell({
  week,
  day,
  dateStr,
  realCount,
  queuedCount = 0,
  customColor,
  onCellMouseDown,
  onCellMouseEnter,
  onCellClick,
  onCellContextMenu,
}: GraphCellProps) {
  // Determine GitHub intensity level (0-4)
  const getLevelColor = (count: number) => {
    if (customColor && customColor !== '#ebedf0' && customColor !== '#161b22') {
      return customColor;
    }
    if (count <= 0) return '#161b22';
    if (count <= 3) return '#0e4429';
    if (count <= 6) return '#006d32';
    if (count <= 9) return '#26a641';
    return '#39d353';
  };

  const isQueued = queuedCount > 0;
  const baseColor = getLevelColor(realCount);

  // Formatted date string for tooltip
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : `Week ${week + 1}, Day ${day}`;

  const tooltipText = isQueued
    ? `${queuedCount} queued commits (${realCount} existing) on ${formattedDate}`
    : `${realCount} contribution${realCount === 1 ? '' : 's'} on ${formattedDate}`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onCellMouseDown?.(week, day);
            }}
            onMouseEnter={() => {
              onCellMouseEnter?.(week, day);
            }}
            onClick={() => {
              onCellClick?.(week, day);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onCellContextMenu?.(e, week, day);
            }}
            className={`w-[12px] h-[12px] rounded-xs transition-all duration-75 relative outline-none focus-visible:ring-1 focus-visible:ring-white/50 cursor-pointer ${
              isQueued
                ? 'ring-2 ring-orange-400 z-10 scale-105 shadow-[0_0_6px_rgba(251,146,60,0.6)]'
                : 'hover:ring-1 hover:ring-white/40 hover:scale-110'
            }`}
            style={{
              backgroundColor: isQueued ? (realCount > 0 ? baseColor : '#c2410c') : baseColor,
            }}
            aria-label={tooltipText}
          />
        }
      />
      <TooltipContent className="bg-[#1f242c] text-white border-[#30363d] text-xs py-1 px-2.5 font-sans shadow-lg">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
