'use client';

import React, { useState, useEffect } from 'react';
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

  // Handle cell mouse down
  const handleCellMouseDown = (week: number, day: number) => {
    setDragMoved(false);

    if (activeTool === 'erase') {
      startDrag('remove');
      clearCell(week, day);
      setActivePopoverKey(null);
    } else {
      startDrag('add');
      // If user drags, it will paint. If user just clicks without dragging, we open popover
      const key = `${week}-${day}`;
      setActivePopoverKey((prev) => (prev === key ? null : key));
    }
  };

  // Handle dragging over cells
  const handleCellMouseEnter = (week: number, day: number) => {
    if (!isDragging) return;

    setDragMoved(true);
    setActivePopoverKey(null); // Close popover while dragging

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

  const totalQueuedDates = React.useMemo(() => {
    return Object.keys(queue).length;
  }, [queue]);

  return (
    <div className="w-full flex flex-col items-center select-none py-2">
      <div className="w-full overflow-x-auto pb-6 pt-2">
        <div className="inline-block min-w-[900px] w-full px-2">
          {/* Header Stats Bar */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#30363d]/60">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-white tracking-tight">
                {totalContributions.toLocaleString()} contributions in {year}
              </span>
              {totalQueuedCommits > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-950/80 border border-orange-500/50 text-orange-400 font-mono font-semibold animate-pulse">
                  +{totalQueuedCommits.toLocaleString()} queued across {totalQueuedDates} dates
                </span>
              )}
            </div>

            {/* GitHub Color Legend */}
            <div className="flex items-center gap-4 text-xs text-[#8b949e]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-xs ring-2 ring-orange-400 bg-[#ea580c]" />
                <span className="text-orange-400 font-medium">Queued</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-0.5">Less</span>
                <div className="w-3 h-3 rounded-xs bg-[#161b22] border border-[#30363d]" />
                <div className="w-3 h-3 rounded-xs bg-[#0e4429]" />
                <div className="w-3 h-3 rounded-xs bg-[#006d32]" />
                <div className="w-3 h-3 rounded-xs bg-[#26a641]" />
                <div className="w-3 h-3 rounded-xs bg-[#39d353]" />
                <span className="ml-0.5">More</span>
              </div>
            </div>
          </div>

          {/* Month Labels */}
          <GraphMonthLabels year={year} />

          {/* 53 Columns × 7 Rows Grid */}
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
                    const key = `${week}-${day}`;
                    const queuedCount = queue[key] ?? 0;
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
                            clearCell(week, day);
                          } else {
                            setCell(week, day, count);
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

          {/* Subtle instruction footnote */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-[#8b949e]">
            <span>💡 Click any cell to customize commit count · Drag to paint multiple cells · Right-click to erase</span>
            <span className="font-mono">53 weeks × 7 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
