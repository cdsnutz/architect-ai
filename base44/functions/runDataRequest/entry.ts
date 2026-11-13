/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { skillsByIds, skillsForFocus } from '../../shared/labSkills.ts';
import { LAB_STAGES, FINDINGS_SCHEMA, buildFindingsPrompt, normalizeFindings, normalizeTraces, clampConfidence } from '../../shared/lab.ts';
import { selectProbes, runProbe, formatProbes, assertPublicUrl } from '../../shared/readOnly.ts';
import { startRun, markRunning, markComplete, finishRun } from '../../shared/runTracker.ts';

export default async function (req) {
  let runId = null;
  let recordId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (!body.id || typeof body.id !== 'string') {
      return Response.json({ error: 'A request id is required.' }, { status: 400 });
    }
    recordId = body.id;

    const record = await base44.entities.DataRequest.get(recordId);
    if (!record) return Response.json({ error: 'That request no longer exists.' }, { status: 404 });
    if (record.created_by_id && record.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targets: string[] = [];
    for (const raw of Array.isArray(record.authorized_targets) ? record.authorized_targets : []) {
      try {
        const safe = assertPublicUrl(raw);
        if (!targets.includes(safe)) targets.push(safe);
      } catch {
        // Skip a host that is no longer probeable instead of failing the whole run.
      }
    }

    if (targets.length === 0) {
      await base44.entities.DataRequest.update(recordId, {
        status: 'planned',
        error: 'Authorize at least one public host before running the probes.'
      });
      return Response.json({ error: 'Authorize at least one public host before running the probes.' }, { status: 400 });
    }

    const focus = record.focus || 'custom';
    const plan = (record.plan && typeof record.plan === 'object' ? record.plan : {}) as Record<string, unknown>;
    const plannedSkills = skillsByIds(Array.isArray(plan.skills) ? (plan.skills as string[]) : []);
    const selected = (plannedSkills.length ? plannedSkills : skillsForFocus(focus)).slice(0, 4);

    const run = await startRun(base44, targets[0], 'live', LAB_STAGES);
    runId = run ? run.id : null;

    await base44.entities.DataRequest.update(recordId, {
      status: 'running',
      error: '',
      run_id: runId || ''
    });

    await markRunning(base44, runId, 'inventory');
    await markComplete(
      base44,
      runId,
      'inventory',
      targets.length + ' authorized host' + (targets.length === 1 ? '' : 's') + ' in scope'
    );

    await markRunning(base44, runId, 'skills');
    const pairs = selectProbes(selected, targets, 4);
    const results = await Promise.all(pairs.map((pair) => runProbe(pair.probe, pair.skill, pair.target)));
    const reproduced = results.filter((result) => result.reproduced).length;
    await markComplete(
      base44,
      runId,
      'skills',
      results.length + ' probes · ' + reproduced + ' signals reproduced'
    );

    await markRunning(base44, runId, 'synthesize');
    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildFindingsPrompt({
        request: record.request,
        focus,
        skills: selected,
        probes: formatProbes(results)
      }),
      response_json_schema: FINDINGS_SCHEMA
    });
    const findings = normalizeFindings(llm);
    await markComplete(
      base44,
      runId,
      'synthesize',
      findings.length + ' findings · ' + findings.filter((finding) => finding.observed).length + ' observed'
    );

    await markRunning(base44, runId, 'dossier');
    const payload = llm && typeof llm === 'object' ? (llm as Record<string, unknown>) : {};
    const saved = await base44.entities.DataRequest.update(recordId, {
      status: 'complete',
      summary: typeof payload.summary === 'string' ? payload.summary : '',
      confidence: clampConfidence(payload.confidence),
      findings,
      gaps: Array.isArray(payload.gaps) ? payload.gaps.slice(0, 6) : [],
      unverified: Array.isArray(payload.unverified) ? payload.unverified.slice(0, 6) : [],
      ledger_traces: normalizeTraces(llm),
      error: ''
    });
    await markComplete(base44, runId, 'dossier', 'Dossier saved');
    await finishRun(base44, runId, 'complete', { analysis_id: recordId });

    return Response.json({ request: saved });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('runDataRequest failed: ' + reason);
    try {
      const base44 = createClientFromRequest(req);
      if (recordId) {
        await base44.entities.DataRequest.update(recordId, { status: 'failed', error: reason });
      }
      await finishRun(base44, runId, 'failed', { error: reason });
    } catch (cleanupError) {
      console.log('runDataRequest cleanup failed: ' + (cleanupError && cleanupError.message));
    }
    return Response.json({ error: 'The probe pass failed: ' + reason }, { status: 500 });
  }
}