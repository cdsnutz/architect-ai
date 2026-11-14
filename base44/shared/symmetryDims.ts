/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Symmetry dimensions: temporal signature, transition model, structural parity.
//
// Each one is a measurement you can act on in your own deployment. None of them
// intercepts, delays or replays another origin's live traffic; the timing model
// describes what a mirror *should* emit, it does not shape a proxied stream.

import { safeFetch } from './readOnly.ts';

const TIMEOUT_MS = 8000;
const TIMING_SAMPLES = 4;
const TIMING_GAP_MS = 90;
// What a warm cache hit costs the mirror's own edge. Declared, not measured:
// tune it against your deployment rather than trusting this constant.
const ASSUMED_SERVE_MS = 15;
const PID = { kp: 0.6, ki: 0.15, kd: 0.25, window: 8 };

function stats(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
  const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const variance = sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sorted.length;
  return {
    n: sorted.length,
    p50: Math.round(at(0.5)),
    p90: Math.round(at(0.9)),
    min: Math.round(sorted[0]),
    max: Math.round(sorted[sorted.length - 1]),
    jitter: Math.round(Math.sqrt(variance))
  };
}

// Time-to-first-byte probes: a 1-byte ranged GET per sample, spaced out so the
// samples describe the origin's network signature rather than a burst.
export async function readTimings(url: string, userAgent: string): Promise<number[]> {
  const samples: number[] = [];
  for (let index = 0; index < TIMING_SAMPLES; index += 1) {
    const started = performance.now();
    try {
      const res = await safeFetch(url, {
        headers: { 'User-Agent': userAgent, Range: 'bytes=0-0', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      samples.push(Math.round(performance.now() - started));
      try {
        await res.body?.cancel();
      } catch {
        /* the body is discarded either way */
      }
    } catch {
      /* a failed probe is not a sample */
    }
    await new Promise((resolve) => setTimeout(resolve, TIMING_GAP_MS));
  }
  return samples;
}

export function latencyModel(samples: number[]) {
  const target = stats(samples);
  if (!target) {
    return {
      samples: 0,
      target: null,
      note: 'No timing sample came back, so the target has no measurable latency signature from this host.'
    };
  }
  const hold = Math.max(0, target.p50 - ASSUMED_SERVE_MS);
  const band = Math.max(8, target.jitter);
  const noisy = target.jitter > 40;
  return {
    samples: target.n,
    target,
    assumed_serve_ms: ASSUMED_SERVE_MS,
    hold_ms: hold,
    band_ms: band,
    pid: {
      ...PID,
      setpoint_ms: target.p50,
      tolerance_ms: band,
      note:
        'setpoint = target p50 · error = mirror first byte − setpoint · integral clamped to ' + PID.window +
        ' samples · derivative ignored below ' + band + ' ms of noise'
    },
    signature: noisy ? 'noisy' : 'tight',
    verdict: noisy
      ? 'The origin is itself unstable (±' + target.jitter + ' ms). Matching it exactly would mean matching noise, which reads as artificial; hold to the band instead.'
      : 'The origin is stable (±' + target.jitter + ' ms), so its signature can be reproduced inside a ' + band + ' ms band.',
    guidance:
      hold > 0
        ? 'Hold each first byte ' + hold + ' ms ±' + band + ' in your deployment so a warm mirror answer costs the same as the origin answer.'
        : 'Your mirror already answers slower than the origin, so no hold is needed; trim the serve path instead.',
    note:
      'Measured from this pass host, not from a visitor\'s browser: DNS, route and PoP will shift these numbers per client. Treat it as the shape of the origin signature, not a global constant.'
  };
}

type WalkNode = { id: string; kind: string };

export function markovPlan(walks: string[][], nodes: WalkNode[], edges: { from: string; to: string; tag?: string }[] = []) {
  const kind = new Map(nodes.map((node) => [node.id, node.kind]));
  const pairs = new Map<string, Map<string, number>>();
  const states = new Set<string>();

  const observe = (from: string, to: string) => {
    if (!from || !to || from === to) return;
    states.add(from);
    states.add(to);
    const row = pairs.get(from) || new Map<string, number>();
    row.set(to, (row.get(to) || 0) + 1);
    pairs.set(from, row);
  };

  for (const walk of walks) {
    for (let index = 0; index < walk.length - 1; index += 1) observe(walk[index], walk[index + 1]);
  }
  // A call site is a transition too: whenever this script runs, it asks for that
  // endpoint. Document-level edges are the walk itself, so they are already counted.
  for (const edge of edges) {
    if (edge.tag === 'inferred' && edge.from !== 'document') observe(edge.from, edge.to);
  }

  const transitions: { from: string; to: string; count: number; prob: number }[] = [];
  for (const [from, row] of pairs) {
    let outgoing = 0;
    for (const count of row.values()) outgoing += count;
    for (const [to, count] of row) {
      // Laplace smoothing: one observed walk must not read as certainty.
      transitions.push({ from, to, count, prob: count / (outgoing + 1) });
    }
  }
  transitions.sort((a, b) => b.prob - a.prob || b.count - a.count);

  const plan = transitions
    .filter((row) => row.prob >= 0.4 && kind.get(row.to) !== 'link')
    .slice(0, 12)
    .map((row) => ({ from: row.from, to: row.to, kind: kind.get(row.to) || 'unknown', prob: Math.round(row.prob * 100) }));

  return {
    states: states.size,
    transitions: transitions.slice(0, 24).map((row) => ({ ...row, prob: Math.round(row.prob * 100) / 100 })),
    plan,
    smoothed: true,
    note: transitions.length
      ? 'Frequencies come from the document order of this pass' + (walks.length > 1 ? ' and the candidate walk' : '') +
        ', Laplace-smoothed. Repeat passes and candidate walks sharpen the model; a plan entry is a prefetch candidate, not a guarantee.'
      : 'No ordered request sequence was recoverable, so there is nothing to prefetch.'
  };
}

function cosine(left: Record<string, number>, right: Record<string, number>) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const key of keys) {
    const a = left[key] || 0;
    const b = right[key] || 0;
    dot += a * b;
    na += a * a;
    nb += b * b;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function histogram(values: string[]) {
  const out: Record<string, number> = {};
  for (const value of values) out[value] = (out[value] || 0) + 1;
  return out;
}

function pathOf(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function degreeSignature(graph: any) {
  const out: Record<string, number> = {};
  for (const edge of graph.edges || []) out[edge.from] = (out[edge.from] || 0) + 1;
  return Object.values(out).sort((a, b) => b - a);
}

function degreeSimilarity(left: number[], right: number[]) {
  const sumLeft = left.reduce((sum, value) => sum + value, 0);
  const sumRight = right.reduce((sum, value) => sum + value, 0);
  if (!sumLeft || !sumRight) return 0;
  let delta = 0;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) delta += Math.abs((left[index] || 0) - (right[index] || 0));
  return Math.max(0, 1 - delta / (2 * Math.max(sumLeft, sumRight)));
}

// A structural fingerprint, not a proof: real graph isomorphism is intractable
// at this size, so this compares class histograms, trigger mix, path overlap and
// out-degree shape.
export function topologyParity(baseline: any, candidate: any) {
  if (!baseline || !candidate) return null;
  const kindScore = cosine(histogram((baseline.nodes || []).map((node: any) => node.kind)), histogram((candidate.nodes || []).map((node: any) => node.kind)));
  const triggerScore = cosine(baseline.triggers || {}, candidate.triggers || {});
  const basePaths = new Set((baseline.nodes || []).map((node: any) => pathOf(node.url)));
  const candPaths = new Set((candidate.nodes || []).map((node: any) => pathOf(node.url)));
  let shared = 0;
  for (const path of basePaths) if (candPaths.has(path)) shared += 1;
  const union = basePaths.size + candPaths.size - shared;
  const pathScore = union ? shared / union : 0;
  const degreeScore = degreeSimilarity(degreeSignature(baseline), degreeSignature(candidate));

  const dimensions = [
    { name: 'node classes', weight: 30, score: Math.round(kindScore * 100), note: 'script, stylesheet, image, media, frame, form, link, endpoint' },
    { name: 'trigger mix', weight: 30, score: Math.round(triggerScore * 100), note: 'tag declarations versus inferred call sites' },
    { name: 'path overlap', weight: 25, score: Math.round(pathScore * 100), note: shared + ' of ' + union + ' distinct paths' },
    { name: 'out-degree shape', weight: 15, score: Math.round(degreeScore * 100), note: 'sorted fan-out, L1 normalised' }
  ];
  const score = Math.round(dimensions.reduce((sum, part) => sum + (part.score * part.weight) / 100, 0));
  return {
    score,
    verdict: score >= 85 ? 'structurally isomorphic' : score >= 60 ? 'structural paraphrase' : 'divergent structure',
    dimensions,
    note:
      'Compared on the node sets this pass could read. Class and trigger histograms can match while two graphs are still not isomorphic; treat 100 as "same shape", never as proof.'
  };
}