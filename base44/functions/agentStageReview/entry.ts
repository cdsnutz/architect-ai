/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { missingCaptureInputs, requestStageReviews, applyStageReviews, reviewSummary } from '../../shared/agentStage.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const specId = typeof body.spec_id === 'string' ? body.spec_id : '';
    if (!specId) return Response.json({ error: 'spec_id is required' }, { status: 400 });

    const spec = await base44.entities.RebuildSpec.get(specId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!spec) return Response.json({ error: 'Spec not found' }, { status: 404 });

    const missing = missingCaptureInputs(spec);
    if (missing.length) {
      return Response.json(
        { error: 'Sign-off needs the full capture first. Missing: ' + missing.join(', ') + '.', missing },
        { status: 409 }
      );
    }

    const stages = spec.replica && Array.isArray(spec.replica.stages) ? spec.replica.stages : [];

    const reviews = await requestStageReviews(base44, { spec, stages });
    if (!reviews.length) {
      return Response.json({ error: 'No stage-owning agent could be reached for a sign-off.' }, { status: 502 });
    }

    const applied = applyStageReviews(stages, reviews);

    const saved = await base44.entities.RebuildSpec.update(specId, {
      replica: {
        ...(spec.replica || {}),
        stages: applied.stages,
        stage_counts: applied.stage_counts,
        ready_to_ship: applied.ready_to_ship,
        agent_review: {
          checked_at: new Date().toISOString(),
          by: user.email || user.id,
          ...reviewSummary(reviews)
        }
      }
    });

    console.log('agentStageReview: ' + reviews.length + ' stages reviewed, ' + applied.stage_counts.needs_input + ' need input');
    return Response.json({ spec: saved, reviews, stage_counts: applied.stage_counts });
  } catch (error) {
    console.log('agentStageReview failed: ' + (error && error.message ? error.message : 'unknown error'));
    return Response.json({ error: error.message }, { status: 500 });
  }
}