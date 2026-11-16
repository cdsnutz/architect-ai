/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.61';
import { runWarRoom, buildRoadmap } from '../../shared/warRoom.ts';
import { verifyTargetOwnership } from '../../shared/symmetry.ts';
import { guardQuota, quotaRefusal } from '../../shared/quota.ts';

// One endpoint for the war room: `run` reads the surfaces and returns the
// blueprint, `outmaneuver` sequences the stored blueprint into a roadmap.
export default async function (req) {
  let runId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : 'run';

    if (action === 'outmaneuver') {
      const id = typeof body.run_id === 'string' ? body.run_id.trim() : '';
      if (!id) return Response.json({ error: 'run_id is required.' }, { status: 400 });

      const record = await base44.entities.WarRoomRun.get(id).catch((error) =>
        error.status === 404 ? null : Promise.reject(error)
      );
      if (!record) return Response.json({ error: 'That run was not found.' }, { status: 404 });
      if (!record.blueprint) {
        return Response.json({ error: 'That run holds no blueprint to sequence yet.' }, { status: 400 });
      }

      const quota = await guardQuota(base44, user, 'outmaneuver', 12);
      if (!quota.allowed) return quotaRefusal(quota);

      const roadmap = buildRoadmap({ blueprint: record.blueprint });
      await base44.entities.WarRoomRun.update(id, { roadmap });

      console.log('warRoom outmaneuver: ' + id + ' weeks=' + roadmap.weeks.length);
      return Response.json({ roadmap, run_id: id });
    }

    if (typeof body.target_url !== 'string' || !body.target_url.trim()) {
      return Response.json({ error: 'target_url is required.' }, { status: 400 });
    }

    const quota = await guardQuota(base44, user, 'war_room_run', 3);
    if (!quota.allowed) return quotaRefusal(quota);

    // Control of the target host is proven before a run record exists. A typed
    // attestation is not authorization to read a surface a caller does not own.
    try {
      await verifyTargetOwnership(body.target_url);
    } catch (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    try {
      const seed = await base44.entities.WarRoomRun.create({
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
      console.log('warRoom: could not open a run — ' + (error && error.message));
    }

    const blueprint = await runWarRoom(body);

    if (runId) {
      await base44.entities.WarRoomRun.update(runId, {
        status: 'complete',
        competitor_urls: blueprint.competitors.map((competitor) => competitor.url),
        blueprint
      });
    }

    console.log(
      'warRoom: ' + blueprint.target_url +
      ' exposure=' + blueprint.vulnerabilities.counts.total +
      ' critical=' + blueprint.vulnerabilities.counts.critical +
      ' cluster=' + blueprint.leapfrog.coverage.cluster +
      ' gap=' + blueprint.leapfrog.coverage.gap_pct + '%' +
      ' symmetry=' + blueprint.symmetry.score + '%'
    );

    return Response.json({ ...blueprint, run_id: runId || '' });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('warRoom failed: ' + reason);
    try {
      if (runId) {
        const base44 = createClientFromRequest(req);
        await base44.entities.WarRoomRun.update(runId, { status: 'failed', error: reason });
      }
    } catch (cleanupError) {
      console.log('warRoom cleanup failed: ' + (cleanupError && cleanupError.message));
    }
    return Response.json({ error: 'The war room pass failed: ' + reason }, { status: 500 });
  }
}