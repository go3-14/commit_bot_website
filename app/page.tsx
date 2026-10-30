import { getSession } from '@/lib/session';
import DashboardClient from './dashboard/DashboardClient';
import { 
  fetchUser, 
  fetchPrimaryEmail, 
  fetchContributionGraph, 
  fetchOwnedRepos 
} from '@/lib/github-api';
import { yearGridToDate } from '@/lib/core/grid-mapper';
import { ContributionDay } from '@/types';

function generateStarterGraph(year: number): ContributionDay[][] {
  const weeks: ContributionDay[][] = [];
  for (let w = 0; w < 53; w++) {
    const days: ContributionDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = yearGridToDate(w, d, year);
      days.push({
        date: date.toISOString().split('T')[0],
        contributionCount: 0,
        color: '#161b22',
        weekday: d,
      });
    }
    weeks.push(days);
  }
  return weeks;
}

export default async function HomePage() {
  const session = await getSession();
  const token = session?.token;
  const currentYear = new Date().getFullYear();

  if (token) {
    try {
      const [user, email, initialGraph, initialRepos] = await Promise.all([
        fetchUser(token),
        fetchPrimaryEmail(token),
        fetchContributionGraph(token, currentYear),
        fetchOwnedRepos(token),
      ]);

      return (
        <DashboardClient
          user={user}
          email={email}
          initialGraph={initialGraph}
          initialRepos={initialRepos}
          currentYear={currentYear}
        />
      );
    } catch (err: unknown) {
      console.error('Session token invalid or expired:', err);
      // Fall through to guest/starter canvas mode
    }
  }

  // Guest / unauthenticated mode: load directly into interactive canvas
  const starterGraph = generateStarterGraph(currentYear);

  return (
    <DashboardClient
      user={null}
      email={null}
      initialGraph={starterGraph}
      initialRepos={[]}
      currentYear={currentYear}
    />
  );
}
