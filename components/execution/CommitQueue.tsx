'use client';

import React, { useState } from 'react';
import { 
  Trash2, 
  Play, 
  Calendar, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGraphStore } from '@/store/graph-store';

interface CommitQueueProps {
  onExecute: () => void;
  disabled?: boolean;
}

export default function CommitQueue({ onExecute, disabled = false }: CommitQueueProps) {
  const { queue, clearQueue, year, getCommitPlan, selectedRepo } = useGraphStore();
  const [showPreview, setShowPreview] = useState(false);

  const plan = getCommitPlan(year);
  const totalCommits = plan.reduce((sum, item) => sum + item.count, 0);
  const totalDates = plan.length;
  // Each commit requires 4 GitHub API calls (commit -> blob -> tree -> commit) + 1 final ref update
  const estimatedApiCalls = totalCommits * 4 + 1;
  const isHighApiUsage = estimatedApiCalls > 3500;

  if (totalCommits === 0) {
    return (
      <div className="w-full p-4 rounded-xl border border-[#30363d] bg-[#161b22] text-center text-xs text-[#8b949e]">
        No commits queued yet. Select the <strong className="text-white">Paint</strong> tool to click or drag on the graph, or use <strong className="text-white">Pattern</strong>, <strong className="text-white">Image</strong>, or <strong className="text-white">Fill</strong> tools above.
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-[#30363d] bg-[#161b22] p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Stats summary */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">
              Queued: <span className="text-orange-400">{totalCommits.toLocaleString()}</span> commits across{' '}
              <span className="text-orange-400">{totalDates}</span> dates
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#8b949e] font-mono bg-[#0d1117] px-2.5 py-1 rounded-md border border-[#30363d]">
            <Clock className="w-3.5 h-3.5 text-[#388bfd]" />
            <span>~{estimatedApiCalls.toLocaleString()} API calls</span>
          </div>

          {isHighApiUsage && (
            <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/60 border border-amber-600/50 px-2.5 py-1 rounded-md font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Approaching GitHub hourly limit (5,000)</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs h-8 gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{showPreview ? 'Hide Dates' : 'Preview Dates'}</span>
            {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearQueue}
            className="border-[#30363d] bg-[#21262d] hover:bg-[#da3633]/20 hover:text-[#f85149] hover:border-[#da3633]/50 text-[#c9d1d9] text-xs h-8 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Queue</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onExecute}
            disabled={disabled || totalCommits === 0 || !selectedRepo}
            className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs h-8 font-semibold gap-1.5 shadow-md shadow-[#238636]/25 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute Commits</span>
          </Button>
        </div>
      </div>

      {/* Expandable Preview List */}
      {showPreview && (
        <div className="mt-4 pt-4 border-t border-[#30363d]">
          <div className="text-xs font-semibold text-white mb-2 flex items-center justify-between">
            <span>Commit Timeline Details ({plan.length} dates)</span>
            <span className="text-[#8b949e] font-normal">Sorted chronologically</span>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-[#30363d] bg-[#0d1117] p-2 divide-y divide-[#30363d]/50">
            {plan.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 px-2 text-xs font-mono">
                <span className="text-[#c9d1d9]">
                  {item.date.toISOString().split('T')[0]} ({item.date.toLocaleDateString('en-US', { weekday: 'short' })})
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-950/70 border border-orange-500/40 text-orange-400 font-semibold">
                  {item.count} commit{item.count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
