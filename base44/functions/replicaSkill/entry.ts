/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  SKILL_CATALOG,
  parseFeatureMatrix,
  deriveFeatureMatrix,
  matrixToCsv,
  scoreParity,
  contrastCheck,
  sweepArtifacts,
  deriveSweepTargets,
  gateSummary,
  runSkillPipeline
} from '../../shared/replicaSkill.ts';
import { guardQuota, quotaRefusal } from '../../shared/quota.ts';

const ACTIONS = ['catalog', 'derive', 'parity', 'contrast', 'sweep', 'run_all'];
const MAX_MATRIX = 40000;
const MAX_TOKENS = 20000;
const MAX_FILES = 40;
const MAX_FILE_CHARS = 200000;

function text(value, limit) {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function stringList(value, limit) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.trim()).slice(0, limit).map((item) => item.trim());
}

function filesFromBody(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((file) => file && typeof file.path === 'string')
    .slice(0, MAX_FILES)
    .map((file) => ({
      path: file.path.slice(0, 200),
      content: typeof file.content === 'string' ? file.content.slice(0, MAX_FILE_CHARS) : ''
    }));
}

function bundleFiles(spec) {
  const bundle = Array.isArray(spec && spec.deploy_bundle) ? spec.deploy_bundle : [];
  // Only shippable artifacts are swept. The handoff document cites the source on purpose.
  return bundle
    .filter((file) => file && typeof file.path === 'string')
    .slice(0, MAX_FILES)
    .map((file) => ({ path: file.path.slice(0, 200), content: String(file.content || '').slice(0, MAX_FILE_CHARS) }));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : 'run_all';
    if (!ACTIONS.includes(action)) {
      return Response.json({ error: 'Unknown action. Use one of: ' + ACTIONS.join(', ') }, { status: 400 });
    }
    if (action === 'catalog') {
      return Response.json({ skills: SKILL_CATALOG });
    }

    const quota = await guardQuota(base44, user, 'replica_skill', 24);
    if (!quota.allowed) return quotaRefusal(quota);

    let spec = null;
    if (typeof body.spec_id === 'string' && body.spec_id) {
      spec = await base44.entities.RebuildSpec.get(body.spec_id).catch((error) =>
        error.status === 404 ? null : Promise.reject(error)
      );
      if (!spec) return Response.json({ error: 'Spec not found.' }, { status: 404 });
    }

    if (action === 'derive') {
      if (!spec) return Response.json({ error: 'spec_id is required to derive a matrix.' }, { status: 400 });
      const rows = deriveFeatureMatrix(spec.contracts || {});
      if (!rows.length) {
        return Response.json({ error: 'No contracts captured on this spec, so no matrix can be derived.' }, { status: 400 });
      }
      return Response.json({ matrix_csv: matrixToCsv(rows), rows: rows.length });
    }

    const stored = spec && spec.replica && typeof spec.replica === 'object' ? spec.replica : {};
    const wanted = action === 'run_all' ? ['parity', 'sweep', 'contrast'] : [action];
    const next = { ...stored, skills_version: 1 };

    if (wanted.includes('parity')) {
      const provided = text(body.matrix_csv, MAX_MATRIX);
      const storedMatrix = text(stored.matrix_csv, MAX_MATRIX);
      let matrixCsv = provided || storedMatrix;
      if (!matrixCsv && spec) matrixCsv = matrixToCsv(deriveFeatureMatrix(spec.contracts || {}));
      if (!matrixCsv.trim()) {
        return Response.json({ error: 'Post a feature matrix CSV or pick a spec with captured contracts.' }, { status: 400 });
      }
      next.matrix_csv = matrixCsv;
      try {
        next.parity = scoreParity(parseFeatureMatrix(matrixCsv));
      } catch (error) {
        return Response.json({ error: 'The feature matrix could not be read: ' + error.message }, { status: 400 });
      }
    }

    if (wanted.includes('sweep')) {
      const files = filesFromBody(body.files).length ? filesFromBody(body.files) : bundleFiles(spec);
      if (!files.length) {
        return Response.json({ error: 'Provide artifact files or run against a spec with a deploy bundle.' }, { status: 400 });
      }
      const derived = spec ? deriveSweepTargets(spec) : deriveSweepTargets({});
      const options = {
        avoid: stringList(body.avoid, 12).length ? stringList(body.avoid, 12) : stringList(stored.sweep && stored.sweep.avoid, 12).length ? stringList(stored.sweep.avoid, 12) : derived.avoid,
        domains: stringList(body.domains, 12).length ? stringList(body.domains, 12) : stringList(stored.sweep && stored.sweep.domains, 12).length ? stringList(stored.sweep.domains, 12) : derived.domains,
        colors: stringList(body.colors, 12).length ? stringList(body.colors, 12) : stringList(stored.sweep && stored.sweep.colors, 12)
      };
      try {
        const result = sweepArtifacts(files, options);
        next.sweep = { ...result, ...options, scanned: files.length, checked_at: new Date().toISOString() };
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    }

    if (wanted.includes('contrast')) {
      const tokens = body.tokens !== undefined ? body.tokens : text(stored.tokens_json, MAX_TOKENS);
      if (tokens === undefined || tokens === null || tokens === '') {
        if (action === 'contrast') {
          return Response.json({ error: 'Post a tokens.json object or a pairs list to check contrast.' }, { status: 400 });
        }
      } else {
        try {
          const result = contrastCheck(tokens);
          next.contrast = result;
          next.tokens_json = typeof tokens === 'string' ? tokens.slice(0, MAX_TOKENS) : JSON.stringify(tokens).slice(0, MAX_TOKENS);
        } catch (error) {
          if (action === 'contrast') {
            return Response.json({ error: 'Contrast check failed: ' + error.message }, { status: 400 });
          }
        }
      }
    }

    const gates = gateSummary({
      parity: next.parity || null,
      sweep: next.sweep || null,
      contrast: next.contrast || null
    });
    next.gates = gates.gates;
    next.score = gates.score;
    next.verdict = gates.verdict;
    next.checked_at = new Date().toISOString();
    next.checked_by = user.email || user.id;

    if (action === 'run_all') {
      const pipeline = runSkillPipeline({
        spec,
        contracts: (spec && spec.contracts) || {},
        parity: next.parity || null,
        sweep: next.sweep || null,
        contrast: next.contrast || null
      });
      next.stages = pipeline.stages;
      next.stage_counts = pipeline.stage_counts;
      next.ready_to_ship = pipeline.ready_to_ship;
      next.clone_handoff = pipeline.clone_handoff.slice(0, 100000);
    }

    if (!spec) {
      return Response.json({ replica: next });
    }

    const saved = await base44.entities.RebuildSpec.update(spec.id, { replica: next });
    return Response.json({ replica: next, spec: saved });
  } catch (error) {
    console.log('replicaSkill failed: ' + (error && error.message));
    return Response.json(
      { error: 'The replica check could not run: ' + (error && error.message ? error.message : 'unknown error') },
      { status: 500 }
    );
  }
}