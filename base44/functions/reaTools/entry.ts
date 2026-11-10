import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { mapLogic } from '../../shared/analysis.ts';
import {
  startRun,
  markRunning,
  markComplete,
  markSkipped,
  finishRun,
  mapDetail
} from '../../shared/runTracker.ts';
import {
  MAX_FILES,
  MAX_FILE_CHARS,
  MIN_SOURCE_CHARS,
  MACHINE_ACTIONS,
  SOURCE_POD_STAGES,
  mintToken,
  hashToken,
  sourceEvidence,
  sourceHeader,
  runDoctor,
  jobSpecFor
} from '../../shared/reaTools.ts';

async function findConnection(base44, token) {
  if (!token) return null;
  const hash = await hashToken(token);
  const page = await base44.asServiceRole.entities.ReaConnection.filter(
    { token_hash: hash, status: 'active' },
    { limit: 1 }
  ).catch(() => ({ items: [] }));
  const record = page.items[0];
  if (!record) return null;
  await base44.asServiceRole.entities.ReaConnection.update(record.id, {
    last_seen_at: new Date().toISOString()
  }).catch(() => null);
  return record;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';

    const connection = await findConnection(base44, req.headers.get('x-rea-token') || '');
    const user = connection ? null : await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!connection && !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (connection && !MACHINE_ACTIONS.includes(action)) {
      return Response.json({ error: 'This token may only run: ' + MACHINE_ACTIONS.join(', ') + '.' }, { status: 403 });
    }

    const userId = connection ? connection.created_by_id : user.id;
    const serviceRole = Boolean(connection);
    const siteAnalyses = serviceRole ? base44.asServiceRole.entities.SiteAnalysis : base44.entities.SiteAnalysis;

    if (action === 'connections') {
      const page = await base44.entities.ReaConnection.filter({}, { sort: '-created_date', limit: 20 });
      return Response.json({
        connections: page.items.map((item) => ({
          id: item.id,
          label: item.label,
          prefix: item.token_prefix,
          status: item.status,
          last_seen_at: item.last_seen_at,
          created_date: item.created_date
        }))
      });
    }

    if (action === 'connect') {
      const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 80) : 'Local agent';
      const token = mintToken();
      const record = await base44.entities.ReaConnection.create({
        label,
        agent_name: label,
        token_hash: await hashToken(token),
        token_prefix: token.slice(0, 12),
        status: 'active',
        last_seen_at: new Date().toISOString()
      });
      const appUrl = req.headers.get('x-base44-app-url') || '';
      const endpoint = appUrl ? appUrl.replace(/\/$/, '') + '/functions/reaTools' : '';

      return Response.json({
        token,
        endpoint,
        connection: { id: record.id, label: record.label, prefix: record.token_prefix },
        config: {
          endpoint,
          headers: { 'x-rea-token': token },
          calls: [
            { action: 'doctor', method: 'POST', body: { action: 'doctor' } },
            { action: 'job-spec', method: 'POST', body: { action: 'job-spec', analysis_id: '<dossier id>' } }
          ]
        }
      });
    }

    if (action === 'revoke') {
      const id = typeof body.connection_id === 'string' ? body.connection_id : '';
      if (!id) return Response.json({ error: 'connection_id is required.' }, { status: 400 });
      const record = await base44.entities.ReaConnection.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!record) return Response.json({ error: 'That connection no longer exists.' }, { status: 404 });
      await base44.entities.ReaConnection.update(id, { status: 'revoked' });
      return Response.json({ revoked: id });
    }

    if (action === 'doctor') {
      const result = await runDoctor(base44, { serviceRole, userId });
      return Response.json(result);
    }

    if (action === 'job-spec') {
      const wanted = typeof body.analysis_id === 'string' ? body.analysis_id : '';
      let record = null;
      if (wanted) {
        record = await siteAnalyses.get(wanted).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
        if (record && serviceRole && record.created_by_id !== userId) {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        const page = await siteAnalyses.filter(
          serviceRole ? { created_by_id: userId } : {},
          { sort: '-created_date', limit: 1 }
        );
        record = page.items[0] || null;
      }
      if (!record) return Response.json({ error: 'No dossier to hand over yet — map one first.' }, { status: 404 });
      return Response.json(jobSpecFor(record));
    }

    if (action === 'analyze') {
      if (serviceRole) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const rawFiles = Array.isArray(body.files) ? body.files.slice(0, MAX_FILES) : [];
      const files = rawFiles
        .filter((file) => file && typeof file.content === 'string' && file.content.trim())
        .map((file) => ({
          name: String(file.name || 'file').slice(0, 120),
          content: file.content.slice(0, MAX_FILE_CHARS)
        }));
      const totalChars = files.reduce((sum, file) => sum + file.content.length, 0);
      if (!files.length || totalChars < MIN_SOURCE_CHARS) {
        return Response.json({ error: 'Paste or attach at least one source file (200 characters or more).' }, { status: 400 });
      }

      const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 120) : 'Local checkout';
      const { modules, chars, evidence } = sourceEvidence(files);
      const url = 'source://' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const run = await startRun(base44, url, 'source', SOURCE_POD_STAGES);
      const runId = run ? run.id : null;

      await markRunning(base44, runId, 'perimeter');
      await markComplete(base44, runId, 'perimeter', modules.length + ' files · ' + Math.round(chars / 1000) + 'k chars of source');

      await markSkipped(base44, runId, 'protocol', 'Source pass — no live endpoint to probe');

      await markRunning(base44, runId, 'map');
      const llm = await mapLogic(base44, sourceHeader(label) + '\nEVIDENCE:\n' + evidence);
      await markComplete(base44, runId, 'map', mapDetail(llm));

      await markRunning(base44, runId, 'write');
      const record = await base44.entities.SiteAnalysis.create({
        url,
        title: label,
        summary: (llm && llm.app_summary) || '',
        logic_map: llm,
        access_state: 'public'
      });
      await markComplete(base44, runId, 'write', 'Dossier saved');
      await finishRun(base44, runId, 'complete', { analysis_id: record.id });

      return Response.json({ analysis: record });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.log('reaTools failed: ' + (error && error.message ? error.message : 'unknown'));
    return Response.json(
      { error: 'REA tool failed: ' + (error && error.message ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}