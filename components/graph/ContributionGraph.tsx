'use client';

import React, { useEffect } from 'react';
import GraphMonthLabels from './GraphMonthLabels';
import GraphDayLabels from './GraphDayLabels';
import GraphCell from './GraphCell';
import { ContributionDay } from '@/types';
import { yearGridToDate } from '@/lib/core/grid-mapper';
import { useGraphStore } from '@/store/graph-store';

interface ContributionGraphProps {
  realData: ContributionDay[][] | null;
  year: number;
}

export default function ContributionGraph({
  realData,
  year,
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

  // Handle cell click / mouse down
  const handleCellMouseDown = (week: number, day: number) => {
    if (activeTool === 'erase') {
      startDrag('remove');
      clearCell(week, day);
    } else {
      // Paint mode or others
      startDrag('add');
      setCell(week, day, intensity);
    }
  };

  // Handle dragging over cells
  const handleCellMouseEnter = (week: number, day: number) => {
    if (!isDragging) return;

    if (dragAction === 'remove' || activeTool === 'erase') {
      clearCell(week, day);
    } else if (dragAction === 'add') {
      setCell(week, day, intensity);
    }
  };

  // Right-click quick erase
  const handleCellContextMenu = (e: React.MouseEvent, week: number, day: number) => {
    e.preventDefault();
    clearCell(week, day);
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

  const totalQueuedDates = React.useMemo(() => {
    return Object.keys(queue).length;
  }, [queue]);

  return (
    <div className="w-full flex flex-col items-center select-none">
      <div className="w-full overflow-x-auto pb-4 pt-1">
        <div className="inline-block min-w-[850px] p-6 rounded-xl border border-[#30363d] bg-[#161b22] shadow-xl">
          {/* Header Stats */}
          <div className="flex items-center justify-between mb-4 border-b border-[#30363d]/80 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">
                {totalContributions.toLocaleString()} contributions in {year}
              </span>
              {totalQueuedCommits > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-950/80 border border-orange-500/50 text-orange-400 font-mono font-semibold animate-pulse">
                  +{totalQueuedCommits.toLocaleString()} queued across {totalQueuedDates} dates
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-[#8b949e]">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-xs ring-2 ring-orange-400 bg-[#c2410c]" />
                <span className="text-orange-400 font-medium">Queued</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Less</span>
                <div className="w-2.5 h-2.5 rounded-xs bg-[#161b22] border border-[#30363d]" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#0e4429]" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#006d32]" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#26a641]" />
                <div className="w-2.5 h-2.5 rounded-xs bg-[#39d353]" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Month Labels */}
          <GraphMonthLabels year={year} />

          {/* Grid with Day Labels */}
          <div className="flex items-start">
            <GraphDayLabels />

            <div className="flex gap-[3px]">
              {Array.from({ length: 53 }, (_, week) => (
                <div key={week} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }, (_, day) => {
                    const dayData = realData?.[week]?.[day];
                    const realCount = dayData?.contributionCount ?? 0;
                    const dateStr =
                      dayData?.date || yearGridToDate(week, day, year).toISOString().split('T')[0];
                    const queuedCount = queue[`${week}-${day}`] ?? 0;
                    const customColor = dayData?.color;

                    return (
                      <GraphCell
                        key={day}
                        week={week}
                        day={day}
                        dateStr={dateStr}
                        realCount={realCount}
                        queuedCount={queuedCount}
                        customColor={customColor}
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
        </div>
      </div>
    </div>
  );
}
