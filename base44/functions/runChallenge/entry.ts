/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { packById, skillsByIds } from '../../shared/labSkills.ts';
import {
  CHALLENGE_STAGES,
  DOSSIER_SCHEMA,
  buildDossierPrompt,
  seedStages,
  stageRunning,
  stageComplete
} from '../../shared/lab.ts';
import { selectProbes, runProbe, formatProbes, assertPublicUrl } from '../../shared/readOnly.ts';
import { startRun, markRunning, markComplete, finishRun } from '../../shared/runTracker.ts';

function summarizeFindings(findings: unknown): string {
  if (!Array.isArray(findings) || findings.length === 0) return '';
  return findings
    .slice(0, 6)
    .map((finding: any) => '- [' + (finding.observed ? 'observed' : 'inferred') + '] ' + (finding.claim || ''))
    .join('\n');
}

export default async function (req) {
  let runRecordId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const pack = packById(typeof body.pack_id === 'string' ? body.pack_id : '');
    if (!pack) return Response.json({ error: 'Unknown challenge pack.' }, { status: 400 });

    let source = null;
    if (typeof body.data_request_id === 'string' && body.data_request_id) {
      source = await base44.entities.DataRequest.get(body.data_request_id).catch(() => null);
      if (!source) return Response.json({ error: 'That data request was not found.' }, { status: 404 });
    } else {
      const page = await base44.entities.DataRequest.filter(
        { status: 'complete' },
        { sort: '-created_date', limit: 1 }
      );
      source = (page.items && page.items[0]) || null;
    }

    if (source && source.created_by_id && source.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targets: string[] = [];
    for (const raw of Array.isArray(source && source.authorized_targets) ? source.authorized_targets : []) {
      try {
        const safe = assertPublicUrl(raw);
        if (!targets.includes(safe)) targets.push(safe);
      } catch {
        // Drop a host the engine may no longer probe.
      }
    }

    if (targets.length === 0) {
      return Response.json({
        skipped: true,
        reason: 'No authorized host yet. Draft a data request with a host you are authorized to read, run it once, then use the pack.'
      });
    }

    const runRecord = await base44.entities.ChallengeRun.create({
      pack_id: pack.id,
      pack_name: pack.name,
      focus: pack.id,
      data_request_id: source ? source.id : '',
      target_urls: targets,
      status: 'running',
      stages: seedStages(CHALLENGE_STAGES)
    });
    runRecordId = runRecord.id;

    const telemetry = await startRun(base44, targets[0], 'live', CHALLENGE_STAGES);
    await base44.entities.ChallengeRun.update(runRecordId, { run_id: telemetry ? telemetry.id : '' });

    await stageRunning(base44, 'ChallengeRun', runRecordId, 'scope');
    await markRunning(base44, telemetry ? telemetry.id : null, 'scope');
    const skills = skillsByIds(pack.skills);
    const scopeDetail = pack.skills.length + ' skills · ' + targets.length + ' host' + (targets.length === 1 ? '' : 's');
    await stageComplete(base44, 'ChallengeRun', runRecordId, 'scope', scopeDetail);
    await markComplete(base44, telemetry ? telemetry.id : null, 'scope', scopeDetail);

    await stageRunning(base44, 'ChallengeRun', runRecordId, 'skills');
    await markRunning(base44, telemetry ? telemetry.id : null, 'skills');
    // Bound the pass by the pack's own size so every skill in it actually executes
    // on a single authorized host instead of the tail being silently dropped.
    const pairs = selectProbes(skills, targets, Math.max(6, skills.length));
    const results = await Promise.all(pairs.map((pair) => runProbe(pair.probe, pair.skill, pair.target)));
    const reproduced = results.filter((result) => result.reproduced).length;
    const skillsDetail = results.length + ' probes · ' + reproduced + ' reproduced';
    await stageComplete(base44, 'ChallengeRun', runRecordId, 'skills', skillsDetail);
    await markComplete(base44, telemetry ? telemetry.id : null, 'skills', skillsDetail);

    await stageRunning(base44, 'ChallengeRun', runRecordId, 'cascade');
    await markRunning(base44, telemetry ? telemetry.id : null, 'cascade');
    const cascadeDetail = results
      .filter((result) => result.reproduced)
      .map((result) => result.skill)
      .join(' · ') || 'No signal reproduced';
    await stageComplete(base44, 'ChallengeRun', runRecordId, 'cascade', cascadeDetail);
    await markComplete(base44, telemetry ? telemetry.id : null, 'cascade', cascadeDetail);

    await stageRunning(base44, 'ChallengeRun', runRecordId, 'dossier');
    await markRunning(base44, telemetry ? telemetry.id : null, 'dossier');
    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: buildDossierPrompt({
        packName: pack.name,
        question: pack.question,
        skills,
        probes: formatProbes(results),
        priorFindings: source ? summarizeFindings(source.findings) : ''
      }),
      response_json_schema: DOSSIER_SCHEMA
    });

    await stageComplete(base44, 'ChallengeRun', runRecordId, 'dossier', 'Verdict saved');
    await markComplete(base44, telemetry ? telemetry.id : null, 'dossier', 'Verdict saved');
    await finishRun(base44, telemetry ? telemetry.id : null, 'complete', { analysis_id: runRecordId });

    const saved = await base44.entities.ChallengeRun.update(runRecordId, {
      status: 'complete',
      dossier: llm || {},
      error: '',
      finished_at: new Date().toISOString()
    });

    return Response.json({ run: saved });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('runChallenge failed: ' + reason);
    try {
      const base44 = createClientFromRequest(req);
      if (runRecordId) {
        await base44.entities.ChallengeRun.update(runRecordId, {
          status: 'failed',
          error: reason,
          finished_at: new Date().toISOString()
        });
      }
    } catch (cleanupError) {
      console.log('runChallenge cleanup failed: ' + (cleanupError && cleanupError.message));
    }
    return Response.json({ error: 'The challenge run failed: ' + reason }, { status: 500 });
  }
}