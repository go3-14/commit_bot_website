import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { getSessionFromRequest } from '@/lib/session';
import { rejectCrossOrigin, requireJson } from '@/lib/security';
import { executeCommitPlan } from '@/lib/commit-executor';
import { fetchPrimaryEmail, fetchUser } from '@/lib/github-api';
import { isValidRepoName, validatePlan } from '@/lib/plan-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const blocked = rejectCrossOrigin(req) ?? requireJson(req);
  if (blocked) return blocked;

  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { plan: rawPlan, config } = (body ?? {}) as { plan?: unknown; config?: { repo?: unknown } };

  const validated = validatePlan(rawPlan);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const plan = validated.value;

  const repoName = config?.repo;
  if (!isValidRepoName(repoName)) {
    return NextResponse.json({ error: 'Invalid repository name' }, { status: 400 });
  }

  // Everything below is derived from the session and GitHub, never from client input.
  const owner = session.login;
  let branch: string;
  let authorName: string;
  let authorEmail: string;
  try {
    const octokit = new Octokit({ auth: session.token });
    const { data: repo } = await octokit.repos.get({ owner, repo: repoName });

    if (repo.owner.login.toLowerCase() !== owner.toLowerCase() || repo.fork || repo.archived) {
      return NextResponse.json(
        { error: 'Repository must be an owned, non-fork, non-archived repository' },
        { status: 400 }
      );
    }
    branch = repo.default_branch;

    const [user, email] = await Promise.all([fetchUser(session.token), fetchPrimaryEmail(session.token)]);
    authorName = user.name || user.login;
    authorEmail = email || `${user.login}@users.noreply.github.com`;
  } catch (err: unknown) {
    console.error('Execution preflight failed:', err);
    return NextResponse.json({ error: 'Could not access that repository' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const totalCommits = plan.reduce((sum, p) => sum + p.count, 0);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // client disconnected
        }
      };

      try {
        await executeCommitPlan(
          plan,
          { token: session.token, owner, repo: repoName, branch, authorName, authorEmail },
          (progress) => send(progress),
          req.signal
        );
        send({ done: true, total: totalCommits });
      } catch (err: unknown) {
        console.error('Execution stream error:', err);
        send({ error: 'Execution failed. Some commits may already have been pushed.' });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
