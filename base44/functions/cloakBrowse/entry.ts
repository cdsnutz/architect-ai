/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { captureViaRunner, runnerConfig } from '../../shared/browserEngine.ts';

// One authorized read-only pass, executed by the CloakBrowser runner on your
// own host. The app never opens the browser itself: it hands the target over
// and returns the evidence the runner measured.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const targetUrl = String(body.target_url || body.url || '').trim();
    if (!targetUrl) return Response.json({ error: 'target_url is required' }, { status: 400 });

    if (!runnerConfig().url) {
      return Response.json(
        {
          error: 'No runner is configured. Save the https address of your CloakBrowser host as CLOAKBROWSER_RUNNER_URL.',
          configured: false
        },
        { status: 503 }
      );
    }

    // body.proxy is deliberately ignored: the exit proxy is operator config,
    // never something the caller chooses.
    const result = await captureViaRunner(targetUrl, {
      geoip: Boolean(body.geoip),
      preset: body.preset ? String(body.preset) : undefined,
      headed: Boolean(body.headed)
    });

    console.log(
      'cloakBrowse: ' + targetUrl + ' ok=' + result.ok + ' status=' + result.status + (result.ok ? '' : ' error=' + result.error)
    );

    if (!result.ok) {
      return Response.json({ ok: false, error: result.error, status: result.status }, { status: 502 });
    }
    return Response.json({ ok: true, evidence: result.evidence });
  } catch (error: any) {
    console.log('cloakBrowse failed: ' + (error && error.message));
    return Response.json({ error: (error && error.message) || 'The pass could not be handed to the runner.' }, { status: 500 });
  }
}