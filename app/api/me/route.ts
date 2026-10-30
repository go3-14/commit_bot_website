import { NextRequest, NextResponse } from 'next/server';
import { MIN_YEAR } from '@/lib/plan-validation';
import { getSessionFromRequest } from '@/lib/session';
import { fetchUser, fetchPrimaryEmail, fetchContributionGraph } from '@/lib/github-api';

export async function GET(req: NextRequest) {
  const token = getSessionFromRequest(req)?.token;

  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const currentYear = new Date().getUTCFullYear();
  const searchYear = req.nextUrl.searchParams.get('year');
  const year = searchYear === null ? currentYear : Number(searchYear);
  if (!Number.isInteger(year) || year < MIN_YEAR || year > currentYear) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

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
    return NextResponse.json({ error: 'Failed to fetch GitHub profile or contribution data' }, { status: 502 });
  }
}
