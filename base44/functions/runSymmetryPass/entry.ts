/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { assertPublicUrl } from '../../shared/readOnly.ts';
import { assertAuthorization, runSymmetryPass } from '../../shared/symmetry.ts';

export default async function (req) {
  let runId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    let target = '';
    try {
      target = assertPublicUrl(body.target_url);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    let candidate = '';
    if (typeof body.candidate_url === 'string' && body.candidate_url.trim()) {
      try {
        candidate = assertPublicUrl(body.candidate_url);
      } catch (error) {
        return Response.json({ error: 'Candidate surface: ' + error.message }, { status: 400 });
      }
    }

    let grant;
    try {
      grant = assertAuthorization(body.auth_basis, body.attestation);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 120) : target;

    const seed = await base44.entities.SymmetryRun.create({
      label,
      target_url: target,
      candidate_url: candidate || '',
      auth_basis: grant.basis,
      attestation: grant.attestation,
      status: 'running',
      notes: 'Authorized symmetry pass started by ' + (user.email || user.id) + '.'
    });
    runId = seed.id;

    const result = await runSymmetryPass({ target, candidate: candidate || undefined });

    const saved = await base44.entities.SymmetryRun.update(runId, {
      status: 'complete',
      graph: result.graph,
      entropy: result.entropy,
      state: result.state,
      diff: result.diff,
      fidelity: result.fidelity,
      notes: result.notes
    });

    return Response.json({ run: saved, graph: result.graph, entropy: result.entropy, state: result.state, diff: result.diff, fidelity: result.fidelity });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('runSymmetryPass failed: ' + reason);
    try {
      const base44 = createClientFromRequest(req);
      if (runId) {
        await base44.entities.SymmetryRun.update(runId, { status: 'failed', error: reason });
      }
    } catch (cleanupError) {
      console.log('runSymmetryPass cleanup failed: ' + (cleanupError && cleanupError.message));
    }
    return Response.json({ error: 'The symmetry pass failed: ' + reason }, { status: 500 });
  }
}