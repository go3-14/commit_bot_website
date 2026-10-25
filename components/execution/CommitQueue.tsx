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

  return (
    <div className="w-full border-t border-[#30363d] pt-4 mt-2">
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border border-[#30363d] bg-[#161b22] shadow-lg">
        {/* Left: Queue Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {totalCommits > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  Queued: <span className="text-orange-400 font-bold">{totalCommits.toLocaleString()}</span> commit{totalCommits === 1 ? '' : 's'} across{' '}
                  <span className="text-orange-400 font-bold">{totalDates}</span> date{totalDates === 1 ? '' : 's'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#8b949e] font-mono bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                <Clock className="w-3 h-3 text-[#388bfd]" />
                <span>~{estimatedApiCalls.toLocaleString()} calls</span>
              </div>

              {isHighApiUsage && (
                <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/60 border border-amber-600/50 px-2 py-0.5 rounded font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Approaching 5,000/hr limit</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
              <span className="w-2 h-2 rounded-full bg-[#30363d]" />
              <span>0 commits queued · Click or drag on any heatmap cell to begin painting</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {totalCommits > 0 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs h-8 px-2.5 gap-1.5"
              >
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">{showPreview ? 'Hide Timeline' : 'Timeline Details'}</span>
                {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearQueue}
                className="border-[#30363d] bg-[#21262d] hover:bg-[#da3633]/20 hover:text-[#f85149] hover:border-[#da3633]/50 text-[#c9d1d9] text-xs h-8 px-2.5 gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </Button>
            </>
          )}

          <Button
            type="button"
            size="sm"
            onClick={onExecute}
            disabled={disabled || totalCommits === 0 || !selectedRepo}
            className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs h-8 px-4 font-semibold gap-1.5 shadow-md shadow-[#238636]/25 disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Execute Commits</span>
          </Button>
        </div>
      </div>

      {/* Expandable Timeline List */}
      {showPreview && totalCommits > 0 && (
        <div className="mt-3 p-3 rounded-xl border border-[#30363d] bg-[#161b22] animate-in fade-in">
          <div className="text-xs font-semibold text-white mb-2 flex items-center justify-between">
            <span>Commit Queue Timeline ({plan.length} dates)</span>
            <span className="text-[#8b949e] font-mono text-[11px]">Sorted chronologically</span>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-[#30363d] bg-[#0d1117] p-2 divide-y divide-[#30363d]/50">
            {plan.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 px-2 text-xs font-mono">
                <span className="text-[#c9d1d9]">
                  {item.date.toISOString().split('T')[0]} ({item.date.toLocaleDateString('en-US', { weekday: 'short' })})
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-950/70 border border-orange-500/40 text-orange-400 font-semibold text-[11px]">
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
