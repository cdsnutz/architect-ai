import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { FOCUSES, PACKS, SKILLS } from '../../shared/labSkills.ts';
import { crossWireMatrix } from '../../shared/crossWire.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    return Response.json({ focuses: FOCUSES, packs: PACKS, skills: SKILLS, wiring: crossWireMatrix() });
  } catch (error) {
    console.log('labCatalog failed: ' + (error && error.message));
    return Response.json({ error: 'The skill catalog could not be loaded.' }, { status: 500 });
  }
}