'use client';

import React, { useState } from 'react';
import { Play, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGraphStore } from '@/store/graph-store';
import { MAX_COMMITS_PER_RUN } from '@/lib/plan-validation';

interface CommitQueueProps {
  onExecute: () => void;
}

export default function CommitQueue({ onExecute }: CommitQueueProps) {
  const { clearQueue, getCommitPlan, selectedRepo } = useGraphStore();
  const [showList, setShowList] = useState(false);

  const plan = getCommitPlan();
  const totalCommits = plan.reduce((sum, item) => sum + item.count, 0);
  const overLimit = totalCommits > MAX_COMMITS_PER_RUN;

  let hint: string | null = null;
  if (overLimit) hint = `Limit is ${MAX_COMMITS_PER_RUN} commits per run. Remove some days.`;
  else if (totalCommits > 0 && !selectedRepo) hint = 'Select a repository to push to.';

  return (
    <div className="w-full select-none max-sm:sticky max-sm:bottom-3 max-sm:z-30">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-line bg-panel">
        <div className="text-xs">
          {totalCommits > 0 ? (
            <span className="text-fg">
              <strong className="text-mint">{totalCommits}</strong> commits on{' '}
              <strong className="text-mint">{plan.length}</strong> days
              {hint && <span className={overLimit ? 'text-danger ml-3' : 'text-dim ml-3'}>{hint}</span>}
            </span>
          ) : (
            <span className="text-dim">Nothing queued. Click or drag on the graph to paint days.</span>
          )}
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          {totalCommits > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowList(!showList)}
                className="text-xs text-dim hover:text-fg px-2.5 py-2 sm:py-1.5 rounded-md border border-line flex items-center gap-1 transition-colors"
              >
                <span className="whitespace-nowrap">{showList ? 'hide days' : 'show days'}</span>
                {showList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={clearQueue}
                className="text-xs text-dim hover:text-danger px-2.5 py-2 sm:py-1.5 rounded-md border border-line flex items-center gap-1 transition-colors"
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
            disabled={totalCommits === 0 || overLimit || !selectedRepo}
            className="max-sm:flex-1 bg-mint-strong hover:bg-mint text-canvas font-bold text-xs h-10 sm:h-8 px-4 rounded-lg gap-1.5 disabled:opacity-40 disabled:bg-line disabled:text-dim"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>push commits</span>
          </Button>
        </div>
      </div>

      {showList && totalCommits > 0 && (
        <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-line bg-panel p-2 divide-y divide-line">
          {plan.map((item) => (
            <div key={item.date} className="flex items-center justify-between py-1 px-2 text-xs">
              <span className="text-dim">
                {item.date}{' '}
                {new Date(`${item.date}T00:00:00Z`)
                  .toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
                  .toLowerCase()}
              </span>
              <span className="text-mint">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
