/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { githubToken, authHeaders } from './github.ts';

const API = 'https://api.github.com';
const MAX_GROUPS = 60;

const CODE_EXT = new Set([
  'java', 'kt', 'py', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'go', 'rs', 'rb', 'php', 'cs', 'swift',
  'c', 'h', 'cpp', 'hpp', 'scala', 'sh'
]);

export class GitHubReadError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function gh(path: string, token: string) {
  const response = await fetch(API + path, { headers: authHeaders(token), signal: AbortSignal.timeout(20000) });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new GitHubReadError(
      'GitHub ' + response.status + ' on ' + path + (detail ? ': ' + detail.slice(0, 160) : ''),
      response.status
    );
  }
  return response;
}

/**
 * Which subsystem a path belongs to. Deep trees (Ghidra keeps code at
 * <Root>/<Section>/<Module>/) group three segments deep so a module is a module;
 * shallow trees group at their top-level directory.
 */
export function groupKey(path: string): string {
  const parts = path.split('/');
  if (parts.length === 1) return '(repository root)';
  if (parts.length >= 4) return parts.slice(0, 3).join('/');
  return parts[0];
}

function extensionOf(path: string): string {
  const name = path.split('/').pop() || '';
  return name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
}

export type RepoIndex = Awaited<ReturnType<typeof indexRepository>>;

/** Reads one public repository into a subsystem map. No cloning, no writes. */
export async function indexRepository(owner: string, repo: string) {
  const token = githubToken();

  const meta = await (await gh('/repos/' + owner + '/' + repo, token)).json();
  const branch = String(meta.default_branch || 'main').slice(0, 120);

  const release = await gh('/repos/' + owner + '/' + repo + '/releases/latest', token)
    .then((response) => response.json())
    .catch(() => null);

  const tree = await (
    await gh('/repos/' + owner + '/' + repo + '/git/trees/' + encodeURIComponent(branch) + '?recursive=1', token)
  ).json();
  const blobs = (Array.isArray(tree.tree) ? tree.tree : []).filter((entry: any) => entry.type === 'blob' && entry.path);
  if (!blobs.length) throw new GitHubReadError('The repository tree came back empty.', 502);

  const groups = new Map<string, { key: string; files: number; code: number }>();
  const topLevel = new Map<string, number>();
  let codeFiles = 0;

  for (const blob of blobs) {
    const path = String(blob.path);
    const key = groupKey(path);
    const entry = groups.get(key) || { key, files: 0, code: 0 };
    entry.files += 1;
    if (CODE_EXT.has(extensionOf(path))) {
      entry.code += 1;
      codeFiles += 1;
    }
    groups.set(key, entry);

    const top = path.includes('/') ? path.split('/')[0] : '(repository root)';
    topLevel.set(top, (topLevel.get(top) || 0) + 1);
  }

  const ranked = Array.from(groups.values()).sort((a, b) => b.files - a.files);

  return {
    repo: {
      url: 'https://github.com/' + owner + '/' + repo,
      owner,
      repo,
      branch,
      description: meta.description || '',
      license: (meta.license && (meta.license.spdx_id || meta.license.name)) || 'not stated',
      stars: Number(meta.stargazers_count) || 0,
      forks: Number(meta.forks_count) || 0,
      language: meta.language || '',
      pushed_at: meta.pushed_at || ''
    },
    release: release
      ? {
          tag: release.tag_name || '',
          name: release.name || '',
          published_at: release.published_at || '',
          url: release.html_url || ''
        }
      : null,
    totals: {
      files: blobs.length,
      code_files: codeFiles,
      groups: ranked.length,
      top_level: topLevel.size,
      truncated: Boolean(tree.truncated)
    },
    top_level: Array.from(topLevel.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([key, files]) => ({ key, files })),
    groups: ranked.slice(0, MAX_GROUPS)
  };
}