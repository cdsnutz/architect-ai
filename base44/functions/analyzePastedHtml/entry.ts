/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { extractEvidence, mapLogic } from '../../shared/analysis.ts';
import { PASTED_POD_STAGES, mapDetail, startRun, markRunning, markComplete, markSkipped, finishRun } from '../../shared/runTracker.ts';

const MAX_HTML = 900000;

export default async function (req) {
  let runId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const html = typeof body.html === 'string' ? body.html : '';
    const rawUrl = typeof body.source_url === 'string' ? body.source_url.trim() : '';
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 120) : '';

    if (html.trim().length < 200) {
      return Response.json({ error: 'Paste more of the page source — a few hundred characters at minimum.' }, { status: 400 });
    }
    if (html.length > MAX_HTML) {
      return Response.json({ error: 'That page is too large. Paste the HTML of a single page (under ~900k characters).' }, { status: 400 });
    }

    const slug = (label || 'gated-page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const url = /^https?:\/\/.+\..+/i.test(rawUrl) ? rawUrl : 'pasted://' + (slug || 'gated-page');

    const run = await startRun(base44, url, 'pasted', PASTED_POD_STAGES);
    runId = run ? run.id : null;

    await markRunning(base44, runId, 'perimeter');
    const { title, evidence } = extractEvidence(url, html);
    await markComplete(
      base44,
      runId,
      'perimeter',
      (label || title || 'pasted page') + ' · ' + Math.round(html.length / 1000) + 'k chars pasted'
    );

    await markSkipped(base44, runId, 'protocol', 'Pasted capture — no live endpoint to probe');

    await markRunning(base44, runId, 'map');
    const llm = await mapLogic(base44, evidence);
    await markComplete(base44, runId, 'map', mapDetail(llm));

    await markRunning(base44, runId, 'write');
    const record = await base44.entities.SiteAnalysis.create({
      url,
      title: label || title || 'Pasted page',
      summary: (llm && llm.app_summary) || '',
      logic_map: llm,
      access_state: 'gated_captured'
    });
    await markComplete(base44, runId, 'write', 'Dossier saved');
    await finishRun(base44, runId, 'complete', { analysis_id: record.id });

    return Response.json({ analysis: record });
  } catch (error) {
    const reason = error && error.message ? error.message : 'Unknown error';
    await finishRun(base44, runId, 'failed', { error: reason });
    console.log('analyzePastedHtml failed: ' + reason);
    return Response.json({ error: 'Analysis failed: ' + reason }, { status: 500 });
  }
}