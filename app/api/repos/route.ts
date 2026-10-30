import { NextRequest, NextResponse } from 'next/server';
import { fetchOwnedRepos, createRepo } from '@/lib/github-api';
import { getSessionFromRequest } from '@/lib/session';
import { rejectCrossOrigin, requireJson } from '@/lib/security';
import { allowRequest } from '@/lib/rate-limit';
import { isValidRepoName } from '@/lib/plan-validation';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  try {
    const repos = await fetchOwnedRepos(session.token);
    return NextResponse.json({ repos });
  } catch (err: unknown) {
    console.error('Error fetching repos:', err);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const blocked = rejectCrossOrigin(req) ?? requireJson(req);
  if (blocked) return blocked;

  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  if (!allowRequest(`create-repo:${session.login.toLowerCase()}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  let body: { name?: unknown; isPrivate?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!isValidRepoName(name)) {
    return NextResponse.json(
      { error: 'Repository name may only contain letters, numbers, ".", "-" and "_"' },
      { status: 400 }
    );
  }

  try {
    const repo = await createRepo(session.token, name, body.isPrivate !== false);
    return NextResponse.json({ repo });
  } catch (err: unknown) {
    console.error('Error creating repo:', err);
    const status = (err as { status?: number }).status;
    const message =
      status === 422 ? 'A repository with that name already exists' : 'Failed to create repository';
    return NextResponse.json({ error: message }, { status: status === 422 ? 409 : 502 });
  }
}
