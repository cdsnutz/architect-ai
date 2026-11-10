// The lab's unconventional skill catalog. Every skill is an observation technique that
// can be executed with anonymous GET/HEAD requests only — no writes, no credentials,
// no payloads. `probe` names the read-only routine in readOnly.ts that carries it out.

export type SkillFocus = 'legacy_migration' | 'production_incident' | 'adversarial_integration';

export type Skill = {
  id: string;
  name: string;
  focus: SkillFocus;
  pods: string[];
  probe:
    | 'negotiate'
    | 'entropy'
    | 'silence'
    | 'clock'
    | 'surface'
    | 'cache'
    | 'generator'
    | 'conditional'
    | 'variance'
    | 'posture'
    | 'bundle'
    | 'sourcemap';
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
  },
  {
    id: 'framework-archaeology',
    name: 'Framework Archaeology',
    focus: 'legacy_migration',
    pods: ['Schema Archaeologist', 'Logic Reconstructor'],
    probe: 'generator',
    thesis:
      'Dates the running build from what the page admits about itself — generator meta, framework markers and content-hashed bundles — and flags a surface whose shell was served by a framework the migration was supposed to replace.',
    proves: 'which generation of the app is actually answering in production, and whether the old one is still live behind the new route.',
    falsifier: 'A surface with no generator meta, no framework marker and no hashed bundle is hand-served and cannot be dated this way.'
  },
  {
    id: 'validator-integrity',
    name: 'Validator Integrity Check',
    focus: 'production_incident',
    pods: ['Protocol Analyst', 'Perimeter Scout'],
    probe: 'conditional',
    thesis:
      'Sends the route its own validator back and watches for a 304, separating an edge that truly revalidates from one holding a decorative ETag — the reason an incident appears to fix itself until a hard refresh.',
    proves: 'whether staleness is detectable by any client, or only by a reader who happens to bypass the cache.',
    falsifier: 'A conditional re-read that returns 304 proves the validator is real and voids the decorative-tag claim.'
  },
  {
    id: 'variance-key',
    name: 'Variance Key Audit',
    focus: 'adversarial_integration',
    pods: ['Perimeter Scout', 'Protocol Analyst'],
    probe: 'variance',
    thesis:
      'Reads the same route under two different language preferences and checks the Vary declaration, exposing content that changes per reader while the cache key pretends it does not.',
    proves: 'whether two readers can receive each other\'s representation from a shared cache on this route.',
    falsifier: 'An identical body for both preferences, or a Vary header that declares the varied header, voids the key-mismatch claim.'
  },
  {
    id: 'boundary-posture',
    name: 'Boundary Posture Read',
    focus: 'adversarial_integration',
    pods: ['Perimeter Scout'],
    probe: 'posture',
    thesis:
      'Reads the surface\'s own boundary declarations — CSP, HSTS, framing and sniffing controls — beside the public robots and sitemap hints, placing what the edge is actually willing to enforce and which paths it advertises anyway.',
    proves: 'which browser-side controls are declared on this route, and which paths the surface publishes about itself.',
    falsifier: 'A response declaring all five controls voids the undeclared-control claim; a robots file with no disallow entries voids the route-hint claim.'
  },
  {
    id: 'bundle-exposure',
    name: 'Bundle Exposure Scan',
    focus: 'adversarial_integration',
    pods: ['Perimeter Scout', 'Schema Archaeologist'],
    probe: 'bundle',
    thesis:
      'Reads the same-origin scripts the page loads and flags credential-shaped strings — key formats, private-key blocks, literal bearer tokens and encoded JWTs — by pattern class only, never reproducing the matched value.',
    proves: 'whether the shipped client bundle carries secret-shaped material at all, without extracting it.',
    falsifier: 'Bundles whose scripts carry zero pattern matches void the exposure claim for that window.'
  },
  {
    id: 'sourcemap-exposure',
    name: 'Source Map Exposure',
    focus: 'adversarial_integration',
    pods: ['Perimeter Scout', 'Schema Archaeologist'],
    probe: 'sourcemap',
    thesis:
      'Asks whether the deployment publishes its own .map file beside the shipped bundle — the difference between a minified bundle and a readable copy of the original source sitting one URL away from every reader.',
    proves: 'whether this build is handing out its own source to anyone who opens devtools, without reading a single line of it.',
    falsifier: 'A bundle whose .map sibling is absent or does not answer 200 voids the source-map exposure claim for that build.'
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
    objective: 'Find hidden writes, orphaned reads, type drift and stale generations before anything is carried over.',
    question: 'What in this system would a migration silently carry over, drop, or break on real data?',
    skills: ['ghost-write', 'orphaned-read', 'type-drift', 'framework-archaeology']
  },
  {
    id: 'production_incident',
    name: 'Production incident',
    objective: 'Trace a failure from the action to the row, including the windows caching hides.',
    question: 'Where can this system fail in a way its own surface cannot show?',
    skills: ['retry-entropy', 'clock-skew', 'cascade-cartography', 'validator-integrity']
  },
  {
    id: 'adversarial_integration',
    name: 'Adversarial integration',
    objective: 'Expose silent 200s, contract erosion, cache-key assumptions, per-reader leakage and shipped secrets.',
    question: 'What would this integration store as valid that is actually empty or wrong?',
    skills: [
      'silence-mapper',
      'contract-erosion',
      'cache-poison-surface',
      'variance-key',
      'boundary-posture',
      'bundle-exposure',
      'sourcemap-exposure'
    ]
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