/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { PODS, TECHNIQUES, REV_CYCLE, SCOPE_GUARDRAIL } from '../../shared/pods.ts';
import { LAYERS, SYNC_SEQUENCE } from '../../shared/layers.ts';
import { REA_TOOLS, REA_SKILLS, REA_AGENTS, REA_WORKFLOWS } from '../../shared/rea.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({
      tools: REA_TOOLS,
      skills: REA_SKILLS,
      agents: REA_AGENTS,
      workflows: REA_WORKFLOWS,
      pods: PODS,
      layers: LAYERS,
      sequence: SYNC_SEQUENCE,
      techniques: TECHNIQUES,
      revCycle: REV_CYCLE,
      scope: SCOPE_GUARDRAIL
    });
  } catch (error) {
    console.error('reaRegistry failed', error);
    return Response.json({ error: 'Registry unavailable: ' + (error && error.message ? error.message : 'Unknown error') }, { status: 500 });
  }
}