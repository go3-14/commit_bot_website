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
  customColor,
  isPopoverOpen,
  onPopoverOpenChange,
  onSetCommitCount,
  onCellMouseDown,
  onCellMouseEnter,
  onCellContextMenu,
}: GraphCellProps) {
  const [localCount, setLocalCount] = useState<number>(queuedCount || 3);

  // Sync local count when queuedCount changes
  useEffect(() => {
    if (queuedCount > 0) {
      setLocalCount(queuedCount);
    }
  }, [queuedCount]);

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

  // Formatted date string
  const dateObj = dateStr ? new Date(dateStr) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : `Week ${week + 1}, Day ${day}`;

  const tooltipText = isQueued
    ? `${queuedCount} queued commits (${realCount} existing) on ${formattedDate}`
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
                    // Left click only
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
                  className={`w-[13px] h-[13px] rounded-xs transition-all duration-75 relative outline-none cursor-pointer ${
                    isQueued
                      ? 'ring-2 ring-orange-400 z-10 scale-105 shadow-[0_0_8px_rgba(251,146,60,0.7)]'
                      : 'hover:ring-1 hover:ring-white/50 hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: isQueued
                      ? realCount > 0
                        ? baseColor
                        : '#ea580c'
                      : baseColor,
                  }}
                  aria-label={tooltipText}
                />
              }
            />
          }
        />
        {!isPopoverOpen && (
          <TooltipContent className="bg-[#1f242c] text-white border-[#30363d] text-xs py-1 px-2.5 font-sans shadow-lg z-50">
            {tooltipText}
          </TooltipContent>
        )}
      </Tooltip>

      <PopoverContent
        align="center"
        side="top"
        sideOffset={6}
        className="w-64 p-3.5 bg-[#161b22] border-[#30363d] text-[#c9d1d9] shadow-2xl rounded-xl z-50"
      >
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="border-b border-[#30363d] pb-2">
            <div className="font-semibold text-white text-xs leading-tight">
              {formattedDate}
            </div>
            <div className="text-[11px] text-[#8b949e] mt-0.5">
              {realCount} existing contribution{realCount === 1 ? '' : 's'}
              {isQueued && (
                <span className="text-orange-400 font-medium ml-1">
                  · {queuedCount} queued
                </span>
              )}
            </div>
          </div>

          {/* Stepper Control */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-[#8b949e]">
              Number of Commits to Queue:
            </span>
            <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-lg p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLocalCount((prev) => Math.max(0, prev - 1))}
                className="h-7 w-7 text-[#c9d1d9] hover:text-white hover:bg-[#21262d]"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>

              <span className="font-mono text-sm font-bold text-white px-3">
                {localCount}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setLocalCount((prev) => Math.min(20, prev + 1))}
                className="h-7 w-7 text-[#c9d1d9] hover:text-white hover:bg-[#21262d]"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1 justify-between">
            {[1, 3, 5, 10].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setLocalCount(preset);
                  handleApplyCount(preset);
                }}
                className={`flex-1 py-1 rounded text-[10px] font-mono border transition-all ${
                  localCount === preset
                    ? 'border-[#238636] bg-[#0e4429] text-[#39d353] font-bold'
                    : 'border-[#30363d] bg-[#21262d] text-[#8b949e] hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#30363d]">
            {isQueued && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearCell}
                className="h-7 text-xs border-[#30363d] bg-[#21262d] hover:bg-[#da3633]/20 hover:text-[#f85149] text-[#8b949e] flex-1 gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={() => handleApplyCount(localCount)}
              className="h-7 text-xs bg-[#238636] hover:bg-[#2ea043] text-white font-medium flex-1 gap-1 shadow-sm"
            >
              <Check className="w-3 h-3" />
              <span>Apply</span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
