import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { FOCUSES, skillsForFocus } from '../../shared/labSkills.ts';
import { PLAN_SCHEMA, buildPlanPrompt, normalizePlan } from '../../shared/lab.ts';
import { assertPublicUrl } from '../../shared/readOnly.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const request = typeof body.request === 'string' ? body.request.trim().slice(0, 2000) : '';
    if (request.length < 12) {
      return Response.json({ error: 'Describe the problem in a sentence or two before drafting a plan.' }, { status: 400 });
    }

    const focus = FOCUSES.some((option) => option.key === body.focus) ? body.focus : 'custom';

    const authorized: string[] = [];
    for (const host of Array.isArray(body.targets) ? body.targets.slice(0, 4) : []) {
      try {
        const safe = assertPublicUrl(host);
        if (!authorized.includes(safe)) authorized.push(safe);
      } catch {
        // A host the engine may not probe is dropped rather than planned against.
      }
    }

    const skills = skillsForFocus(focus);
    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildPlanPrompt({ request, focus, skills, hosts: authorized }),
      response_json_schema: PLAN_SCHEMA
    });

    const plan = normalizePlan(llm, { authorized, skills });

    const record = await base44.entities.DataRequest.create({
      request,
      title: (plan.title as string) || request.slice(0, 80),
      focus,
      status: 'planned',
      plan,
      authorized_targets: authorized
    });

    return Response.json({ request: record });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('planDataRequest failed: ' + reason);
    return Response.json({ error: 'The plan could not be drafted: ' + reason }, { status: 500 });
  }
}