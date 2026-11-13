/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { FOCUSES, PACKS, SKILLS } from '../../shared/labSkills.ts';
import { crossWireMatrix } from '../../shared/crossWire.ts';
import { INGEST_SOURCES } from '../../shared/repoIngest.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({
      focuses: FOCUSES,
      packs: PACKS,
      skills: SKILLS,
      wiring: crossWireMatrix(),
      sources: INGEST_SOURCES
    });
  } catch (error) {
    console.log('labCatalog failed: ' + (error && error.message));
    return Response.json({ error: 'The skill catalog could not be loaded.' }, { status: 500 });
  }
}