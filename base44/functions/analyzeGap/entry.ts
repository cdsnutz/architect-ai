/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { runGapAudit } from '../../shared/gapAudit.ts';

// One gap audit: the lead surface plus up to three winners, read once each.
// The result is returned to the caller, not written: an audit is evidence about
// surfaces this app does not own, and it is recomputed when the operator asks.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const lead = typeof body.lead_url === 'string' ? body.lead_url.trim() : '';
    if (!lead) return Response.json({ error: 'A lead surface URL is required.' }, { status: 400 });

    const winners = Array.isArray(body.winner_urls)
      ? body.winner_urls.filter((value) => typeof value === 'string' && value.trim()).slice(0, 4)
      : [];
    if (!winners.length) return Response.json({ error: 'Add at least one winner surface to compare against.' }, { status: 400 });

    const audit = await runGapAudit({ lead, winners });
    return Response.json(audit);
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('analyzeGap failed: ' + reason);
    return Response.json({ error: 'The gap audit failed: ' + reason }, { status: 500 });
  }
}