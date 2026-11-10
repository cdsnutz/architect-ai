import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { PODS, TECHNIQUES, REV_CYCLE, SCOPE_GUARDRAIL, masterPrompt } from '../../shared/pods.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({
      pods: PODS,
      techniques: TECHNIQUES,
      revCycle: REV_CYCLE,
      scope: SCOPE_GUARDRAIL,
      masterPrompt: masterPrompt()
    });
  } catch (error) {
    console.error('podFramework: failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}