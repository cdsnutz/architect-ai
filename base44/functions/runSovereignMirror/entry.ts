/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { runSovereignMirror } from '../../shared/sovereignMirror.ts';
import { guardQuota, quotaRefusal } from '../../shared/quota.ts';

export default async function (req) {
  let runId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    if (!body || typeof body.target_url !== 'string' || !body.target_url.trim()) {
      return Response.json({ error: 'target_url is required.' }, { status: 400 });
    }

    const quota = await guardQuota(base44, user, 'mirror_run', 6);
    if (!quota.allowed) return quotaRefusal(quota);

    let seed;
    try {
      seed = await base44.entities.MirrorRun.create({
        target_url: body.target_url,
        status: 'running',
        auth_basis: body.auth_basis || 'owned',
        attestation: typeof body.attestation === 'string' ? body.attestation.slice(0, 400) : ''
      });
      runId = seed.id;
    } catch (error) {
      console.log('runSovereignMirror: could not open a run — ' + (error && error.message));
    }

    const result = await runSovereignMirror(body);

    if (runId) {
      try {
        await base44.entities.MirrorRun.update(runId, {
          status: result.gate.passed ? 'complete' : 'needs_input',
          label: result.target_url,
          candidate_url: result.candidate_url,
          auth_basis: result.auth_basis,
          attestation: result.attestation,
          stages: result.stages,
          symmetry_score: result.symmetry_score,
          gate: result.gate,
          reversal: result.reversal,
          capture: result.capture,
          virtualization: result.virtualization,
          artifacts: result.artifacts,
          refusals: result.refusals,
          notes: result.notes
        });
      } catch (error) {
        console.log('runSovereignMirror: could not save the run — ' + (error && error.message));
      }
    }

    console.log(
      'runSovereignMirror: ' + result.target_url + ' symmetry=' + result.symmetry_score +
      ' gate=' + result.gate.verdict + ' routes=' + result.reversal.routes.length
    );

    return Response.json({ ...result, run_id: runId || '' });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('runSovereignMirror failed: ' + reason);
    try {
      if (runId) {
        const base44 = createClientFromRequest(req);
        await base44.entities.MirrorRun.update(runId, { status: 'failed', error: reason });
      }
    } catch (cleanupError) {
      console.log('runSovereignMirror cleanup failed: ' + (cleanupError && cleanupError.message));
    }
    return Response.json({ error: 'The mirror pass failed: ' + reason }, { status: 500 });
  }
}