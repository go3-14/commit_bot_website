'use client';

import React, { useState } from 'react';
import { Shuffle, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useGraphStore } from '@/store/graph-store';
import { yearGridToDate } from '@/lib/core/grid-mapper';

export default function RandomTool() {
  const { year, applyBulkCells } = useGraphStore();

  const [totalCommits, setTotalCommits] = useState<number>(100);
  const [maxPerDay, setMaxPerDay] = useState<number>(4);
  const [weekdaysOnly, setWeekdaysOnly] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleScatter = () => {
    if (totalCommits <= 0) return;

    // Collect all valid (week, day) cells in target year
    const validCells: { week: number; day: number }[] = [];

    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const date = yearGridToDate(week, day, year);
        if (date.getFullYear() !== year) continue;
        if (weekdaysOnly && (day === 0 || day === 6)) continue;
        validCells.push({ week, day });
      }
    }

    if (validCells.length === 0) return;

    // Shuffle valid cells
    const shuffled = [...validCells].sort(() => Math.random() - 0.5);
    const cellMap: Record<string, { week: number; day: number; count: number }> = {};

    let remaining = totalCommits;
    let idx = 0;

    while (remaining > 0 && idx < shuffled.length) {
      const cell = shuffled[idx];
      const key = `${cell.week}-${cell.day}`;

      const countToAdd = Math.min(
        remaining,
        Math.floor(Math.random() * maxPerDay) + 1
      );

      cellMap[key] = {
        week: cell.week,
        day: cell.day,
        count: countToAdd,
      };

      remaining -= countToAdd;
      idx++;
    }

    const entries = Object.values(cellMap);
    applyBulkCells(entries);

    setFeedback(`Randomly scattered ${totalCommits - remaining} commits across ${entries.length} dates!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-[#0d1117] border border-[#30363d]/80">
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <span className="text-xs font-semibold text-white flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-[#39d353]" />
          <span>Random Commit Scatter</span>
        </span>

        {feedback && (
          <span className="text-xs text-[#39d353] font-medium flex items-center gap-1 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>{feedback}</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="w-[140px]">
          <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
            Total Commits
          </label>
          <Input
            type="number"
            min={1}
            max={2000}
            value={totalCommits}
            onChange={(e) => setTotalCommits(Math.max(1, parseInt(e.target.value || '1', 10)))}
            className="h-8 text-xs bg-[#161b22] border-[#30363d] text-white font-mono"
          />
        </div>

        <div className="w-[140px]">
          <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
            Max Commits / Day
          </label>
          <Input
            type="number"
            min={1}
            max={10}
            value={maxPerDay}
            onChange={(e) => setMaxPerDay(Math.max(1, parseInt(e.target.value || '1', 10)))}
            className="h-8 text-xs bg-[#161b22] border-[#30363d] text-white font-mono"
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c9d1d9]">
            <Checkbox
              checked={weekdaysOnly}
              onCheckedChange={(checked) => setWeekdaysOnly(Boolean(checked))}
            />
            <span>Weekdays only</span>
          </label>
        </div>

        <div className="flex items-end ml-auto pt-4">
          <Button
            type="button"
            size="sm"
            onClick={handleScatter}
            className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs h-8 px-5 font-semibold shadow-md shadow-[#238636]/20"
          >
            Scatter {totalCommits} Commits
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
        <AlertCircle className="w-3.5 h-3.5 text-[#388bfd]" />
        <span>
          Distributes commits organically across random dates in {year} with randomized timestamps.
        </span>
      </div>
    </div>
  );
}
