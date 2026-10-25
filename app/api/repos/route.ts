import { NextRequest, NextResponse } from 'next/server';
import { fetchOwnedRepos, createRepo } from '@/lib/github-api';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gh_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const repos = await fetchOwnedRepos(token);
    return NextResponse.json({ repos });
  } catch (err: unknown) {
    console.error('Error fetching repos:', err);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gh_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, isPrivate = true } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }

    const repo = await createRepo(token, name.trim(), Boolean(isPrivate));
    return NextResponse.json({ repo });
  } catch (err: unknown) {
    console.error('Error creating repo:', err);
    const message = err instanceof Error ? err.message : 'Failed to create repository';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
