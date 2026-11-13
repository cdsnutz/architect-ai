/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { compileSpec, contractsFromAnalysis, contractsFromRequest } from '../../shared/rebuildSpec.ts';

const DEFAULT_STACK = 'Node 20 + TypeScript + Fastify + Postgres (Neon) + Docker';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const analysis_id = typeof body.analysis_id === 'string' ? body.analysis_id : '';
    const request_id = typeof body.request_id === 'string' ? body.request_id : '';
    const stack = typeof body.stack === 'string' && body.stack.trim() ? body.stack.trim() : DEFAULT_STACK;

    if (!analysis_id && !request_id) {
      return Response.json({ error: 'Pass an analysis_id or a request_id to compile a spec.' }, { status: 400 });
    }

    let contracts;
    let meta;

    if (analysis_id) {
      const record = await base44.entities.SiteAnalysis.get(analysis_id);
      if (!record) return Response.json({ error: 'Analysis not found.' }, { status: 404 });
      contracts = contractsFromAnalysis(record);
      meta = { title: record.title || record.url || 'Rebuild', target_url: record.url, stack };
    } else {
      const record = await base44.entities.DataRequest.get(request_id);
      if (!record) return Response.json({ error: 'Data request not found.' }, { status: 404 });
      contracts = contractsFromRequest(record);
      meta = {
        title: record.title || 'Lab request rebuild',
        target_url: Array.isArray(record.authorized_targets) ? record.authorized_targets[0] || '' : '',
        stack
      };
    }

    const compiled = compileSpec(contracts, meta);

    if (!compiled.contract_counts.api_contracts && !compiled.contract_counts.ledger_traces) {
      return Response.json(
        { error: 'No contracts are captured on this record yet, so there is nothing to compile. Capture an analysis or run a lab request first.' },
        { status: 422 }
      );
    }

    const saved = await base44.entities.RebuildSpec.create({
      title: meta.title,
      target_url: meta.target_url || '',
      source_analysis_id: analysis_id || '',
      source_request_id: request_id || '',
      stack,
      contracts,
      contract_counts: compiled.contract_counts,
      spec_markdown: compiled.spec_markdown,
      runnable_spec: compiled.runnable_spec,
      deploy_bundle: compiled.deploy_bundle,
      status: 'ready'
    });

    return Response.json({ spec: saved });
  } catch (error) {
    console.log('buildRebuildSpec failed: ' + (error && error.message));
    return Response.json(
      { error: 'The rebuild spec could not be compiled: ' + (error && error.message ? error.message : 'unknown error') },
      { status: 500 }
    );
  }
}