import { NextRequest, NextResponse } from 'next/server';
import { fetchUser, fetchPrimaryEmail, fetchContributionGraph } from '@/lib/github-api';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gh_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized. No active session token found.' }, { status: 401 });
  }

  const searchYear = req.nextUrl.searchParams.get('year');
  const year = searchYear ? parseInt(searchYear, 10) : new Date().getFullYear();

  try {
    const [user, email, graph] = await Promise.all([
      fetchUser(token),
      fetchPrimaryEmail(token),
      fetchContributionGraph(token, year),
    ]);

    return NextResponse.json({
      user,
      email,
      graph,
      year,
    });
  } catch (err: unknown) {
    console.error('Error fetching user data:', err);
    return NextResponse.json({ error: 'Failed to fetch GitHub profile or contribution data' }, { status: 500 });
  }
}
