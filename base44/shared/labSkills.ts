// The lab's unconventional skill catalog. Every skill is an observation technique that
// can be executed with anonymous GET/HEAD requests only — no writes, no credentials,
// no payloads. `probe` names the read-only routine in readOnly.ts that carries it out.

export type SkillFocus = 'legacy_migration' | 'production_incident' | 'adversarial_integration';

export type Skill = {
  id: string;
  name: string;
  focus: SkillFocus;
  pods: string[];
  probe: 'negotiate' | 'entropy' | 'silence' | 'clock' | 'surface' | 'cache';
  thesis: string;
  proves: string;
  falsifier: string;
};

export const FOCUSES = [
  { key: 'legacy_migration', label: 'Legacy migration', hint: 'Hidden writes, orphaned tables' },
  { key: 'production_incident', label: 'Production incident', hint: 'Cascades, retries, clock skew' },
  { key: 'adversarial_integration', label: 'Adversarial integration', hint: 'Contract erosion, silent 200s' },
  { key: 'custom', label: 'Custom', hint: 'Any read-only question' }
];

export const PODS = [
  'Perimeter Scout',
  'Protocol Analyst',
  'Schema Archaeologist',
  'Logic Reconstructor'
];

export const SKILLS: Skill[] = [
  {
    id: 'ghost-write',
    name: 'Ghost Write Hunter',
    focus: 'legacy_migration',
    pods: ['Schema Archaeologist', 'Logic Reconstructor'],
    probe: 'surface',
    thesis:
      'Maps every write affordance on a surface to an endpoint and a table, then flags the writes that nothing reads back — the rows a migration carries over and abandons.',
    proves: 'which stored state has no read path, so it can be dropped or archived deliberately.',
    falsifier:
      'A read path that renders the same field voids the orphan claim; one observed GET that returns the written value is enough.'
  },
  {
    id: 'orphaned-read',
    name: 'Orphaned Read Path',
    focus: 'legacy_migration',
    pods: ['Schema Archaeologist'],
    probe: 'negotiate',
    thesis:
      'Finds machine-readable representations that are still served for routes the current UI no longer calls — the read half of a half-finished migration.',
    proves: 'which legacy data contracts still answer, and in what shape, after the screen that used them was replaced.',
    falsifier: 'A route that answers only the HTML representation is not an orphaned API; it is just a page.'
  },
  {
    id: 'type-drift',
    name: 'Type Drift Sniper',
    focus: 'legacy_migration',
    pods: ['Schema Archaeologist'],
    probe: 'silence',
    thesis:
      'Compares what a payload promises structurally against what it actually carries, flagging fields that arrive empty, null or truncated — the drift that breaks a migration on real data.',
    proves: 'whether a contract is hollow in practice, independent of what its schema declares.',
    falsifier: 'A payload that carries populated values for every field voids the drift claim for that field.'
  },
  {
    id: 'retry-entropy',
    name: 'Retry Entropy Sniff',
    focus: 'production_incident',
    pods: ['Protocol Analyst'],
    probe: 'entropy',
    thesis:
      'Reads the same route twice and compares bytes, cache directives and latency to separate a live render from a cached replay that masks a double write.',
    proves: 'whether a retry is observable from outside at all, and the window in which it is not.',
    falsifier: 'A response that changes on every read proves the route is not cached and entropy is not masking the write.'
  },
  {
    id: 'clock-skew',
    name: 'Clock Skew Forensics',
    focus: 'production_incident',
    pods: ['Perimeter Scout'],
    probe: 'clock',
    thesis:
      'Reads the origin Date header against local time and the cache Age to expose skew — the quiet cause of out-of-order events and expired tokens during an incident.',
    proves: 'whether the origin clock or an intermediary cache is offset enough to reorder events.',
    falsifier: 'A Date header within a second of local time voids the skew claim for that origin.'
  },
  {
    id: 'cascade-cartography',
    name: 'Cascade Cartography',
    focus: 'production_incident',
    pods: ['Logic Reconstructor'],
    probe: 'cache',
    thesis:
      'Traces which responses are cacheable and for how long, so a failed dependency can be mapped to the window in which every dependent surface serves stale truth.',
    proves: 'the blast radius of one failed origin, expressed as cache windows rather than guesses.',
    falsifier: 'A response with no-store on every route voids the stale-blast-radius claim.'
  },
  {
    id: 'silence-mapper',
    name: 'Silence Mapper',
    focus: 'adversarial_integration',
    pods: ['Perimeter Scout'],
    probe: 'silence',
    thesis:
      'Hunts 200 responses that carry an empty or shell payload — the failure mode an integration happily stores as valid data.',
    proves: 'where a partner contract would silently persist nothing.',
    falsifier: 'A payload carrying the contract\'s required fields voids the silence claim.'
  },
  {
    id: 'contract-erosion',
    name: 'Contract Erosion Scan',
    focus: 'adversarial_integration',
    pods: ['Protocol Analyst'],
    probe: 'negotiate',
    thesis:
      'Asks the same route for the representation another client would ask for, exposing version skew and undocumented shapes that only one consumer sees.',
    proves: 'whether the documented contract is the one actually served to every client.',
    falsifier: 'An identical representation for every accepted content type voids the skew claim.'
  },
  {
    id: 'cache-poison-surface',
    name: 'Cache Poison Surface',
    focus: 'adversarial_integration',
    pods: ['Perimeter Scout', 'Protocol Analyst'],
    probe: 'cache',
    thesis:
      'Observes how a response is keyed and aged, and whether a client-supplied header changes what the next reader gets — the read-only shadow of a cache-poisoning bug.',
    proves: 'whether a shared cache sits between the client and the origin, and on what key.',
    falsifier: 'A response marked private or no-store voids the shared-cache claim.'
  }
];

export type Pack = {
  id: SkillFocus;
  name: string;
  objective: string;
  question: string;
  skills: string[];
};

export const PACKS: Pack[] = [
  {
    id: 'legacy_migration',
    name: 'Legacy migration',
    objective: 'Find hidden writes, orphaned reads and type drift before anything is carried over.',
    question: 'What in this system would a migration silently carry over, drop, or break on real data?',
    skills: ['ghost-write', 'orphaned-read', 'type-drift']
  },
  {
    id: 'production_incident',
    name: 'Production incident',
    objective: 'Trace a failure from the action to the row, including the windows caching hides.',
    question: 'Where can this system fail in a way its own surface cannot show?',
    skills: ['retry-entropy', 'clock-skew', 'cascade-cartography']
  },
  {
    id: 'adversarial_integration',
    name: 'Adversarial integration',
    objective: 'Expose silent 200s, contract erosion and cache-key assumptions.',
    question: 'What would this integration store as valid that is actually empty or wrong?',
    skills: ['silence-mapper', 'contract-erosion', 'cache-poison-surface']
  }
];

export function skillsForFocus(focus: string): Skill[] {
  if (focus === 'custom') return SKILLS;
  return SKILLS.filter((skill) => skill.focus === focus);
}

export function packById(id: string): Pack | null {
  return PACKS.find((pack) => pack.id === id) || null;
}

export function skillsByIds(ids: string[]): Skill[] {
  const wanted = Array.isArray(ids) ? ids : [];
  return SKILLS.filter((skill) => wanted.includes(skill.id) || wanted.includes(skill.name));
}