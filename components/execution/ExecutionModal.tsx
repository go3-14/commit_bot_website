'use client';

import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Loader2, 
  GitCommit, 
  AlertTriangle 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGraphStore } from '@/store/graph-store';
import { ExecutionProgress } from '@/types';

interface ExecutionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

/** Mounted only while open, so every open starts at the confirm step. */
export default function ExecutionModal({ onClose, onSuccess }: ExecutionModalProps) {
  const { getCommitPlan, selectedRepo, clearQueue } = useGraphStore();
  const plan = getCommitPlan();
  const planTotal = plan.reduce((sum, p) => sum + p.count, 0);

  const [status, setStatus] = useState<'confirm' | 'executing' | 'success' | 'error'>('confirm');
  const [completed, setCompleted] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [lastSha, setLastSha] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleClose = () => {
    if (status === 'executing') {
      if (confirm('Commits are still being created. Stop now? Commits made so far will be kept.')) {
        abortControllerRef.current?.abort();
        onClose();
      }
    } else {
      onClose();
    }
  };

  const runExecution = async () => {
    if (planTotal === 0 || !selectedRepo) {
      setErrorMsg('No commits queued or no repository selected.');
      setStatus('error');
      return;
    }

    setStatus('executing');
    setTotal(planTotal);
    setCompleted(0);
    setErrorMsg(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          config: { repo: selectedRepo.repo },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Server rejected execution request');
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawJson = line.slice(6).trim();
            if (!rawJson) continue;

            const data = JSON.parse(rawJson);

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.done) {
              setStatus('success');
              clearQueue();
              onSuccess?.();
              return;
            }

            const p = data as ExecutionProgress;
            setCompleted(p.completed);
            setTotal(p.total);
            setCurrentDate(p.currentDate);
            if (p.sha) setLastSha(p.sha);
          }
        }
      }

      setStatus('success');
      clearQueue();
      onSuccess?.();
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        setErrorMsg('Execution cancelled by user');
      } else {
        const message = err instanceof Error ? err.message : 'Unknown execution error occurred';
        setErrorMsg(message);
      }
      setStatus('error');
    }
  };

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const repoUrl = selectedRepo
    ? `https://github.com/${selectedRepo.owner}/${selectedRepo.repo}`
    : '#';

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-panel border-line text-fg sm:max-w-md shadow-2xl font-mono">
        <DialogHeader>
          <DialogTitle className="text-fg text-base font-mono flex items-center gap-2">
            {status === 'executing' && (
              <>
                <Loader2 className="w-4 h-4 text-mint animate-spin" />
                <span>creating commits</span>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-mint" />
                <span className="text-mint">done</span>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400">failed</span>
              </>
            )}
            {status === 'confirm' && <span>push commits</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 flex flex-col gap-4 font-mono">
          {status === 'confirm' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1.5 bg-canvas p-3 rounded-lg border border-line">
                <div className="flex justify-between">
                  <span className="text-dim">repository</span>
                  <span className="text-fg">{selectedRepo?.owner}/{selectedRepo?.repo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dim">branch</span>
                  <span className="text-fg">{selectedRepo?.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dim">commits</span>
                  <span className="text-mint font-bold">{planTotal} on {plan.length} days</span>
                </div>
              </div>
              <p className="text-dim text-[11px]">
                Commits are added to the default branch with backdated timestamps and cannot be undone from here.
              </p>
            </div>
          )}

          {status === 'executing' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-dim">progress:</span>
                <span className="text-mint font-bold">{percentage}%</span>
              </div>

              <Progress value={percentage} className="h-2 bg-canvas" />

              <div className="flex flex-col gap-1.5 text-xs bg-canvas p-3 rounded-lg border border-line">
                <div className="flex justify-between">
                  <span className="text-dim">commits:</span>
                  <span className="text-fg">
                    {completed} / {total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dim">current date:</span>
                  <span className="text-mint font-bold">{currentDate || '-'}</span>
                </div>
                {lastSha && (
                  <div className="flex justify-between">
                    <span className="text-dim">latest sha:</span>
                    <span className="text-dim">{lastSha.slice(0, 7)}</span>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-dim text-center">
                Keep this tab open until it finishes.
              </span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-canvas border border-line text-xs text-mint flex flex-col gap-1">
                <span className="font-bold">
                  pushed {completed} backdated commit{completed === 1 ? '' : 's'}
                </span>
                <span className="text-dim">target repository: <strong className="text-fg">{selectedRepo?.repo}</strong></span>
              </div>

              <div className="text-xs text-dim flex items-start gap-2 bg-canvas p-3 rounded-lg border border-line">
                <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
                <span>
                  The contribution graph on github can take a few minutes to update.
                </span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 rounded-lg bg-canvas border border-red-900/60 text-xs text-red-300 flex flex-col gap-2">
              <span className="font-bold text-red-400">something went wrong</span>
              <p className="text-[11px] text-red-300">{errorMsg}</p>
              <span className="text-dim text-[11px]">
                Some commits may already be pushed. Check the repository before retrying.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="border-line pt-2">
          {status === 'confirm' && (
            <div className="flex items-center gap-2 justify-end w-full">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs px-3 py-1.5 rounded-lg bg-canvas border border-line text-dim hover:text-fg transition-colors"
              >
                cancel
              </button>
              <Button
                type="button"
                size="sm"
                onClick={runExecution}
                className="bg-mint-strong hover:bg-mint text-canvas text-xs font-bold px-4"
              >
                push {planTotal} commit{planTotal === 1 ? '' : 's'}
              </Button>
            </div>
          )}

          {status === 'executing' && (
            <button
              type="button"
              onClick={handleClose}
              className="text-xs px-3 py-1.5 rounded-lg bg-canvas border border-line text-dim hover:text-red-400 transition-all"
            >
              cancel
            </button>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 w-full justify-between">
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-dim hover:text-mint flex items-center gap-1 transition-all"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>view on github</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <Button
                type="button"
                size="sm"
                onClick={handleClose}
                className="bg-mint-strong hover:bg-mint text-canvas text-xs font-bold px-4"
              >
                close
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 justify-end w-full">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs px-3 py-1.5 rounded-lg bg-canvas border border-line text-dim hover:text-fg"
              >
                dismiss
              </button>
              <Button
                type="button"
                size="sm"
                onClick={runExecution}
                className="bg-mint-strong hover:bg-mint text-canvas text-xs font-bold px-4"
              >
                retry
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
