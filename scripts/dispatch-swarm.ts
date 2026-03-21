// scripts/dispatch-swarm.ts
// External swarm trigger utility
// Fires a GitHub repository_dispatch event to wake the autonomous council
// from any external signal: monitoring scripts, webhooks, cron jobs, manual calls
//
// Usage:
//   npx tsx scripts/dispatch-swarm.ts --event=intelligence-trigger
//   npx tsx scripts/dispatch-swarm.ts --event=synthesis-trigger --niche=etsy-sellers
//   npm run dispatch-swarm
//
// From external code:
//   import { dispatchSwarm } from './scripts/dispatch-swarm'
//   await dispatchSwarm('intelligence-trigger', { source: 'reddit-spike' })

import process from 'process';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DispatchPayload {
  source?: string;
  niche?: string;
  priority?: 'low' | 'normal' | 'high';
  reason?: string;
  metadata?: Record<string, unknown>;
}

interface DispatchResult {
  success: boolean;
  statusCode: number;
  message: string;
}

// ── Core dispatch ─────────────────────────────────────────────────────────────

/**
 * Fire a repository_dispatch event to trigger a GitHub Actions workflow.
 *
 * @param eventType  The event type — must match a workflow's repository_dispatch.types[]
 * @param payload    Optional metadata passed as client_payload to the workflow
 * @param repoSlug   Optional repo override (default: Elghazawy5367/Council-Git-V9)
 */
export async function dispatchSwarm(
  eventType: string,
  payload: DispatchPayload = {},
  repoSlug = 'Elghazawy5367/Council-Git-V9'
): Promise<DispatchResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      success: false,
      statusCode: 0,
      message: 'GITHUB_TOKEN is not set. Cannot fire repository_dispatch.',
    };
  }

  const url = `https://api.github.com/repos/${repoSlug}/dispatches`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Council-Git-V9/1.0',
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: {
          ...payload,
          triggered_at: new Date().toISOString(),
          triggered_by: 'dispatch-swarm-script',
        },
      }),
    });

    // 204 No Content = success for repository_dispatch
    if (response.status === 204) {
      return {
        success: true,
        statusCode: 204,
        message: `✅ Dispatched "${eventType}" to ${repoSlug}`,
      };
    }

    const body = await response.text();
    return {
      success: false,
      statusCode: response.status,
      message: `GitHub API error ${response.status}: ${body.slice(0, 200)}`,
    };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, statusCode: 0, message: `Network error: ${msg}` };
  }
}

// ── Preset triggers ───────────────────────────────────────────────────────────

/** Trigger the full intelligence + synthesis pipeline */
export async function triggerFullPipeline(reason = 'manual'): Promise<DispatchResult> {
  return dispatchSwarm('intelligence-trigger', { source: 'manual', reason, priority: 'normal' });
}

/** Trigger synthesis only (features already ran, just synthesise) */
export async function triggerSynthesisOnly(niche?: string): Promise<DispatchResult> {
  return dispatchSwarm('synthesis-trigger', {
    source: 'manual',
    niche,
    reason: 'on-demand synthesis',
    priority: 'high',
  });
}

/** Trigger for a specific niche — use when you spot a signal manually */
export async function triggerNiche(
  nicheId: string,
  reason: string
): Promise<DispatchResult> {
  return dispatchSwarm('niche-trigger', {
    source: 'manual-observation',
    niche: nicheId,
    reason,
    priority: 'high',
  });
}

// ── CLI entry ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Parse --event and --niche from process.argv
  const args = process.argv.slice(2);
  const eventArg = args.find(a => a.startsWith('--event='));
  const nicheArg = args.find(a => a.startsWith('--niche='));
  const reasonArg = args.find(a => a.startsWith('--reason='));

  const eventType = eventArg ? eventArg.split('=')[1] : 'intelligence-trigger';
  const niche = nicheArg ? nicheArg.split('=')[1] : undefined;
  const reason = reasonArg ? reasonArg.split('=')[1] : 'manual CLI dispatch';

  console.log(`[Dispatch] Firing event: "${eventType}"`);
  if (niche) console.log(`[Dispatch] Niche filter: ${niche}`);
  console.log(`[Dispatch] Reason: ${reason}`);

  const result = await dispatchSwarm(eventType, { niche, reason, source: 'cli' });

  if (result.success) {
    console.log(`[Dispatch] ${result.message}`);
    console.log(`[Dispatch] Check Actions tab: https://github.com/Elghazawy5367/Council-Git-V9/actions`);
    process.exit(0);
  } else {
    console.error(`[Dispatch] Failed: ${result.message}`);
    process.exit(1);
  }
}

main();
