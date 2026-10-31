import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getEntitlement } from '../../shared/entitlement.ts';
import { extractEvidence, mapLogic } from '../../shared/analysis.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const entitlement = await getEntitlement(base44, user);
    if (!entitlement.admin && entitlement.remaining <= 0) {
      return Response.json({
        error: 'Each website needs its own paid analysis. Buy access for another website to keep mapping.',
        code: 'payment_required'
      }, { status: 403 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string' || !/^https?:\/\/.+\..+/i.test(url.trim())) {
      return Response.json({ error: 'Please provide a valid http(s) URL.' }, { status: 400 });
    }
    const targetUrl = url.trim();

    let html = '';
    try {
      const res = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LogicMapper/1.0)', Accept: 'text/html,*/*' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000)
      });
      if (!res.ok) {
        return Response.json({ error: 'The site responded with HTTP ' + res.status + ' and could not be analyzed.' }, { status: 502 });
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType && !/text\/html|text\/plain|application\/(xhtml|xml|json)/i.test(contentType)) {
        return Response.json({ error: 'That URL is not an HTML page (' + contentType.split(';')[0] + ').' }, { status: 400 });
      }
      html = (await res.text()).slice(0, 800000);
    } catch (fetchError) {
      const reason = fetchError && fetchError.name === 'TimeoutError' ? 'The request timed out.' : 'The site could not be reached.';
      return Response.json({ error: 'Could not fetch that URL. ' + reason }, { status: 502 });
    }

    const { title, evidence } = extractEvidence(targetUrl, html);
    const llm = await mapLogic(base44, evidence);

    const record = await base44.entities.SiteAnalysis.create({
      url: targetUrl,
      title: title || targetUrl,
      summary: (llm && llm.app_summary) || '',
      logic_map: llm
    });

    return Response.json({ analysis: record });
  } catch (error) {
    return Response.json({ error: 'Analysis failed: ' + (error && error.message ? error.message : 'Unknown error') }, { status: 500 });
  }
}