import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { extractEvidence, mapLogic } from '../../shared/analysis.ts';

const MAX_HTML = 900000;

export default async function (req) {
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

    const { title, evidence } = extractEvidence(url, html);
    const llm = await mapLogic(base44, evidence);

    const record = await base44.entities.SiteAnalysis.create({
      url,
      title: label || title || 'Pasted page',
      summary: (llm && llm.app_summary) || '',
      logic_map: llm,
      access_state: 'gated_captured'
    });

    return Response.json({ analysis: record });
  } catch (error) {
    console.log('analyzePastedHtml failed: ' + (error && error.message ? error.message : 'unknown'));
    return Response.json({ error: 'Analysis failed: ' + (error && error.message ? error.message : 'Unknown error') }, { status: 500 });
  }
}