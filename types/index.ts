export interface GitHubUser {
  login: string;
  name: string;
  email: string;
  avatarUrl: string;
}

export interface ContributionDay {
  date: string; // ISO date "YYYY-MM-DD"
  contributionCount: number;
  color: string;
  weekday?: number;
}

export interface RepoInfo {
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  isFork?: boolean;
}

export interface CommitPlanEntry {
  date: Date;
  count: number;
}

export interface ExecutionProgress {
  completed: number;
  total: number;
  currentDate: string;
  sha?: string;
  done?: boolean;
  error?: string;
}

export type ToolType = 'paint' | 'erase' | 'pattern' | 'image' | 'fill' | 'random';
