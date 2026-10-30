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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-[#182319] border-[#263626] text-[#dbead9] sm:max-w-md shadow-2xl font-mono">
        <DialogHeader>
          <DialogTitle className="text-[#dbead9] text-base font-mono flex items-center gap-2">
            {status === 'executing' && (
              <>
                <Loader2 className="w-4 h-4 text-[#8cd48f] animate-spin" />
                <span>creating commits...</span>
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#8cd48f]" />
                <span className="text-[#8cd48f]">execution complete</span>
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400">execution error</span>
              </>
            )}
            {status === 'idle' && <span>preparing execution...</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 flex flex-col gap-4 font-mono">
          {status === 'executing' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#607b62]">progress:</span>
                <span className="text-[#8cd48f] font-bold">{percentage}%</span>
              </div>

              <Progress value={percentage} className="h-2 bg-[#111810]" />

              <div className="flex flex-col gap-1.5 text-xs bg-[#111810] p-3 rounded-lg border border-[#263626]">
                <div className="flex justify-between">
                  <span className="text-[#607b62]">commits:</span>
                  <span className="text-[#dbead9]">
                    {completed} / {total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#607b62]">current date:</span>
                  <span className="text-[#8cd48f] font-bold">{currentDate || '-'}</span>
                </div>
                {lastSha && (
                  <div className="flex justify-between">
                    <span className="text-[#607b62]">latest sha:</span>
                    <span className="text-[#607b62]">{lastSha.slice(0, 7)}</span>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-[#607b62] text-center">
                keep this tab open while commits are being chained to github.
              </span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-[#111810] border border-[#263626] text-xs text-[#8cd48f] flex flex-col gap-1">
                <span className="font-bold">
                  successfully pushed {completed} backdated commit{completed === 1 ? '' : 's'}
                </span>
                <span className="text-[#607b62]">target repository: <strong className="text-[#dbead9]">{selectedRepo?.repo}</strong></span>
              </div>

              <div className="text-xs text-[#607b62] flex items-start gap-2 bg-[#111810] p-3 rounded-lg border border-[#263626]">
                <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />
                <span>
                  note: github contribution graph may take a few minutes to index and display your new commits.
                </span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 rounded-lg bg-[#111810] border border-red-900/60 text-xs text-red-300 flex flex-col gap-2">
              <span className="font-bold text-red-400">execution failed</span>
              <p className="text-[11px] text-red-300">{errorMsg}</p>
              <span className="text-[#607b62] text-[11px]">
                queued commits are preserved so you can retry.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="border-[#263626] pt-2">
          {status === 'executing' && (
            <button
              type="button"
              onClick={handleClose}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#111810] border border-[#263626] text-[#607b62] hover:text-red-400 transition-all"
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
                className="text-xs text-[#607b62] hover:text-[#8cd48f] flex items-center gap-1 transition-all"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>view on github</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <Button
                type="button"
                size="sm"
                onClick={handleClose}
                className="bg-[#99d19c] hover:bg-[#8cd48f] text-[#111810] text-xs font-bold px-4"
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
                className="text-xs px-3 py-1.5 rounded-lg bg-[#111810] border border-[#263626] text-[#607b62] hover:text-[#dbead9]"
              >
                dismiss
              </button>
              <Button
                type="button"
                size="sm"
                onClick={runExecution}
                className="bg-[#99d19c] hover:bg-[#8cd48f] text-[#111810] text-xs font-bold px-4"
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
