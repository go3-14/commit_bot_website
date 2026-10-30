'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGraphStore } from '@/store/graph-store';

interface CommitQueueProps {
  onExecute: () => void;
  disabled?: boolean;
}

export default function CommitQueue({ onExecute, disabled = false }: CommitQueueProps) {
  const { clearQueue, year, getCommitPlan, selectedRepo } = useGraphStore();
  const [showPreview, setShowPreview] = useState(false);

  const plan = getCommitPlan();
  const totalCommits = plan.reduce((sum, item) => sum + item.count, 0);
  const totalDates = plan.length;
  const estimatedApiCalls = totalCommits * 4 + 1;
  const isHighApiUsage = estimatedApiCalls > 3500;

  return (
    <div className="w-full font-mono select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-line bg-panel">
        {/* Left Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {totalCommits > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
                <span className="text-xs text-fg">
                  queued: <strong className="text-mint">{totalCommits}</strong> commits across{' '}
                  <strong className="text-mint">{totalDates}</strong> dates
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-dim bg-canvas px-2 py-0.5 rounded border border-line">
                <Clock className="w-3 h-3 text-dim" />
                <span>~{estimatedApiCalls} calls</span>
              </div>

              {isHighApiUsage && (
                <div className="flex items-center gap-1 text-[11px] text-[#f59e0b] bg-canvas border border-[#f59e0b]/40 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  <span>high call volume</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-dim">
              <span className="w-2 h-2 rounded-full bg-line" />
              <span>0 commits queued. click or drag on heatmap to paint.</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {totalCommits > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-dim hover:text-fg px-2 py-1 rounded bg-canvas border border-line flex items-center gap-1 transition-all"
              >
                <span>{showPreview ? 'hide list' : 'view list'}</span>
                {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={clearQueue}
                className="text-xs text-dim hover:text-red-400 px-2.5 py-1 rounded bg-canvas border border-line flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" />
                <span>clear</span>
              </button>
            </>
          )}

          <Button
            type="button"
            size="sm"
            onClick={onExecute}
            disabled={disabled || totalCommits === 0 || !selectedRepo}
            className="bg-mint-strong hover:bg-mint text-canvas font-bold text-xs h-8 px-4 rounded-lg gap-1.5 shadow-sm disabled:opacity-30 disabled:bg-line disabled:text-dim"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>execute commits</span>
          </Button>
        </div>
      </div>

      {/* Expandable Timeline List */}
      {showPreview && totalCommits > 0 && (
        <div className="mt-2 p-3 rounded-xl border border-line bg-panel animate-in fade-in">
          <div className="text-xs text-dim mb-2 flex items-center justify-between">
            <span>commit queue ({plan.length} dates)</span>
            <span>chronological</span>
          </div>
          <div className="max-h-44 overflow-y-auto rounded-lg border border-line bg-canvas p-2 divide-y divide-line/60">
            {plan.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 px-2 text-xs font-mono">
                <span className="text-dim">
                  {item.date} ({new Date(`${item.date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toLowerCase()})
                </span>
                <span className="px-2 py-0.5 rounded bg-panel border border-line text-mint font-mono text-[11px]">
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
