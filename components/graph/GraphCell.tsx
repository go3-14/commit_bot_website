'use client';

import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Check, Trash2 } from 'lucide-react';

interface GraphCellProps {
  week: number;
  day: number;
  dateStr?: string;
  realCount: number;
  queuedCount?: number;
  customColor?: string;
  isPopoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onSetCommitCount: (count: number) => void;
  onCellMouseDown?: (week: number, day: number) => void;
  onCellMouseEnter?: (week: number, day: number) => void;
  onCellContextMenu?: (e: React.MouseEvent, week: number, day: number) => void;
}

export default function GraphCell({
  week,
  day,
  dateStr,
  realCount,
  queuedCount = 0,
  isPopoverOpen,
  onPopoverOpenChange,
  onSetCommitCount,
  onCellMouseDown,
  onCellMouseEnter,
  onCellContextMenu,
}: GraphCellProps) {
  const [localCount, setLocalCount] = useState<number>(queuedCount || 3);

  useEffect(() => {
    if (queuedCount > 0) {
      setLocalCount(queuedCount);
    }
  }, [queuedCount]);

  // Monkeytype forest theme level colors
  const getLevelColor = (count: number) => {
    if (count <= 0) return '#141d14';
    if (count <= 3) return '#234226';
    if (count <= 6) return '#36683b';
    if (count <= 9) return '#5ca162';
    return '#8cd48f';
  };

  const isQueued = queuedCount > 0;
  const baseColor = getLevelColor(realCount);

  // Formatted date string in lowercase
  const dateObj = dateStr ? new Date(`${dateStr}T00:00:00Z`) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).toLowerCase()
    : `week ${week + 1}, day ${day}`;

  const tooltipText = isQueued
    ? `${queuedCount} queued (${realCount} real) on ${formattedDate}`
    : `${realCount} contribution${realCount === 1 ? '' : 's'} on ${formattedDate}`;

  const handleApplyCount = (countToApply: number) => {
    onSetCommitCount(countToApply);
    onPopoverOpenChange(false);
  };

  const handleClearCell = () => {
    onSetCommitCount(0);
    onPopoverOpenChange(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <button
                  type="button"
                  onMouseDown={(e) => {
                    if (e.button === 0) {
                      onCellMouseDown?.(week, day);
                    }
                  }}
                  onMouseEnter={() => {
                    onCellMouseEnter?.(week, day);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onCellContextMenu?.(e, week, day);
                  }}
                  className={`w-[13px] h-[13px] rounded-[3px] transition-all duration-75 relative outline-none cursor-pointer border ${
                    isQueued
                      ? 'border-[#f59e0b] ring-2 ring-[#eab308] z-10 scale-105 shadow-[0_0_8px_rgba(234,179,8,0.7)]'
                      : realCount > 0
                      ? 'border-[#2f5533] hover:ring-1 hover:ring-mint hover:scale-110'
                      : 'border-[#1e2b1f] hover:border-[#38543a] hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: isQueued
                      ? realCount > 0
                        ? baseColor
                        : '#b45309'
                      : baseColor,
                  }}
                  aria-label={tooltipText}
                />
              }
            />
          }
        />
        {!isPopoverOpen && (
          <TooltipContent className="bg-panel text-fg border-line text-xs py-1 px-2.5 font-mono shadow-xl z-50">
            {tooltipText}
          </TooltipContent>
        )}
      </Tooltip>

      <PopoverContent
        align="center"
        side="top"
        sideOffset={6}
        className="w-64 p-3.5 bg-panel border-line text-fg shadow-2xl rounded-xl z-50 font-mono"
      >
        <div className="flex flex-col gap-3">
          <div className="border-b border-line pb-2">
            <div className="font-semibold text-mint text-xs">
              {formattedDate}
            </div>
            <div className="text-[11px] text-dim mt-0.5">
              {realCount} existing contributions
              {isQueued && (
                <span className="text-[#f59e0b] font-medium ml-1">
                  ({queuedCount} queued)
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-dim">
              commits to queue:
            </span>
            <div className="flex items-center justify-between bg-canvas border border-line rounded-lg p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLocalCount((prev) => Math.max(0, prev - 1))}
                className="h-7 w-7 text-dim hover:text-fg hover:bg-panel"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>

              <span className="font-mono text-sm font-bold text-mint px-3">
                {localCount}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLocalCount((prev) => Math.min(20, prev + 1))}
                className="h-7 w-7 text-dim hover:text-fg hover:bg-panel"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1 justify-between">
            {[1, 3, 5, 10].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setLocalCount(preset);
                  handleApplyCount(preset);
                }}
                className={`flex-1 py-1 rounded text-[11px] font-mono border transition-all ${
                  localCount === preset
                    ? 'border-mint-strong bg-mint-strong text-canvas font-bold'
                    : 'border-line bg-canvas text-dim hover:text-fg'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-line">
            {isQueued && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearCell}
                className="h-7 text-xs border-line bg-canvas hover:bg-red-950/40 hover:text-red-400 text-dim flex-1 gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>clear</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={() => handleApplyCount(localCount)}
              className="h-7 text-xs bg-mint-strong hover:bg-mint text-canvas font-semibold flex-1 gap-1"
            >
              <Check className="w-3 h-3" />
              <span>apply</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
