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
        if (date.getUTCFullYear() !== year) continue;
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

    setFeedback(`${totalCommits - remaining} commits queued on ${entries.length} days.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-canvas border border-line font-mono">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="text-xs text-fg flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-mint" />
          <span>random</span>
        </span>

        {feedback && (
          <span className="text-xs text-mint flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>{feedback}</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="w-[130px]">
          <label className="text-[11px] text-dim block mb-1">
            total commits
          </label>
          <Input
            type="number"
            min={1}
            max={2000}
            value={totalCommits}
            onChange={(e) => setTotalCommits(Math.max(1, parseInt(e.target.value || '1', 10)))}
            className="h-8 text-xs bg-panel border-line text-fg font-mono focus:border-line-strong"
          />
        </div>

        <div className="w-[130px]">
          <label className="text-[11px] text-dim block mb-1">
            max commits / day
          </label>
          <Input
            type="number"
            min={1}
            max={10}
            value={maxPerDay}
            onChange={(e) => setMaxPerDay(Math.max(1, parseInt(e.target.value || '1', 10)))}
            className="h-8 text-xs bg-panel border-line text-fg font-mono focus:border-line-strong"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-dim">
            <Checkbox
              checked={weekdaysOnly}
              onCheckedChange={(checked) => setWeekdaysOnly(Boolean(checked))}
            />
            <span>weekdays only</span>
          </label>
        </div>

        <div className="flex items-end ml-auto pt-4">
          <Button
            type="button"
            size="sm"
            onClick={handleScatter}
            className="bg-mint-strong hover:bg-mint text-canvas text-xs h-8 px-4 font-bold"
          >
            scatter {totalCommits}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-dim">
        <AlertCircle className="w-3.5 h-3.5 text-dim" />
        <span>
          scatters commits across random dates in {year}.
        </span>
      </div>
    </div>
  );
}
