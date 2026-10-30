import { getSession } from '@/lib/session';
import { authErrorMessage } from '@/lib/auth-errors';
import DashboardClient from './dashboard/DashboardClient';
import { 
  fetchUser, 
  fetchContributionGraph, 
  fetchOwnedRepos 
} from '@/lib/github-api';
import { yearGridToDate, toDateString } from '@/lib/core/grid-mapper';
import { ContributionDay } from '@/types';

function generateStarterGraph(year: number): ContributionDay[][] {
  const weeks: ContributionDay[][] = [];
  for (let w = 0; w < 53; w++) {
    const days: ContributionDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = yearGridToDate(w, d, year);
      days.push({
        date: toDateString(date),
        contributionCount: 0,
        color: '#161b22',
        weekday: d,
      });
    }
    weeks.push(days);
  }
  return weeks;
}

async function loadUserData(token: string, year: number) {
  const [user, initialGraph, initialRepos] = await Promise.all([
    fetchUser(token),
    fetchContributionGraph(token, year),
    fetchOwnedRepos(token),
  ]);
  return { user, initialGraph, initialRepos };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const authError = authErrorMessage((await searchParams).error);
  const session = await getSession();
  const token = session?.token;
  const currentYear = new Date().getFullYear();

  if (token) {
    let data: Awaited<ReturnType<typeof loadUserData>> | null = null;
    try {
      data = await loadUserData(token, currentYear);
    } catch (err: unknown) {
      console.error('Session token invalid or expired:', err);
    }

    if (data) {
      return (
        <DashboardClient
          user={data.user}
          initialGraph={data.initialGraph}
          initialRepos={data.initialRepos}
          currentYear={currentYear}
          authError={authError}
        />
      );
    }
  }

  // Guest / unauthenticated mode: load directly into interactive canvas
  const starterGraph = generateStarterGraph(currentYear);

  return (
    <DashboardClient
      user={null}
      initialGraph={starterGraph}
      initialRepos={[]}
      currentYear={currentYear}
      authError={authError}
    />
  );
}
