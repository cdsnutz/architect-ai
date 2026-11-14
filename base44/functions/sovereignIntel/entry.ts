/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.61';
import { runIntel } from '../../shared/intel.ts';
import { guardQuota, quotaRefusal } from '../../shared/quota.ts';

export default async function (req) {
  let runId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (typeof body.target_url !== 'string' || !body.target_url.trim()) {
      return Response.json({ error: 'target_url is required.' }, { status: 400 });
    }

    const quota = await guardQuota(base44, user, 'intel_run', 3);
    if (!quota.allowed) return quotaRefusal(quota);

    try {
      const seed = await base44.entities.IntelRun.create({
        label: body.target_url.trim(),
        target_url: body.target_url.trim(),
        competitor_urls: Array.isArray(body.competitor_urls)
          ? body.competitor_urls.slice(0, 3).map((value) => String(value))
          : [],
        auth_basis: body.auth_basis || 'owned',
        attestation: typeof body.attestation === 'string' ? body.attestation.slice(0, 400) : '',
        status: 'running'
      });
      runId = seed.id;
    } catch (error) {
      console.log('sovereignIntel: could not open a run — ' + (error && error.message));
    }

    const result = await runIntel({ base44, body });
    const modules = {
      drift: result.drift,
      ghost: result.ghost,
      entropy: result.entropy,
      predictor: result.predictor,
      surfaces: result.surfaces,
      unread: result.unread,
      refusals: result.refusals,
      limits: result.limits
    };

    if (runId) {
      await base44.entities.IntelRun.update(runId, { status: 'complete', modules });
    }

    console.log(
      'sovereignIntel: ' + result.target_url +
      ' surfaces=' + result.surfaces.length +
      ' drift=' + result.drift.rows.filter((row) => row.state === 'tracked').length + ' tracked' +
      ' deleted=' + result.ghost.rows.reduce((sum, row) => sum + (row.deleted || 0), 0) +
      ' claims=' + result.entropy.rows.reduce((sum, row) => sum + row.claims.length, 0) +
      ' confirmed=' + result.predictor.confirmed.length
    );

    return Response.json({ ...result, run_id: runId || '' });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('sovereignIntel failed: ' + reason);
    try {
      if (runId) {
        const base44 = createClientFromRequest(req);
        await base44.entities.IntelRun.update(runId, { status: 'failed', error: reason });
      }
    } catch (cleanupError) {
      console.log('sovereignIntel cleanup failed: ' + (cleanupError && cleanupError.message));
    }
    return Response.json({ error: 'The intelligence pass failed: ' + reason }, { status: 500 });
  }
}