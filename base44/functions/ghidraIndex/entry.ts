/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { githubToken, authHeaders } from '../../shared/github.ts';

const API = 'https://api.github.com';
const OWNER = 'NationalSecurityAgency';
const REPO = 'ghidra';
const MAX_GROUPS = 60;

async function gh(path: string, token: string, accept?: string) {
  const response = await fetch(API + path, {
    headers: authHeaders(token, accept),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw Object.assign(
      new Error('GitHub ' + response.status + ' on ' + path + (detail ? ': ' + detail.slice(0, 160) : '')),
      { status: response.status }
    );
  }
  return response;
}

/**
 * Which subsystem a path belongs to. Ghidra keeps its code under
 * Ghidra/<Section>/<Module>/, so three segments is the real module.
 * Everything else groups at its top-level directory.
 */
function groupKey(path: string): string {
  const parts = path.split('/');
  if (parts.length === 1) return '(repository root)';
  if (parts[0] === 'Ghidra' && parts.length >= 4) return parts.slice(0, 3).join('/');
  return parts[0];
}

function isJava(path: string): boolean {
  return path.toLowerCase().endsWith('.java');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = githubToken();

    let meta;
    try {
      meta = await (await gh('/repos/' + OWNER + '/' + REPO, token)).json();
    } catch (error: any) {
      if (error.status === 404) {
        return Response.json({ error: 'The Ghidra repository is not readable by this app.' }, { status: 404 });
      }
      if (error.status === 403 || error.status === 429) {
        return Response.json({ error: 'GitHub rate limit reached. Try again in a minute.' }, { status: 429 });
      }
      throw error;
    }

    const branch = String(meta.default_branch || 'master').slice(0, 120);

    const release = await gh('/repos/' + OWNER + '/' + REPO + '/releases/latest', token)
      .then((response) => response.json())
      .catch(() => null);

    const tree = await (await gh('/repos/' + OWNER + '/' + REPO + '/git/trees/' + encodeURIComponent(branch) + '?recursive=1', token)).json();
    const blobs = (Array.isArray(tree.tree) ? tree.tree : []).filter((entry: any) => entry.type === 'blob' && entry.path);
    if (!blobs.length) {
      return Response.json({ error: 'The repository tree came back empty.' }, { status: 502 });
    }

    const groups = new Map<string, { key: string; files: number; java: number }>();
    const topLevel = new Map<string, number>();
    let javaFiles = 0;

    for (const blob of blobs) {
      const path = String(blob.path);
      const key = groupKey(path);
      const entry = groups.get(key) || { key, files: 0, java: 0 };
      entry.files += 1;
      if (isJava(path)) {
        entry.java += 1;
        javaFiles += 1;
      }
      groups.set(key, entry);

      const top = path.includes('/') ? path.split('/')[0] : '(repository root)';
      topLevel.set(top, (topLevel.get(top) || 0) + 1);
    }

    const ranked = Array.from(groups.values()).sort((a, b) => b.files - a.files);

    console.log(
      'ghidraIndex: ' + blobs.length + ' blobs on ' + branch + ', ' + ranked.length + ' subsystems, ' + javaFiles + ' Java files'
    );

    return Response.json({
      repo: {
        url: 'https://github.com/' + OWNER + '/' + REPO,
        owner: OWNER,
        repo: REPO,
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
        java_files: javaFiles,
        groups: ranked.length,
        top_level: topLevel.size,
        truncated: Boolean(tree.truncated)
      },
      top_level: Array.from(topLevel.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([key, files]) => ({ key, files })),
      groups: ranked.slice(0, MAX_GROUPS)
    });
  } catch (error: any) {
    console.log('ghidraIndex failed: ' + (error && error.message));
    return Response.json(
      { error: (error && error.message) || 'The Ghidra tree could not be read.' },
      { status: 500 }
    );
  }
}