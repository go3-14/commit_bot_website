import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { 
  fetchUser, 
  fetchPrimaryEmail, 
  fetchContributionGraph, 
  fetchOwnedRepos 
} from '@/lib/github-api';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('gh_token')?.value;

  if (!token) {
    redirect('/');
  }

  const currentYear = new Date().getFullYear();

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
    console.error('Error in DashboardPage loader:', err);
    // If the token is revoked or invalid, clear cookie and redirect to login
    redirect('/api/auth/logout');
  }
}
