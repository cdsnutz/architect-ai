/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.61';
import { runMarketIntel } from '../../shared/marketIntel.ts';
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

    const quota = await guardQuota(base44, user, 'market_run', 4);
    if (!quota.allowed) return quotaRefusal(quota);

    try {
      const seed = await base44.entities.MarketRun.create({
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
      console.log('marketIntel: could not open a run — ' + (error && error.message));
    }

    const result = await runMarketIntel({ base44, body });
    const modules = {
      gravity: result.gravity,
      cognitive: result.cognitive,
      agility: result.agility,
      surfaces: result.surfaces,
      unread: result.unread,
      refusals: result.refusals,
      limits: result.limits
    };

    if (runId) {
      await base44.entities.MarketRun.update(runId, { status: 'complete', modules });
    }

    console.log(
      'marketIntel: ' + result.target_url +
      ' surfaces=' + result.surfaces.length +
      ' money_share=' + result.gravity.rows.map((row) => row.host + ':' + row.money_share + '%').join(',') +
      ' load=' + result.cognitive.rows.map((row) => row.host + ':' + row.load).join(',') +
      ' agility=' + result.agility.rows.map((row) => row.host + ':' + row.state).join(',')
    );

    return Response.json({ ...result, run_id: runId || '' });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('marketIntel failed: ' + reason);
    try {
      if (runId) {
        const base44 = createClientFromRequest(req);
        await base44.entities.MarketRun.update(runId, { status: 'failed', error: reason });
      }
    } catch (cleanupError) {
      console.log('marketIntel cleanup failed: ' + (cleanupError && cleanupError.message));
    }
    return Response.json({ error: 'The command pass failed: ' + reason }, { status: 500 });
  }
}