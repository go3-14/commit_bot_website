'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GitCommit, 
  LogOut, 
  CheckCircle2,
  ArrowRight,
  User as UserIcon
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import ContributionGraph from '@/components/graph/ContributionGraph';
import YearInsights from '@/components/graph/YearInsights';
import ToolPanel from '@/components/tools/ToolPanel';
import CommitQueue from '@/components/execution/CommitQueue';
import ExecutionModal from '@/components/execution/ExecutionModal';
import RepoSelector from '@/components/execution/RepoSelector';
import NoticeDialog from '@/components/NoticeDialog';
import { useGraphStore } from '@/store/graph-store';
import { GitHubUser, ContributionDay, RepoInfo } from '@/types';

interface DashboardClientProps {
  user: GitHubUser | null;
  initialGraph: ContributionDay[][];
  initialRepos: RepoInfo[];
  currentYear: number;
  authError?: string | null;
}

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export default function DashboardClient({
  user,
  initialGraph,
  initialRepos,
  currentYear,
  authError = null,
}: DashboardClientProps) {
  const { year, setYear, setSelectedRepo, getCommitPlan } = useGraphStore();
  const [graphData, setGraphData] = useState<ContributionDay[][]>(initialGraph);
  const [isLoadingGraph, setIsLoadingGraph] = useState<boolean>(false);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState<boolean>(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync initial repo and year to store
  useEffect(() => {
    setYear(currentYear);
    if (user && initialRepos[0]) {
      setSelectedRepo({
        owner: user.login,
        repo: initialRepos[0].name,
        branch: initialRepos[0].defaultBranch || 'main',
      });
    }
  }, [currentYear, initialRepos, user, setYear, setSelectedRepo]);

  // Available years: current year down to 6 years back
  const years = Array.from({ length: 7 }, (_, i) => currentYear - i);

  const plan = getCommitPlan();
  const totalCommits = plan.reduce((sum, item) => sum + item.count, 0);
  const totalDates = plan.length;
  const estimatedApiCalls = totalCommits > 0 ? totalCommits * 4 + 1 : 0;

  // Refetch contribution graph
  const refetchGraph = async (targetYear: number) => {
    if (!user) return;
    setIsLoadingGraph(true);
    try {
      const res = await fetch(`/api/me?year=${targetYear}`);
      if (res.ok) {
        const data = await res.json();
        if (data.graph) {
          setGraphData(data.graph);
        }
      }
    } catch (err) {
      console.error('Failed to refetch graph data:', err);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  // Handle year switch
  const handleYearChange = async (newYearStr: string | null) => {
    if (!newYearStr) return;
    const newYear = parseInt(newYearStr, 10);
    setYear(newYear);
    await refetchGraph(newYear);
  };

  const handleExecutionSuccess = async () => {
    setSuccessBanner('Commits pushed. GitHub can take a few minutes to update the graph.');
    await refetchGraph(year);
    setTimeout(() => setSuccessBanner(null), 8000);
  };

  const handleExecuteClick = () => {
    if (!user) {
      setIsAuthPromptOpen(true);
    } else {
      setIsExecutionModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-fg">
      <header className="border-b border-line bg-canvas/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0 text-mint hover:text-mint-strong transition-colors">
              <GitCommit className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">phakeit</span>
            </Link>

            <div className="h-4 w-px bg-line hidden md:block" />

            <div className="hidden md:flex items-center">
              <RepoSelector userLogin={user?.login} initialRepos={initialRepos} />
            </div>

            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[84px] h-8 text-xs bg-canvas border-line text-fg font-mono focus:border-line-strong">
                <SelectValue placeholder="year" />
              </SelectTrigger>
              <SelectContent className="bg-panel border-line text-fg text-xs font-mono">
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()} className="font-mono">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <div className="flex items-center gap-2 py-1 px-2.5 text-xs text-fg">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="rounded-full ring-1 ring-line-strong"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-dim" />
                  )}
                  <span className="hidden sm:inline">{user.login}</span>
                </div>

                <form method="post" action="/api/auth/logout">
                  <button
                    type="submit"
                    className="text-xs text-dim hover:text-danger px-2.5 py-1.5 rounded-md border border-line flex items-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span className="hidden sm:inline">sign out</span>
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/api/auth/github"
                className="text-xs font-bold text-canvas bg-mint-strong hover:bg-mint px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>sign in with github</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full flex flex-col justify-center gap-5">
        <div className="flex md:hidden">
          <RepoSelector userLogin={user?.login} initialRepos={initialRepos} />
        </div>

        {authError && (
          <div role="alert" className="px-3 py-2 rounded-lg bg-panel border border-danger/40 text-danger text-xs">
            {authError}
          </div>
        )}

        {successBanner && (
          <div role="status" className="px-3 py-2 rounded-lg bg-panel border border-mint/40 text-mint text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-1 px-1">
          <div className="flex items-baseline gap-2">
            <dd className="text-2xl font-bold text-mint tabular-nums">{totalCommits}</dd>
            <dt className="text-xs text-dim">queued commits</dt>
          </div>
          <div className="flex items-baseline gap-2">
            <dd className="text-2xl font-bold text-fg tabular-nums">{totalDates}</dd>
            <dt className="text-xs text-dim">{totalDates === 1 ? "day" : "days"}</dt>
          </div>
          <div className="flex items-baseline gap-2">
            <dd className="text-2xl font-bold text-fg tabular-nums">{estimatedApiCalls}</dd>
            <dt className="text-xs text-dim">api calls</dt>
          </div>
        </dl>

        <section className="w-full" aria-busy={isLoadingGraph}>
          <ContributionGraph realData={graphData} year={year} />
        </section>

        <ToolPanel />

        <CommitQueue onExecute={handleExecuteClick} />

        {user && <YearInsights data={graphData} year={year} />}

        <NoticeDialog />

        {user && isExecutionModalOpen && (
          <ExecutionModal
            onClose={() => setIsExecutionModalOpen(false)}
            onSuccess={handleExecutionSuccess}
          />
        )}

        <Dialog open={isAuthPromptOpen} onOpenChange={setIsAuthPromptOpen}>
          <DialogContent className="bg-panel border-line text-fg sm:max-w-md shadow-2xl font-mono">
            <DialogHeader>
              <DialogTitle className="text-fg text-base flex items-center gap-2">
                <GithubIcon className="w-4 h-4 text-mint" />
                <span>sign in to push commits</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-dim pt-1">
                Your painted days stay in this browser. Sign in with github to create the commits in one of your repositories.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="border-line pt-2">
              <button
                type="button"
                onClick={() => setIsAuthPromptOpen(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-canvas border border-line text-dim hover:text-fg transition-colors"
              >
                keep painting
              </button>

              <Link
                href="/api/auth/github"
                className="text-xs font-bold text-canvas bg-mint-strong hover:bg-mint px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <span>sign in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
