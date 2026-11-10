import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { validateDossier } from '../../shared/validation.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const analysis_id = typeof body.analysis_id === 'string' ? body.analysis_id : '';
    if (!analysis_id) return Response.json({ error: 'analysis_id is required.' }, { status: 400 });

    const record = await base44.entities.SiteAnalysis.get(analysis_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!record) return Response.json({ error: 'Analysis not found.' }, { status: 404 });
    if (record.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await validateDossier(base44, record);
    return Response.json(result);
  } catch (error) {
    console.error('reaValidate failed', error);
    return Response.json({ error: 'Validation failed: ' + (error && error.message ? error.message : 'Unknown error') }, { status: 500 });
  }
}