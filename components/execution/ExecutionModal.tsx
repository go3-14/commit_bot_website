'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
  onSuccess?: () => void;
}

export default function ExecutionModal({
  isOpen,
  onClose,
  userEmail,
  userName,
  onSuccess,
}: ExecutionModalProps) {
  const { year, getCommitPlan, selectedRepo, clearQueue } = useGraphStore();

  const [status, setStatus] = useState<'idle' | 'executing' | 'success' | 'error'>('idle');
  const [completed, setCompleted] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [lastSha, setLastSha] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // When modal opens, kick off execution
  useEffect(() => {
    if (isOpen && status === 'idle') {
      runExecution();
    }
  }, [isOpen]);

  const handleClose = () => {
    if (status === 'executing') {
      if (confirm('A commit execution is in progress. Are you sure you want to cancel?')) {
        abortControllerRef.current?.abort();
        setStatus('idle');
        onClose();
      }
    } else {
      setStatus('idle');
      setCompleted(0);
      setTotal(0);
      setCurrentDate('');
      setErrorMsg(null);
      onClose();
    }
  };

  const runExecution = async () => {
    const plan = getCommitPlan(year);
    const planTotal = plan.reduce((sum, p) => sum + p.count, 0);

    if (planTotal === 0 || !selectedRepo) {
      setErrorMsg('No commits queued or no repository selected');
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
          config: {
            owner: selectedRepo.owner,
            repo: selectedRepo.repo,
            branch: selectedRepo.branch,
            authorName: userName,
            authorEmail: userEmail,
          },
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-[#161b22] border-[#30363d] text-[#c9d1d9] sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-base font-semibold flex items-center gap-2">
            {status === 'executing' && (
              <>
                <Loader2 className="w-5 h-5 text-[#39d353] animate-spin" />
                <span>Creating Backdated Commits...</span>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#39d353]" />
                <span className="text-white">Execution Complete!</span>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-5 h-5 text-[#f85149]" />
                <span className="text-white">Execution Error</span>
              </>
            )}
            {status === 'idle' && <span>Preparing Execution...</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 flex flex-col gap-4">
          {status === 'executing' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8b949e]">Progress:</span>
                <span className="text-white font-bold">{percentage}%</span>
              </div>

              <Progress value={percentage} className="h-2.5 bg-[#0d1117]" />

              <div className="flex flex-col gap-1.5 text-xs font-mono bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Commits:</span>
                  <span className="text-white font-semibold">
                    {completed} / {total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Current Date:</span>
                  <span className="text-orange-400 font-semibold">{currentDate || '—'}</span>
                </div>
                {lastSha && (
                  <div className="flex justify-between">
                    <span className="text-[#8b949e]">Latest SHA:</span>
                    <span className="text-[#388bfd] font-mono">{lastSha.slice(0, 7)}</span>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-[#8b949e] italic text-center">
                Please do not close this tab while commits are being chained to GitHub.
              </span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-[#0e4429]/40 border border-[#238636] text-xs text-[#3fb950] flex flex-col gap-1">
                <span className="font-semibold text-white">
                  Successfully pushed {completed} backdated commit{completed === 1 ? '' : 's'}!
                </span>
                <span>Target repository: <strong>{selectedRepo?.repo}</strong></span>
              </div>

              <div className="text-xs text-[#8b949e] flex items-start gap-2 bg-[#0d1117] p-3 rounded-lg border border-[#30363d]">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> GitHub contribution graph can take between a few minutes to up to 24 hours to re-index and display your new commits.
                </span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-200 flex flex-col gap-2">
              <span className="font-semibold text-white">Execution failed</span>
              <p className="font-mono text-[11px]">{errorMsg}</p>
              <span className="text-[#8b949e] text-[11px]">
                Your queued commits have been preserved in your editor so you can retry.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="border-[#30363d]">
          {status === 'executing' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="border-[#30363d] bg-[#21262d] hover:bg-[#da3633]/20 hover:text-[#f85149] text-[#c9d1d9] text-xs"
            >
              Cancel Execution
            </Button>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 w-full justify-between">
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#388bfd] hover:underline flex items-center gap-1"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <Button
                type="button"
                size="sm"
                onClick={handleClose}
                className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs"
              >
                Close
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 justify-end w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="border-[#30363d] bg-[#21262d] text-[#c9d1d9] text-xs"
              >
                Dismiss
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={runExecution}
                className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs"
              >
                Retry
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
