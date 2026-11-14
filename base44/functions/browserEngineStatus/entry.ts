/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { probeEngine } from '../../shared/browserEngine.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const status = await probeEngine();
    console.log(
      'browserEngineStatus: ' + status.id + ' configured=' + status.configured + ' reachable=' + status.reachable
    );
    return Response.json(status);
  } catch (error: any) {
    console.log('browserEngineStatus failed: ' + (error && error.message));
    return Response.json({ error: (error && error.message) || 'The engine could not be checked.' }, { status: 500 });
  }
}