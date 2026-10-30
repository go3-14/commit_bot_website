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
import { Button } from '@/components/ui/button';
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
import ToolPanel from '@/components/tools/ToolPanel';
import CommitQueue from '@/components/execution/CommitQueue';
import ExecutionModal from '@/components/execution/ExecutionModal';
import RepoSelector from '@/components/execution/RepoSelector';
import { useGraphStore } from '@/store/graph-store';
import { GitHubUser, ContributionDay, RepoInfo } from '@/types';

interface DashboardClientProps {
  user: GitHubUser | null;
  email: string | null;
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
  email,
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

  // Computed queue stats for Monkeytype top stats card
  const plan = getCommitPlan(year);
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
    setSuccessBanner('commits pushed to github. refreshing data...');
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

  const authorEmail = email || user?.email || (user ? `${user.login}@users.noreply.github.com` : '');

  return (
    <div className="min-h-screen flex flex-col bg-[#111810] text-[#dbead9] font-mono select-none">
      {/* Minimalist Monkeytype Top Navigation Bar */}
      <header className="border-b border-[#263626] bg-[#111810]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo & Main Context Controls */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0 text-[#8cd48f] hover:text-[#99d19c] transition-colors">
              <GitCommit className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight">
                commit-bot<span className="text-[#607b62] text-xs">.web</span>
              </span>
            </Link>

            <div className="h-4 w-px bg-[#263626] hidden sm:block" />

            {/* Target Repo Picker */}
            <div className="hidden md:flex items-center">
              <RepoSelector userLogin={user?.login} initialRepos={initialRepos} />
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#607b62]">year:</span>
              <Select value={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[85px] h-8 text-xs bg-[#111810] border-[#263626] text-[#dbead9] font-mono focus:border-[#374d37]">
                  <SelectValue placeholder="year" />
                </SelectTrigger>
                <SelectContent className="bg-[#182319] border-[#263626] text-[#dbead9] text-xs font-mono">
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()} className="font-mono">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User Profile or Connect GitHub Button */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <div className="flex items-center gap-2 bg-[#182319] border border-[#263626] rounded-lg py-1 px-2.5">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.login}
                      width={18}
                      height={18}
                      className="rounded-full ring-1 ring-[#263626]"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-[#607b62]" />
                  )}
                  <span className="text-xs text-[#dbead9]">
                    @{user.login}
                  </span>
                </div>

                <form method="post" action="/api/auth/logout">
                  <button
                    type="submit"
                    className="text-xs text-[#607b62] hover:text-red-400 px-2.5 py-1 rounded-md bg-[#182319] border border-[#263626] flex items-center gap-1 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-3 h-3" />
                    <span className="hidden sm:inline">logout</span>
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/api/auth/github"
                className="text-xs font-bold text-[#111810] bg-[#99d19c] hover:bg-[#8cd48f] px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>connect github</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full flex flex-col gap-5">
        {/* Mobile Repo Selector */}
        <div className="flex md:hidden items-center justify-between p-3 rounded-xl border border-[#263626] bg-[#182319]">
          <RepoSelector userLogin={user?.login} initialRepos={initialRepos} />
        </div>

        {authError && (
          <div role="alert" className="p-3 rounded-xl bg-[#182319] border border-red-500/40 text-red-400 text-xs">
            {authError}
          </div>
        )}

        {/* Execution Success Notification */}
        {successBanner && (
          <div className="p-3 rounded-xl bg-[#182319] border border-[#8cd48f]/50 text-[#8cd48f] text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Monkeytype User Profile & Stats Header Card */}
        <section className="w-full bg-[#182319] border border-[#263626] rounded-xl p-5 flex flex-wrap items-center justify-between gap-6">
          {/* Left: User Identity */}
          <div className="flex items-center gap-3.5">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.login}
                width={44}
                height={44}
                className="rounded-full ring-2 ring-[#263626]"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#111810] border border-[#263626] flex items-center justify-center text-[#607b62]">
                <UserIcon className="w-5 h-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#dbead9]">
                {user ? `@${user.login}` : 'guest session'}
              </span>
              <span className="text-xs text-[#607b62]">
                {user ? (authorEmail || 'github authenticated') : 'interactive canvas (login to execute)'}
              </span>
            </div>
          </div>

          {/* Right: Monkeytype Stat Columns */}
          <div className="flex items-center gap-8 sm:gap-12">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#607b62] lowercase tracking-wide">queued commits</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#8cd48f]">{totalCommits}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-[#607b62] lowercase tracking-wide">active dates</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#8cd48f]">{totalDates}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-[#607b62] lowercase tracking-wide">api calls</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#8cd48f]">{estimatedApiCalls}</span>
            </div>
          </div>
        </section>

        {/* The Hero: GitHub Contribution Heatmap */}
        <section className="w-full flex flex-col items-center">
          {isLoadingGraph && (
            <div className="text-xs text-[#607b62] animate-pulse mb-1">
              synchronizing contribution data...
            </div>
          )}
          <ContributionGraph realData={graphData} year={year} />
        </section>

        {/* Tool Strip Toolbar */}
        <section className="w-full">
          <ToolPanel />
        </section>

        {/* Commit Queue Action Bar */}
        <section className="w-full mt-auto">
          <CommitQueue onExecute={handleExecuteClick} />
        </section>

        {/* Execution Streaming Modal (when authed) */}
        {user && (
          <ExecutionModal
            isOpen={isExecutionModalOpen}
            onClose={() => setIsExecutionModalOpen(false)}
            userName={user.name || user.login}
            userEmail={authorEmail}
            onSuccess={handleExecutionSuccess}
          />
        )}

        {/* Auth prompt modal if unauthenticated user clicks Execute */}
        <Dialog open={isAuthPromptOpen} onOpenChange={setIsAuthPromptOpen}>
          <DialogContent className="bg-[#182319] border-[#263626] text-[#dbead9] sm:max-w-md shadow-2xl font-mono">
            <DialogHeader>
              <DialogTitle className="text-[#dbead9] text-base flex items-center gap-2">
                <GithubIcon className="w-4 h-4 text-[#8cd48f]" />
                <span>connect github</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-[#607b62] pt-1">
                commits are stored locally in your browser. connect your github account to push them with backdated timestamps to your repository.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="border-[#263626] pt-2">
              <button
                type="button"
                onClick={() => setIsAuthPromptOpen(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#111810] border border-[#263626] text-[#607b62] hover:text-[#dbead9] transition-all"
              >
                continue painting
              </button>

              <Link
                href="/api/auth/github"
                className="text-xs font-bold text-[#111810] bg-[#99d19c] hover:bg-[#8cd48f] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>connect github</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
