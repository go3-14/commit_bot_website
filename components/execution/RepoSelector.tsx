'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FolderGit2, Plus, Lock, Globe, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RepoInfo } from '@/types';
import { useGraphStore } from '@/store/graph-store';

interface RepoSelectorProps {
  userLogin?: string | null;
  initialRepos?: RepoInfo[];
}

export default function RepoSelector({
  userLogin,
  initialRepos = [],
}: RepoSelectorProps) {
  const { selectedRepo, setSelectedRepo } = useGraphStore();

  const [repos, setRepos] = useState<RepoInfo[]>(initialRepos);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newRepoName, setNewRepoName] = useState<string>('my-contributions');
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!userLogin) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#8b949e]">
        <FolderGit2 className="w-4 h-4 text-[#8b949e]" />
        <span className="text-xs font-medium text-[#8b949e]">Target Repo:</span>
        <Link
          href="/api/auth/github"
          className="text-xs text-[#388bfd] hover:underline bg-[#0d1117] px-2.5 py-1 rounded border border-[#30363d] flex items-center gap-1.5"
        >
          <span>Connect GitHub to select repository</span>
        </Link>
      </div>
    );
  }

  const currentRepoName = selectedRepo?.repo || repos[0]?.name || '';

  const handleSelectRepo = (repoName: string | null) => {
    if (!repoName) return;

    if (repoName === '__create_new__') {
      setIsCreating(true);
      return;
    }

    const found = repos.find((r) => r.name === repoName);
    if (found) {
      setSelectedRepo({
        owner: userLogin,
        repo: found.name,
        branch: found.defaultBranch || 'main',
      });
    }
  };

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRepoName.trim(),
          isPrivate,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create repository');
      }

      const created: RepoInfo = data.repo;
      setRepos([created, ...repos]);
      setSelectedRepo({
        owner: userLogin,
        repo: created.name,
        branch: created.defaultBranch || 'main',
      });
      setIsCreating(false);
      setNewRepoName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating repository';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <FolderGit2 className="w-4 h-4 text-[#8b949e]" />
      <span className="text-xs font-medium text-[#8b949e]">Target Repo:</span>

      {!isCreating ? (
        <div className="flex items-center gap-2">
          <Select value={currentRepoName} onValueChange={handleSelectRepo}>
            <SelectTrigger className="w-[220px] h-8 text-xs bg-[#0d1117] border-[#30363d] text-white">
              <SelectValue placeholder="Select repository" />
            </SelectTrigger>
            <SelectContent className="bg-[#161b22] border-[#30363d] text-white text-xs">
              <SelectItem value="__create_new__" className="text-[#39d353] font-medium border-b border-[#30363d] mb-1">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create new repository...</span>
                </span>
              </SelectItem>

              {repos.map((r) => (
                <SelectItem key={r.name} value={r.name}>
                  <span className="flex items-center gap-1.5">
                    {r.private ? (
                      <Lock className="w-3 h-3 text-[#8b949e]" />
                    ) : (
                      <Globe className="w-3 h-3 text-[#8b949e]" />
                    )}
                    <span>{r.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs h-8 px-2 gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-[#39d353]" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleCreateRepo} className="flex items-center gap-2">
          <Input
            type="text"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            placeholder="repo-name"
            className="w-[160px] h-8 text-xs bg-[#0d1117] border-[#30363d] text-white font-mono"
            required
          />

          <label className="flex items-center gap-1.5 text-xs text-[#8b949e] cursor-pointer">
            <Checkbox
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(Boolean(checked))}
            />
            <span>Private</span>
          </label>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !newRepoName.trim()}
            className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs h-8 px-2.5 gap-1 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            <span>Create</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCreating(false);
              setError(null);
            }}
            className="border-[#30363d] bg-[#21262d] text-[#8b949e] text-xs h-8 px-2"
          >
            Cancel
          </Button>

          {error && <span className="text-[11px] text-[#f85149]">{error}</span>}
        </form>
      )}
    </div>
  );
}
