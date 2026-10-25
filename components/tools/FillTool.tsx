'use client';

import React, { useState } from 'react';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useGraphStore } from '@/store/graph-store';
import { yearGridToDate } from '@/lib/core/grid-mapper';

export default function FillTool() {
  const { year, applyBulkCells } = useGraphStore();

  const [minCommits, setMinCommits] = useState<number>(1);
  const [maxCommits, setMaxCommits] = useState<number>(4);
  const [weekdaysOnly, setWeekdaysOnly] = useState<boolean>(false);
  const [skipWeekends, setSkipWeekends] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleFill = () => {
    const entries: { week: number; day: number; count: number }[] = [];
    const min = Math.max(1, minCommits);
    const max = Math.max(min, maxCommits);

    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const date = yearGridToDate(week, day, year);
        // Only fill days that fall within the target year
        if (date.getFullYear() !== year) continue;

        // day 0 = Sunday, day 6 = Saturday
        if ((weekdaysOnly || skipWeekends) && (day === 0 || day === 6)) {
          continue;
        }

        // Random commits between min and max
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        entries.push({ week, day, count });
      }
    }

    applyBulkCells(entries);
    const totalCommits = entries.reduce((sum, e) => sum + e.count, 0);
    setFeedback(`Queued ${totalCommits.toLocaleString()} commits across ${entries.length} dates for ${year}!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const estimatedDays = weekdaysOnly || skipWeekends ? 260 : 365;
  const estimatedMin = estimatedDays * minCommits;
  const estimatedMax = estimatedDays * maxCommits;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-[#0d1117] border border-[#30363d]/80">
      <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
        <span className="text-xs font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#39d353]" />
          <span>Full Year Fill Generator</span>
        </span>

        {feedback && (
          <span className="text-xs text-[#39d353] font-medium flex items-center gap-1 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>{feedback}</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="w-[120px]">
          <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
            Min Commits / Day
          </label>
          <Input
            type="number"
            min={1}
            max={10}
            value={minCommits}
            onChange={(e) => setMinCommits(Math.max(1, parseInt(e.target.value || '1', 10)))}
            className="h-8 text-xs bg-[#161b22] border-[#30363d] text-white font-mono"
          />
        </div>

        <div className="w-[120px]">
          <label className="text-[11px] text-[#8b949e] font-medium block mb-1">
            Max Commits / Day
          </label>
          <Input
            type="number"
            min={minCommits}
            max={15}
            value={maxCommits}
            onChange={(e) => setMaxCommits(Math.max(minCommits, parseInt(e.target.value || '1', 10)))}
            className="h-8 text-xs bg-[#161b22] border-[#30363d] text-white font-mono"
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#c9d1d9]">
            <Checkbox
              checked={weekdaysOnly || skipWeekends}
              onCheckedChange={(checked) => {
                setWeekdaysOnly(Boolean(checked));
                setSkipWeekends(Boolean(checked));
              }}
            />
            <span>Weekdays only (Mon–Fri)</span>
          </label>
        </div>

        <div className="flex items-end ml-auto pt-4">
          <Button
            type="button"
            size="sm"
            onClick={handleFill}
            className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs h-8 px-5 font-semibold shadow-md shadow-[#238636]/20"
          >
            Fill Entire {year}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
        <AlertCircle className="w-3.5 h-3.5 text-[#388bfd]" />
        <span>
          Will queue approximately <strong className="text-white">{estimatedMin.toLocaleString()}</strong> to{' '}
          <strong className="text-white">{estimatedMax.toLocaleString()}</strong> commits across ~{estimatedDays} dates.
        </span>
      </div>
    </div>
  );
}
