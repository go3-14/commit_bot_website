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
        if (date.getUTCFullYear() !== year) continue;

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
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-[#111810] border border-[#263626] font-mono">
      <div className="flex items-center justify-between border-b border-[#263626] pb-3">
        <span className="text-xs text-[#dbead9] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8cd48f]" />
          <span>fill year generator</span>
        </span>

        {feedback && (
          <span className="text-xs text-[#8cd48f] flex items-center gap-1 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>{feedback}</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="w-[120px]">
          <label className="text-[11px] text-[#607b62] block mb-1">
            min commits / day
          </label>
          <Input
            type="number"
            min={1}
            max={10}
            value={minCommits}
            onChange={(e) => setMinCommits(Math.max(1, parseInt(e.target.value || '1', 10)))}
            className="h-8 text-xs bg-[#182319] border-[#263626] text-[#dbead9] font-mono focus:border-[#374d37]"
          />
        </div>

        <div className="w-[120px]">
          <label className="text-[11px] text-[#607b62] block mb-1">
            max commits / day
          </label>
          <Input
            type="number"
            min={minCommits}
            max={15}
            value={maxCommits}
            onChange={(e) => setMaxCommits(Math.max(minCommits, parseInt(e.target.value || '1', 10)))}
            className="h-8 text-xs bg-[#182319] border-[#263626] text-[#dbead9] font-mono focus:border-[#374d37]"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#607b62]">
            <Checkbox
              checked={weekdaysOnly || skipWeekends}
              onCheckedChange={(checked) => {
                setWeekdaysOnly(Boolean(checked));
                setSkipWeekends(Boolean(checked));
              }}
            />
            <span>weekdays only (mon-fri)</span>
          </label>
        </div>

        <div className="flex items-end ml-auto pt-4">
          <Button
            type="button"
            size="sm"
            onClick={handleFill}
            className="bg-[#99d19c] hover:bg-[#8cd48f] text-[#111810] text-xs h-8 px-4 font-bold"
          >
            fill {year}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#607b62]">
        <AlertCircle className="w-3.5 h-3.5 text-[#607b62]" />
        <span>
          queues ~<strong className="text-[#8cd48f]">{estimatedMin}</strong> to{' '}
          <strong className="text-[#8cd48f]">{estimatedMax}</strong> commits across ~{estimatedDays} dates.
        </span>
      </div>
    </div>
  );
}
