/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { extractEvidence, mapLogic } from '../../shared/analysis.ts';
import { probeContentNegotiation, formatProbe } from '../../shared/probe.ts';
import { POD_STAGES, mapDetail, startRun, markRunning, markComplete, finishRun } from '../../shared/runTracker.ts';

export default async function (req) {
  let runId = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url || typeof url !== 'string' || !/^https?:\/\/.+\..+/i.test(url.trim())) {
      return Response.json({ error: 'Please provide a valid http(s) URL.' }, { status: 400 });
    }
    const targetUrl = url.trim();

    const host = new URL(targetUrl).hostname.toLowerCase();
    if (host === 'base44.com' || host.endsWith('.base44.com')) {
      return Response.json({
        error: 'The Base44 platform itself is out of scope. Analyze your own app or a site you are authorised to test.'
      }, { status: 400 });
    }

    const run = await startRun(base44, targetUrl, 'live', POD_STAGES);
    runId = run ? run.id : null;

    let html = '';
    await markRunning(base44, runId, 'perimeter');
    try {
      const res = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LogicMapper/1.0)', Accept: 'text/html,*/*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });
      if (!res.ok) {
        await finishRun(base44, runId, 'failed', { error: 'The site responded with HTTP ' + res.status });
        return Response.json({ error: 'The site responded with HTTP ' + res.status + ' and could not be analyzed.' }, { status: 502 });
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType && !/text\/html|text\/plain|application\/(xhtml|xml|json)/i.test(contentType)) {
        await finishRun(base44, runId, 'failed', { error: 'Not an HTML page (' + contentType.split(';')[0] + ')' });
        return Response.json({ error: 'That URL is not an HTML page (' + contentType.split(';')[0] + ').' }, { status: 400 });
      }
      html = (await res.text()).slice(0, 800000);
    } catch (fetchError) {
      const reason = fetchError && fetchError.name === 'TimeoutError' ? 'The request timed out.' : 'The site could not be reached.';
      await finishRun(base44, runId, 'failed', { error: reason });
      return Response.json({ error: 'Could not fetch that URL. ' + reason }, { status: 502 });
    }

    const { title, evidence, links } = extractEvidence(targetUrl, html);
    await markComplete(
      base44,
      runId,
      'perimeter',
      (title || 'untitled') + ' · ' + links.length + ' internal links · ' + Math.round(html.length / 1000) + 'k chars of source'
    );

    await markRunning(base44, runId, 'protocol');
    const probe = await probeContentNegotiation(targetUrl, links);
    const negotiated = probe.filter((p) => p.verdict === 'changed' || p.verdict === 'status_changed').length;
    await markComplete(base44, runId, 'protocol', probe.length + ' routes probed · ' + negotiated + ' content-negotiated');

    await markRunning(base44, runId, 'map');
    const llm = await mapLogic(base44, evidence + '\n\n' + formatProbe(probe));
    await markComplete(base44, runId, 'map', mapDetail(llm));

    await markRunning(base44, runId, 'write');
    const record = await base44.entities.SiteAnalysis.create({
      url: targetUrl,
      title: title || targetUrl,
      summary: (llm && llm.app_summary) || '',
      logic_map: { ...(llm || {}), header_probe: probe }
    });
    await markComplete(base44, runId, 'write', 'Dossier saved');
    await finishRun(base44, runId, 'complete', { analysis_id: record.id });

    return Response.json({ analysis: record });
  } catch (error) {
    const reason = error && error.message ? error.message : 'Unknown error';
    await finishRun(base44, runId, 'failed', { error: reason });
    return Response.json({ error: 'Analysis failed: ' + reason }, { status: 500 });
  }
}