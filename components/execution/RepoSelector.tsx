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
      <div className="flex items-center gap-2 text-xs text-dim font-mono">
        <FolderGit2 className="w-3.5 h-3.5 text-dim" />
        <span>repo:</span>
        <Link
          href="/api/auth/github"
          className="text-xs text-dim hover:text-fg bg-canvas px-2 py-0.5 rounded border border-line transition-all"
        >
          <span>connect github</span>
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
    <div className="flex items-center gap-2 font-mono text-xs">
      <FolderGit2 className="w-3.5 h-3.5 text-dim" />
      <span className="text-dim">repo:</span>

      {!isCreating ? (
        <div className="flex items-center gap-1.5">
          <Select value={currentRepoName} onValueChange={handleSelectRepo}>
            <SelectTrigger className="w-[180px] sm:w-[210px] h-8 text-xs bg-canvas border-line text-fg font-mono focus:border-line-strong">
              <SelectValue placeholder="select repo" />
            </SelectTrigger>
            <SelectContent className="bg-panel border-line text-fg text-xs font-mono">
              <SelectItem value="__create_new__" className="text-mint font-mono border-b border-line mb-1">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-3 h-3" />
                  <span>create new repo...</span>
                </span>
              </SelectItem>

              {repos.map((r) => (
                <SelectItem key={r.name} value={r.name} className="font-mono">
                  <span className="flex items-center gap-1.5">
                    {r.private ? (
                      <Lock className="w-3 h-3 text-dim" />
                    ) : (
                      <Globe className="w-3 h-3 text-dim" />
                    )}
                    <span>{r.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="h-8 px-2 rounded-md bg-canvas border border-line text-dim hover:text-fg hover:border-line-strong text-xs flex items-center gap-1 transition-all"
            title="Create new repository"
          >
            <Plus className="w-3 h-3 text-mint" />
            <span className="hidden sm:inline">new</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleCreateRepo} className="flex items-center gap-1.5 font-mono">
          <Input
            type="text"
            value={newRepoName}
            onChange={(e) => setNewRepoName(e.target.value)}
            placeholder="repo-name"
            className="w-[140px] h-8 text-xs bg-canvas border-line text-fg font-mono focus:border-line-strong"
            required
          />

          <label className="flex items-center gap-1 text-xs text-dim cursor-pointer">
            <Checkbox
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(Boolean(checked))}
            />
            <span>private</span>
          </label>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || !newRepoName.trim()}
            className="bg-mint-strong hover:bg-mint text-canvas text-xs h-8 px-2.5 font-bold gap-1 disabled:opacity-30 disabled:bg-line disabled:text-dim"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            <span>create</span>
          </Button>

          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setError(null);
            }}
            className="h-8 px-2 rounded-md bg-canvas border border-line text-dim hover:text-fg text-xs transition-all"
          >
            cancel
          </button>

          {error && <span className="text-[11px] text-red-400">{error}</span>}
        </form>
      )}
    </div>
  );
}
