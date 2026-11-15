/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { runGapAudit } from '../../shared/gapAudit.ts';

// One gap audit: the lead surface plus up to three winners, read once each.
// The result is written to GapAudit before it is returned. An unrecorded comparison
// cannot be cited, so the record id is the handle every downstream claim points at:
// claim -> GapAudit[id] -> evidence. If the write fails the pass still returns, with
// no id, and says so, because a figure nobody can re-open must not be quoted.
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

    let gapAuditId = null;
    let recordError = null;
    try {
      const record = await base44.entities.GapAudit.create({
        label: 'gap · ' + (audit.lead?.host || lead) + ' vs ' + (audit.winners || []).length + ' winner(s)',
        lead_url: audit.lead?.url || lead,
        winner_urls: (audit.winners || []).map((winner) => winner.url),
        ran_at: audit.ran_at,
        status: 'complete',
        coverage: audit.coverage,
        architecture: audit.architecture,
        intents: audit.intents,
        voids: audit.voids,
        keyword_voids: audit.keyword_voids,
        schema_gaps: audit.schema_gaps,
        briefs: audit.briefs,
        strike: audit.strike,
        limits: audit.limits
      });
      gapAuditId = record.id;
      console.log('analyzeGap recorded GapAudit ' + gapAuditId + ' for ' + (audit.lead?.host || lead));
    } catch (writeError) {
      recordError = writeError && writeError.message ? writeError.message : 'the record could not be written';
      console.log('analyzeGap could not record the pass: ' + recordError);
    }

    return Response.json({ ...audit, gap_audit_id: gapAuditId, record_error: recordError });
  } catch (error) {
    const reason = error && error.message ? error.message : 'unknown error';
    console.log('analyzeGap failed: ' + reason);
    return Response.json({ error: 'The gap audit failed: ' + reason }, { status: 500 });
  }
}