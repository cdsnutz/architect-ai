/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { validateDossier } from '../../shared/validation.ts';
import { guardQuota, quotaRefusal } from '../../shared/quota.ts';

// Scheduled sweep: validates the oldest dossiers that never got a validation pass.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const quota = await guardQuota(base44, user, 'rea_sweep', 2);
    if (!quota.allowed) return quotaRefusal(quota);

    const page = await base44.asServiceRole.entities.SiteAnalysis.filter(
      { validation: { $exists: false } },
      { sort: 'created_date', limit: 3 }
    );
    const pending = page.items || [];

    if (pending.length === 0) return Response.json({ swept: 0, results: [] });

    const settled = await Promise.allSettled(pending.map((record) => validateDossier(base44, record)));
    const results = settled.map((outcome, index) =>
      outcome.status === 'fulfilled'
        ? { analysis_id: pending[index].id, verdict: outcome.value.verdict, parity_score: outcome.value.parity_score }
        : { analysis_id: pending[index].id, error: String(outcome.reason && outcome.reason.message ? outcome.reason.message : outcome.reason) }
    );

    return Response.json({ swept: results.length, results });
  } catch (error) {
    console.error('reaSweep failed', error);
    return Response.json({ error: 'Sweep failed: ' + (error && error.message ? error.message : 'Unknown error') }, { status: 500 });
  }
}