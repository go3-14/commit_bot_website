'use client';

import React, { useState, useEffect } from 'react';
import GraphMonthLabels from './GraphMonthLabels';
import GraphDayLabels from './GraphDayLabels';
import GraphCell from './GraphCell';
import { ContributionDay } from '@/types';
import { yearGridToDate, toDateString } from '@/lib/core/grid-mapper';
import { useGraphStore } from '@/store/graph-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContributionGraphProps {
  realData: ContributionDay[][] | null;
  year: number;
  onYearChange?: (year: number) => void;
}

export default function ContributionGraph({
  realData,
  year,
  onYearChange,
}: ContributionGraphProps) {
  const {
    queue,
    activeTool,
    intensity,
    setCell,
    clearCell,
    isDragging,
    dragAction,
    startDrag,
    endDrag,
  } = useGraphStore();

  const [activePopoverKey, setActivePopoverKey] = useState<string | null>(null);
  const [dragMoved, setDragMoved] = useState<boolean>(false);

  // Clean up drag state on global mouseup
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        endDrag();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, endDrag]);

  const cellKey = (week: number, day: number) => toDateString(yearGridToDate(week, day, year));

  // Handle cell mouse down
  const handleCellMouseDown = (week: number, day: number) => {
    setDragMoved(false);

    if (activeTool === 'erase') {
      startDrag('remove');
      clearCell(cellKey(week, day));
      setActivePopoverKey(null);
    } else {
      startDrag('add');
      const key = `${week}-${day}`;
      setActivePopoverKey((prev) => (prev === key ? null : key));
    }
  };

  // Handle dragging over cells
  const handleCellMouseEnter = (week: number, day: number) => {
    if (!isDragging) return;

    setDragMoved(true);
    setActivePopoverKey(null);

    if (dragAction === 'remove' || activeTool === 'erase') {
      clearCell(cellKey(week, day));
    } else if (dragAction === 'add') {
      setCell(cellKey(week, day), intensity);
    }
  };

  // Right-click quick erase
  const handleCellContextMenu = (e: React.MouseEvent, week: number, day: number) => {
    e.preventDefault();
    clearCell(cellKey(week, day));
    setActivePopoverKey(null);
  };

  // Compute total real contributions
  const totalContributions = React.useMemo(() => {
    if (!realData) return 0;
    return realData.reduce(
      (sum, week) => sum + week.reduce((wSum, day) => wSum + (day.contributionCount || 0), 0),
      0
    );
  }, [realData]);

  // Compute total queued commits
  const totalQueuedCommits = React.useMemo(() => {
    return Object.values(queue).reduce((sum, count) => sum + count, 0);
  }, [queue]);

  const years = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="w-full select-none font-mono">
      {/* Monkeytype Heatmap Card */}
      <div className="w-full bg-[#182319] border border-[#263626] rounded-xl p-5 shadow-lg">
        {/* Top Control Bar inside card */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#263626]/70">
          <div className="flex items-center gap-3">
            {/* Year selector styled as Monkeytype dropdown */}
            <Select
              value={year.toString()}
              onValueChange={(val) => val && onYearChange?.(parseInt(val, 10))}
            >
              <SelectTrigger className="h-7 w-[140px] text-xs bg-[#111810] border-[#263626] text-[#8cd48f] font-mono focus:ring-0">
                <SelectValue placeholder="year" />
              </SelectTrigger>
              <SelectContent className="bg-[#182319] border-[#263626] text-[#dbead9] text-xs font-mono">
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y} activity
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-xs text-[#607b62]">
              {totalContributions.toLocaleString()} contributions
            </span>

            {totalQueuedCommits > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-[#eab308]/15 border border-[#eab308]/40 text-[#f59e0b] font-mono">
                +{totalQueuedCommits.toLocaleString()} queued
              </span>
            )}
          </div>

          {/* Monkeytype Heatmap Legend */}
          <div className="flex items-center gap-1.5 text-xs text-[#607b62]">
            <span>less</span>
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#141d14] border border-[#1e2b1f]" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#234226]" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#36683b]" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#5ca162]" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#8cd48f]" />
            <span>more</span>
          </div>
        </div>

        {/* The Grid: 53 Columns × 7 Rows */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-[940px]">
            <div className="flex items-start">
              {/* Day Labels on the Left: monday, wednesday, friday */}
              <GraphDayLabels />

              {/* Cells Grid */}
              <div className="flex gap-[3px]">
                {Array.from({ length: 53 }, (_, week) => (
                  <div key={week} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }, (_, day) => {
                      const dayData = realData?.[week]?.[day];
                      const realCount = dayData?.contributionCount ?? 0;
                      const dateStr =
                        dayData?.date || toDateString(yearGridToDate(week, day, year));
                      const key = `${week}-${day}`;
                      const queuedCount = queue[cellKey(week, day)] ?? 0;
                      
                      const customColor = dayData?.color;
                      const isPopoverOpen = activePopoverKey === key;

                      return (
                        <GraphCell
                          key={day}
                          week={week}
                          day={day}
                          dateStr={dateStr}
                          realCount={realCount}
                          queuedCount={queuedCount}
                          customColor={customColor}
                          isPopoverOpen={isPopoverOpen}
                          onPopoverOpenChange={(open) => {
                            if (!dragMoved) {
                              setActivePopoverKey(open ? key : null);
                            }
                          }}
                          onSetCommitCount={(count) => {
                            if (count <= 0) {
                              clearCell(cellKey(week, day));
                            } else {
                              setCell(cellKey(week, day), count);
                            }
                          }}
                          onCellMouseDown={handleCellMouseDown}
                          onCellMouseEnter={handleCellMouseEnter}
                          onCellContextMenu={handleCellContextMenu}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Month Labels along the Bottom */}
            <GraphMonthLabels year={year} />

            {/* Monkeytype Centered Footnote */}
            <div className="mt-4 text-center text-[10px] text-[#607b62]">
              Note: All activity data is using UTC time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
