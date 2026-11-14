/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { indexRepository } from '../../shared/repoIndex.ts';

const NAME = /^[A-Za-z0-9_.-]{1,80}$/;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const owner = String(body.owner || '');
    const repo = String(body.repo || '');
    if (!NAME.test(owner) || !NAME.test(repo)) {
      return Response.json({ error: 'Pass an owner and a repo name.' }, { status: 400 });
    }

    const index = await indexRepository(owner, repo);
    console.log(
      'toolkitIndex: ' + owner + '/' + repo + ' read ' + index.totals.files + ' blobs, ' + index.totals.groups + ' subsystems'
    );
    return Response.json(index);
  } catch (error: any) {
    console.log('toolkitIndex failed: ' + (error && error.message));
    if (error && error.status === 404) {
      return Response.json({ error: 'Repository not found, or private to an account this app cannot read.' }, { status: 404 });
    }
    if (error && (error.status === 403 || error.status === 429)) {
      return Response.json({ error: 'GitHub rate limit reached. Try again in a minute.' }, { status: 429 });
    }
    return Response.json(
      { error: (error && error.message) || 'The repository tree could not be read.' },
      { status: 500 }
    );
  }
}