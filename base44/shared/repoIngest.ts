// Repository ingestion: turns a GitHub repo into a gitingest-style digest and a
// gitdiagram-style architecture map. Read-only by construction — the caller only
// reads file trees and file contents, never writes to the repository.

export const INGEST_SOURCES = [
  {
    id: 'gitingest',
    name: 'gitingest.com',
    url: 'https://gitingest.com',
    role: 'Digest reference',
    note: 'Flattens a repository into one prompt-ready digest. Local ingest mirrors that digest layout.'
  },
  {
    id: 'gitdiagram',
    name: 'gitdiagram.com',
    url: 'https://gitdiagram.com',
    role: 'Diagram reference',
    note: 'Draws a repository as a system diagram. Local ingest derives the module graph from import statements.'
  }
];

export const INGEST_MAX_FILES = 140;
export const INGEST_MAX_FILE_CHARS = 6000;
export const INGEST_MAX_DIGEST_CHARS = 120000;

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  'vendor',
  'coverage',
  '.venv',
  'venv',
  '__pycache__',
  '.cache',
  'target',
  'public'
]);

const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'pdf', 'zip', 'gz', 'tgz', 'tar',
  'woff', 'woff2', 'ttf', 'eot', 'otf', 'mp4', 'mov', 'mp3', 'wav', 'so', 'dll', 'exe',
  'jar', 'class', 'pyc', 'wasm', 'map', 'lock'
]);

const SOURCE_EXT = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'py', 'go', 'rs', 'java', 'rb', 'php', 'cs', 'kt',
  'swift', 'c', 'h', 'cpp', 'hpp', 'css', 'scss', 'sass', 'html', 'json', 'yml', 'yaml',
  'toml', 'md', 'sql', 'sh', 'vue', 'svelte'
]);

const LAYER_NAMES = ['Interface', 'Service', 'Data', 'Test', 'Config', 'Other'];
const RESOLVE_EXT = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'py', 'go', 'rs', 'vue', 'svelte'];
const MAX_IMPORT_SCAN = 400;

function extensionOf(path: string): string {
  const name = path.split('/').pop() || '';
  return name.includes('.') ? name.split('.').pop().toLowerCase() : '';
}

export function parseRepoUrl(input: unknown): { owner: string; repo: string; branch: string } | null {
  const raw = String(input || '').trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/^git@github\.com:/i, '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '');
  const parts = cleaned.split('/').filter(Boolean);
  const start = parts[0] && parts[0].toLowerCase().includes('github.com') ? 1 : 0;
  const owner = parts[start] || '';
  const repo = (parts[start + 1] || '').replace(/\.git$/i, '');
  if (!owner || !repo) return null;
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null;
  const treeIndex = parts.indexOf('tree');
  const branch = treeIndex > -1 && parts[treeIndex + 1] ? parts[treeIndex + 1] : '';
  return { owner, repo, branch };
}

export function isSourceFile(path: string): boolean {
  const segments = path.split('/');
  if (segments.some((segment) => SKIP_DIRS.has(segment))) return false;
  const name = segments[segments.length - 1] || '';
  if (!name) return false;
  if (name.endsWith('.lock') || name.endsWith('.min.js') || name.endsWith('.min.css')) return false;
  const ext = extensionOf(name);
  if (!ext || BINARY_EXT.has(ext)) return false;
  return SOURCE_EXT.has(ext);
}

export function countLines(text: string): number {
  return String(text || '').split('\n').length;
}

export function selectPaths(paths: string[], limit = INGEST_MAX_FILES): string[] {
  return paths
    .filter(isSourceFile)
    .sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b))
    .slice(0, limit);
}

export function moduleKey(path: string): string {
  const parts = path.split('/');
  if (parts.length <= 1) return '(root)';
  if (parts.length === 2) return parts[0];
  return parts.slice(0, 2).join('/');
}

export function classifyLayer(path: string): string {
  if (/(^|\/)(tests?|__tests__|spec)(\/|$)/.test(path) || /\.(test|spec)\./.test(path)) return 'Test';
  if (
    /(^|\/)(models|db|database|schema|schemas|migrations|entities|prisma|repositories)(\/|$)/.test(path) ||
    /\.sql$/.test(path)
  ) {
    return 'Data';
  }
  if (/(^|\/)(api|server|routes|controllers|handlers|services|functions|backend|resolvers)(\/|$)/.test(path)) {
    return 'Service';
  }
  if (
    /(^|\/)(pages|views|components|ui|screens|app|layouts|hooks|styles)(\/|$)/.test(path) ||
    /\.(tsx|jsx|vue|svelte|css|scss|html)$/.test(path)
  ) {
    return 'Interface';
  }
  if (
    /(^|\/)(config|configs|scripts)(\/|$)/.test(path) ||
    !path.includes('/') ||
    /\.(json|ya?ml|toml|ini)$/.test(path)
  ) {
    return 'Config';
  }
  return 'Other';
}

function jsSpecs(content: string): string[] {
  const specs: string[] = [];
  const re = /(?:from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"])/g;
  let match = re.exec(content);
  while (match && specs.length < MAX_IMPORT_SCAN) {
    const spec = match[1] || match[2] || match[3];
    if (spec) specs.push(spec);
    match = re.exec(content);
  }
  return specs;
}

function pySpecs(content: string): string[] {
  const specs: string[] = [];
  const re = /^\s*(?:from\s+([A-Za-z_.][\w.]*)\s+import\b|import\s+([A-Za-z_][\w.]*))/gm;
  let match = re.exec(content);
  while (match && specs.length < MAX_IMPORT_SCAN) {
    const spec = match[1] || match[2];
    if (spec) specs.push(spec);
    match = re.exec(content);
  }
  return specs;
}

function barePackage(spec: string): string {
  if (!spec || spec.startsWith('.') || spec.startsWith('/') || /^[a-z]+:/.test(spec)) return '';
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

const PY_STDLIB = new Set([
  'os', 'sys', 're', 'json', 'typing', 'pathlib', 'logging', 'asyncio', 'time', 'datetime', 'collections',
  'dataclasses', 'functools', 'itertools', 'subprocess', 'shutil', 'math', 'random', 'uuid', 'hashlib',
  'unittest', 'argparse', 'io', 'base64', 'copy', 'enum', 'abc', 'contextlib', 'urllib', 'http', 'threading',
  '__future__', 'warnings', 'importlib', 'tempfile', 'traceback', 'types', 'glob', 'statistics', 'textwrap'
]);

function resolvePython(fromPath: string, spec: string, known: Set<string>): string {
  const dots = (spec.match(/^\.+/) || [''])[0].length;
  const path = spec.slice(dots).replace(/\./g, '/');
  if (dots > 0) {
    const stack = fromPath.split('/').slice(0, -1);
    for (let i = 1; i < dots; i += 1) stack.pop();
    if (!path) {
      const base = stack.join('/');
      return known.has(base + '/__init__.py') ? base + '/__init__.py' : '';
    }
    const target = stack.concat(path.split('/')).join('/');
    if (known.has(target + '.py')) return target + '.py';
    if (known.has(target + '/__init__.py')) return target + '/__init__.py';
    return '';
  }
  if (known.has(path + '.py')) return path + '.py';
  if (known.has(path + '/__init__.py')) return path + '/__init__.py';
  for (const file of known) {
    if (file.endsWith('/' + path + '.py') || file.endsWith('/' + path + '/__init__.py')) return file;
  }
  return '';
}

function resolveImport(fromPath: string, spec: string, known: Set<string>): string {
  const stack = fromPath.split('/').slice(0, -1);
  for (const piece of spec.split('/')) {
    if (!piece || piece === '.') continue;
    if (piece === '..') {
      stack.pop();
      continue;
    }
    stack.push(piece);
  }
  const target = stack.join('/');
  if (!target) return '';
  if (known.has(target)) return target;
  for (const ext of RESOLVE_EXT) {
    if (known.has(target + '.' + ext)) return target + '.' + ext;
    if (known.has(target + '/index.' + ext)) return target + '/index.' + ext;
  }
  if (known.has(target + '/__init__.py')) return target + '/__init__.py';
  return '';
}

function directoryTree(paths: string[]): string {
  const dirs = new Set<string>();
  for (const path of paths) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i += 1) dirs.add(parts.slice(0, i).join('/') + '/');
  }
  return Array.from(dirs).sort().join('\n') || '(flat repository)';
}

export function trimDigest(text: string, limit = INGEST_MAX_DIGEST_CHARS): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + '\n\n... [digest truncated at ' + limit + ' characters]';
}

export function buildDigest(args: {
  owner: string;
  repo: string;
  branch: string;
  meta: { description?: string | null; language?: string | null; stars?: number | null; forks?: number | null };
  files: { path: string; content: string; lines: number }[];
  trackedCount: number;
}): string {
  const { owner, repo, branch, meta, files, trackedCount } = args;
  const totalLines = files.reduce((sum, file) => sum + file.lines, 0);
  const header = [
    'Repository: ' + owner + '/' + repo,
    'Branch: ' + branch,
    'Description: ' + (meta.description || 'not provided'),
    'Language: ' + (meta.language || 'unknown'),
    'Stars: ' + Number(meta.stars || 0) + ' | Forks: ' + Number(meta.forks || 0),
    'Files ingested: ' + files.length + ' of ' + trackedCount + ' tracked blobs',
    'Lines: ' + totalLines,
    'Generated: ' + new Date().toISOString()
  ].join('\n');
  const rule = '='.repeat(60);
  const body = files
    .map((file) => rule + '\nFILE: ' + file.path + '\n' + rule + '\n' + file.content)
    .join('\n\n');
  return trimDigest(header + '\n\nDirectory structure:\n' + directoryTree(files.map((f) => f.path)) + '\n\n' + body);
}

export function buildArchitecture(files: { path: string; content: string; lines: number }[]) {
  const known = new Set(files.map((file) => file.path));
  const modules = new Map<string, { key: string; layer: string; files: number; lines: number }>();
  const externals = new Map<string, number>();
  const localImports: { from: string; spec: string; py: boolean }[] = [];

  for (const file of files) {
    const key = moduleKey(file.path);
    const entry = modules.get(key) || { key, layer: classifyLayer(file.path), files: 0, lines: 0 };
    entry.files += 1;
    entry.lines += file.lines;
    modules.set(key, entry);

    if (extensionOf(file.path) === 'py') {
      for (const spec of pySpecs(file.content)) localImports.push({ from: file.path, spec, py: true });
      continue;
    }

    for (const spec of jsSpecs(file.content)) {
      if (spec.startsWith('.')) {
        localImports.push({ from: file.path, spec, py: false });
      } else {
        const name = barePackage(spec);
        if (name) externals.set(name, (externals.get(name) || 0) + 1);
      }
    }
  }

  const edges = new Map<string, { from: string; to: string; weight: number }>();
  for (const link of localImports) {
    const target = link.py ? resolvePython(link.from, link.spec, known) : resolveImport(link.from, link.spec, known);
    if (!target) {
      if (link.py) {
        const name = link.spec.replace(/^\.+/, '').split('.')[0];
        if (name && !PY_STDLIB.has(name)) externals.set(name, (externals.get(name) || 0) + 1);
      }
      continue;
    }
    const from = moduleKey(link.from);
    const to = moduleKey(target);
    if (from === to) continue;
    const id = from + '->' + to;
    const current = edges.get(id);
    if (current) current.weight += 1;
    else edges.set(id, { from, to, weight: 1 });
  }

  const moduleList = Array.from(modules.values())
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 40);
  const edgeList = Array.from(edges.values())
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 30);

  return {
    modules: moduleList,
    edges: edgeList,
    layers: LAYER_NAMES.map((name) => ({
      name,
      modules: moduleList.filter((module) => module.layer === name)
    })).filter((layer) => layer.modules.length > 0),
    externals: Array.from(externals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
    import_count: localImports.length
  };
}