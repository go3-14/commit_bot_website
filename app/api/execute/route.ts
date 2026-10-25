import { NextRequest, NextResponse } from 'next/server';
import { executeCommitPlan } from '@/lib/commit-executor';
import { CommitPlanEntry } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gh_token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: No active GitHub session found' },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { plan: rawPlan, config } = body;

  if (!rawPlan || !Array.isArray(rawPlan) || rawPlan.length === 0) {
    return NextResponse.json({ error: 'Commit plan is empty or invalid' }, { status: 400 });
  }

  if (!config || !config.owner || !config.repo || !config.authorEmail) {
    return NextResponse.json(
      { error: 'Execution config is incomplete (owner, repo, authorEmail required)' },
      { status: 400 }
    );
  }

  // Convert rawPlan date strings into Date objects
  const plan: CommitPlanEntry[] = rawPlan.map((p) => ({
    date: new Date(p.date),
    count: Number(p.count) || 1,
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await executeCommitPlan(
          plan,
          {
            ...config,
            token,
            branch: config.branch || 'main',
          },
          (progress) => {
            const eventData = `data: ${JSON.stringify(progress)}\n\n`;
            controller.enqueue(encoder.encode(eventData));
          }
        );

        // Send completion event
        const doneData = `data: ${JSON.stringify({ done: true, total: plan.reduce((s, p) => s + p.count, 0) })}\n\n`;
        controller.enqueue(encoder.encode(doneData));
        controller.close();
      } catch (err: unknown) {
        console.error('Execution stream error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown execution failure';
        const errorData = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
