/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// The Shannon feedback loop. One pass predicts; the loop confirms, feeds the
// confirmed assets back into the transition model and predicts again. Every
// probe is a single anonymous GET inside a fixed budget, so this is a bounded
// loop over predictions, never a sweep of the asset space.

import { markovPlan } from './symmetryDims.ts';
import { assertPublicUrl } from './readOnly.ts';

const UA = 'REVENGINE-SovereignMirror/1.0 (+authorized read-only pass)';
const PROBE_CAP = 10;
const ROUND_CAP = 3;

async function reachable(url: string) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': UA, Accept: '*/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });
    const drain = async () => {
      if (res.body) {
        try {
          await res.body.cancel();
        } catch {
          // A body that will not cancel is harmless; the probe already landed.
        }
      }
    };
    // A redirect can leave the public surface; a probe that landed on an
    // internal host is not evidence of the asset being live.
    try {
      assertPublicUrl(res.url);
    } catch {
      await drain();
      return false;
    }
    const ok = res.ok;
    await drain();
    return ok;
  } catch {
    return false;
  }
}

export async function runFeedbackLoop(input: {
  origin: string;
  surface?: string;
  plan: any[];
  nodes: any[];
  edges: any[];
  walk: string[];
  budget?: number;
  rounds?: number;
}) {
  const budget = Math.min(PROBE_CAP, Math.max(2, input.budget || 8));
  const maxRounds = Math.min(ROUND_CAP, Math.max(1, input.rounds || 2));
  // Predictions are modelled on the origin; probes land on the surface you nominate.
  // With a candidate deploy supplied, a miss means your mirror is missing it.
  const surface = input.surface && input.surface !== input.origin ? input.surface : input.origin;
  const onSurface = surface !== input.origin;

  const toSurface = (url: string) => {
    try {
      const parsed = new URL(url);
      return surface + parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  };

  const nodes = [...(input.nodes || [])];
  let edges = [...(input.edges || [])];
  const walks = [input.walk && input.walk.length ? [...input.walk] : ['document']];
  const urlOf = new Map<string, string>();
  nodes.forEach((node: any) => {
    if (node && node.id) urlOf.set(node.id, node.url);
  });

  const probed = new Set<string>();
  const confirmed: string[] = [];
  const missing: string[] = [];
  const rounds: any[] = [];
  let plan = input.plan || [];

  const frontierOf = (rows: any[]) =>
    (rows || [])
      .filter((row) => row && row.kind && row.kind !== 'link' && row.kind !== 'document')
      .map((row) => row.to)
      .filter((id: string) => {
        const url = urlOf.get(id);
        return url && url.startsWith(input.origin) && !probed.has(id);
      })
      .slice(0, budget);

  let frontier = frontierOf(plan);

  for (let round = 1; round <= maxRounds && frontier.length && probed.size < budget; round += 1) {
    const batch = frontier.slice(0, Math.max(1, budget - probed.size));
    const hits: string[] = [];
    let gone = 0;

    for (const id of batch) {
      probed.add(id);
      const url = toSurface(urlOf.get(id) as string);
      if (await reachable(url)) {
        hits.push(id);
        confirmed.push(url);
      } else {
        gone += 1;
        missing.push(url);
      }
    }

    // Feed the confirmation back in: confirmed assets join the walk and the
    // dependency edges, then the transition model is re-derived for round two.
    walks[0] = [...walks[0], ...hits];
    edges = [...edges, ...hits.map((id) => ({ from: 'document', to: id, tag: 'observed', trigger: 'loop_confirm' }))];
    plan = markovPlan(walks, nodes, edges).plan;

    rounds.push({ round, probed: batch.length, confirmed: hits.length, missing: gone });
    frontier = frontierOf(plan);
  }

  const verdict = confirmed.length > 0 ? (frontier.length ? 'probing' : 'live') : 'cloned';
  return {
    rounds,
    probed: probed.size,
    confirmed,
    missing,
    next: frontier.map((id) => toSurface(urlOf.get(id) as string)),
    plan,
    surface,
    probes_your_deploy: onSurface,
    verdict,
    budget,
    max_rounds: maxRounds,
    note:
      probed.size === 0
        ? 'The transition model produced no same-origin asset it could predict, so the loop had nothing to confirm.'
        : probed.size + ' predicted asset(s) probed against ' + (onSurface ? 'your deploy' : 'the origin') +
          ' across ' + rounds.length + ' round(s) · ' + confirmed.length + ' confirmed by response · ' + missing.length + ' absent.' +
          (onSurface ? ' A miss here is an asset your mirror does not serve yet.' : '') + ' ' +
          (verdict === 'live'
            ? 'The chain re-entered on confirmed evidence and drained its queue, which is the difference between a static clone and a live mirror.'
            : verdict === 'probing'
              ? 'Predictions remain in the queue; run the pass again to keep the loop turning.'
              : 'Nothing confirmed, so the mirror is still a clone of the served document rather than a live surface.')
  };
}