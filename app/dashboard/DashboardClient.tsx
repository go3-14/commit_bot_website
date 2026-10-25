'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GitCommit, 
  LogOut, 
  Calendar, 
  CheckCircle2,
  Mail
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ContributionGraph from '@/components/graph/ContributionGraph';
import ToolPanel from '@/components/tools/ToolPanel';
import CommitQueue from '@/components/execution/CommitQueue';
import ExecutionModal from '@/components/execution/ExecutionModal';
import RepoSelector from '@/components/execution/RepoSelector';
import { useGraphStore } from '@/store/graph-store';
import { GitHubUser, ContributionDay, RepoInfo } from '@/types';

interface DashboardClientProps {
  user: GitHubUser;
  email: string;
  initialGraph: ContributionDay[][];
  initialRepos: RepoInfo[];
  currentYear: number;
}

export default function DashboardClient({
  user,
  email,
  initialGraph,
  initialRepos,
  currentYear,
}: DashboardClientProps) {
  const { year, setYear, setSelectedRepo } = useGraphStore();
  const [graphData, setGraphData] = useState<ContributionDay[][]>(initialGraph);
  const [isLoadingGraph, setIsLoadingGraph] = useState<boolean>(false);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync initial repo and year to store
  useEffect(() => {
    setYear(currentYear);
    if (initialRepos[0]) {
      setSelectedRepo({
        owner: user.login,
        repo: initialRepos[0].name,
        branch: initialRepos[0].defaultBranch || 'main',
      });
    }
  }, [currentYear, initialRepos, user.login, setYear, setSelectedRepo]);

  // Available years: current year down to 6 years back
  const years = Array.from({ length: 7 }, (_, i) => currentYear - i);

  // Refetch contribution graph
  const refetchGraph = async (targetYear: number) => {
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
    setSuccessBanner('Commits successfully pushed to GitHub! Refreshing contribution data...');
    await refetchGraph(year);
    setTimeout(() => setSuccessBanner(null), 8000);
  };

  const authorEmail = email || user.email || `${user.login}@users.noreply.github.com`;

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9]">
      {/* Sticky Top Header */}
      <header className="border-b border-[#30363d] bg-[#161b22]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Main Context Controls */}
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#238636] flex items-center justify-center text-white shadow-md shadow-[#238636]/20">
                <GitCommit className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-white hidden sm:inline-flex items-center gap-1">
                commit-bot<span className="text-[#39d353] font-mono text-xs">.web</span>
              </span>
            </Link>

            <div className="h-5 w-px bg-[#30363d] hidden sm:block" />

            {/* Target Repo Picker */}
            <div className="hidden md:flex items-center">
              <RepoSelector userLogin={user.login} initialRepos={initialRepos} />
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8b949e]" />
              <Select value={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[100px] h-8 text-xs bg-[#0d1117] border-[#30363d] text-white font-mono">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d] text-white text-xs font-mono">
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Author Email Pill */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#8b949e] font-mono bg-[#0d1117] px-2.5 py-1 rounded-full border border-[#30363d]">
              <Mail className="w-3 h-3 text-[#39d353]" />
              <span className="text-white truncate max-w-[170px]" title={authorEmail}>
                {authorEmail}
              </span>
            </div>

            {/* User Badge */}
            <div className="flex items-center gap-2 bg-[#0d1117] border border-[#30363d] rounded-full py-1 px-2.5">
              {user.avatarUrl && (
                <Image
                  src={user.avatarUrl}
                  alt={user.login}
                  width={22}
                  height={22}
                  className="rounded-full ring-1 ring-[#30363d]"
                />
              )}
              <span className="text-xs font-semibold text-white">
                @{user.login}
              </span>
            </div>

            {/* Logout */}
            <Link
              href="/api/auth/logout"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'border-[#30363d] bg-[#21262d] hover:bg-[#da3633]/20 hover:text-[#f85149] hover:border-[#da3633]/50 text-[#c9d1d9] text-xs h-8 px-2.5 gap-1',
              })}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full flex flex-col gap-5">
        {/* Mobile Repo Selector fallback */}
        <div className="flex md:hidden items-center justify-between p-3 rounded-lg border border-[#30363d] bg-[#161b22]">
          <RepoSelector userLogin={user.login} initialRepos={initialRepos} />
        </div>

        {/* Execution Success Notification */}
        {successBanner && (
          <div className="p-3 rounded-xl bg-[#0e4429]/60 border border-[#238636] text-[#3fb950] text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* The Hero: GitHub Contribution Heatmap */}
        <section className="w-full flex flex-col items-center">
          {isLoadingGraph && (
            <div className="text-xs text-[#8b949e] font-mono animate-pulse mb-1">
              Synchronizing contribution data with GitHub GraphQL...
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
          <CommitQueue onExecute={() => setIsExecutionModalOpen(true)} />
        </section>

        {/* Execution Streaming Modal */}
        <ExecutionModal
          isOpen={isExecutionModalOpen}
          onClose={() => setIsExecutionModalOpen(false)}
          userName={user.name || user.login}
          userEmail={authorEmail}
          onSuccess={handleExecutionSuccess}
        />
      </main>
    </div>
  );
}
