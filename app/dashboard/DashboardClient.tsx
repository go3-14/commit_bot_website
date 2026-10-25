'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GitCommit, 
  LogOut, 
  Calendar, 
  FolderGit2, 
  Sparkles 
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
  const [activeRepoName, setActiveRepoName] = useState<string>(
    initialRepos[0]?.name || ''
  );

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

  // Handle year switch
  const handleYearChange = async (newYearStr: string | null) => {
    if (!newYearStr) return;
    const newYear = parseInt(newYearStr, 10);
    setYear(newYear);
    setIsLoadingGraph(true);

    try {
      const res = await fetch(`/api/me?year=${newYear}`);
      if (res.ok) {
        const data = await res.json();
        if (data.graph) {
          setGraphData(data.graph);
        }
      }
    } catch (err) {
      console.error('Failed to fetch graph data for year', newYear, err);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  // Handle repository selection
  const handleRepoChange = (repoName: string | null) => {
    if (!repoName) return;
    setActiveRepoName(repoName);
    const found = initialRepos.find((r) => r.name === repoName);
    if (found) {
      setSelectedRepo({
        owner: user.login,
        repo: found.name,
        branch: found.defaultBranch || 'main',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9]">
      {/* Top Header */}
      <header className="border-b border-[#30363d] bg-[#161b22] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#238636] flex items-center justify-center text-white shadow-md shadow-[#238636]/20">
                <GitCommit className="w-5 h-5" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
                commit-bot<span className="text-[#39d353] font-mono text-sm">.web</span>
              </span>
            </Link>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-[#0d1117] border border-[#30363d] rounded-full py-1 px-3">
              {user.avatarUrl && (
                <Image
                  src={user.avatarUrl}
                  alt={user.login}
                  width={24}
                  height={24}
                  className="rounded-full ring-1 ring-[#30363d]"
                />
              )}
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-white leading-tight">
                  {user.name || user.login}
                </span>
                <span className="text-[10px] text-[#8b949e] font-mono leading-tight">
                  @{user.login}
                </span>
              </div>
            </div>

            <Link
              href="/api/auth/logout"
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'border-[#30363d] bg-[#21262d] hover:bg-[#da3633]/20 hover:text-[#f85149] hover:border-[#da3633]/50 text-[#c9d1d9] gap-1.5',
              })}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full flex flex-col gap-6">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[#30363d] bg-[#161b22]">
          <div className="flex flex-wrap items-center gap-4">
            {/* Target Repo Picker */}
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-[#8b949e]" />
              <span className="text-xs font-medium text-[#8b949e]">Target Repo:</span>
              <Select value={activeRepoName} onValueChange={handleRepoChange}>
                <SelectTrigger className="w-[220px] h-8 text-xs bg-[#0d1117] border-[#30363d] text-white">
                  <SelectValue placeholder="Select repository" />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d] text-white text-xs">
                  {initialRepos.map((repo) => (
                    <SelectItem key={repo.name} value={repo.name}>
                      {repo.name} {repo.private ? '(private)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Picker */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#8b949e]" />
              <span className="text-xs font-medium text-[#8b949e]">Year:</span>
              <Select value={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[110px] h-8 text-xs bg-[#0d1117] border-[#30363d] text-white font-mono">
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

          <div className="text-xs text-[#8b949e] flex items-center gap-2">
            <span>Commit Author Email:</span>
            <span className="text-white font-mono bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
              {email || user.email || `${user.login}@users.noreply.github.com`}
            </span>
          </div>
        </div>

        {/* Tool Selector Panel */}
        <ToolPanel />

        {/* Contribution Graph Section */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#39d353]" />
              <span>Contribution Heatmap</span>
              {isLoadingGraph && (
                <span className="text-xs text-[#8b949e] font-normal animate-pulse">
                  (Loading data...)
                </span>
              )}
            </h2>
          </div>

          <ContributionGraph realData={graphData} year={year} />
        </section>

        {/* Commit Queue Panel */}
        <CommitQueue onExecute={() => {}} />
      </main>
    </div>
  );
}
