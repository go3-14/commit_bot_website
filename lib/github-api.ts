import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
import { GitHubUser, ContributionDay, RepoInfo } from '@/types';

// Fetch authenticated user profile
export async function fetchUser(token: string): Promise<GitHubUser> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.users.getAuthenticated();
  return {
    login: data.login,
    name: data.name ?? data.login,
    email: data.email ?? '',
    avatarUrl: data.avatar_url,
  };
}

// Fetch user's verified primary email for commit authorship
export async function fetchPrimaryEmail(token: string): Promise<string> {
  const octokit = new Octokit({ auth: token });
  try {
    const { data } = await octokit.users.listEmailsForAuthenticatedUser();
    const primary = data.find((e) => e.primary && e.verified);
    if (primary) return primary.email;
    const verified = data.find((e) => e.verified);
    if (verified) return verified.email;
    return data[0]?.email ?? '';
  } catch {
    // If user:email scope was restricted or missing, fallback to user.getAuthenticated
    const { data } = await octokit.users.getAuthenticated();
    return data.email ?? '';
  }
}

// Fetch user-owned repositories (filter out forks)
export async function fetchOwnedRepos(token: string): Promise<RepoInfo[]> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.repos.listForAuthenticatedUser({
    type: 'owner',
    sort: 'updated',
    per_page: 100,
  });

  return data
    .filter((r) => !r.fork)
    .map((r) => ({
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      defaultBranch: r.default_branch || 'main',
      isFork: r.fork,
    }));
}

// Create a new repository for the user
export async function createRepo(
  token: string,
  name: string,
  isPrivate = true
): Promise<RepoInfo> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description: 'GitHub contribution graph repository created by commit-bot-web',
    private: isPrivate,
    auto_init: true, // creates initial commit so default branch exists
  });

  return {
    name: data.name,
    fullName: data.full_name,
    private: data.private,
    defaultBranch: data.default_branch || 'main',
    isFork: false,
  };
}

interface GraphQLContributionsResponse {
  viewer: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: Array<{
          contributionDays: Array<{
            date: string;
            contributionCount: number;
            color: string;
            weekday: number;
          }>;
        }>;
      };
    };
  };
}

// Fetch real contribution calendar data via GitHub GraphQL API
export async function fetchContributionGraph(
  token: string,
  year: number
): Promise<ContributionDay[][]> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const query = `
    query GetContributions($from: DateTime!, $to: DateTime!) {
      viewer {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
                color
                weekday
              }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await graphql<GraphQLContributionsResponse>(query, {
      from,
      to,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const weeks = data.viewer.contributionsCollection.contributionCalendar.weeks;
    return weeks.map((w) => w.contributionDays);
  } catch (err: unknown) {
    console.error('Failed to fetch GraphQL contributions:', err);
    // Return empty 53-week grid as fallback if GraphQL fails
    return Array.from({ length: 53 }, () =>
      Array.from({ length: 7 }, () => ({
        date: '',
        contributionCount: 0,
        color: '#161b22',
      }))
    );
  }
}

// Get the current HEAD SHA of a branch
export async function getBranchHead(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<string> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  return data.object.sha;
}

// Update branch reference (force push)
export async function updateBranchRef(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  sha: string
): Promise<void> {
  const octokit = new Octokit({ auth: token });
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha,
    force: true,
  });
}
