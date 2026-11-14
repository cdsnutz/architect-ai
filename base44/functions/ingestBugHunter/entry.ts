/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { parseRepoUrl } from '../../shared/repoIngest.ts';
import { DEFAULT_SOURCE, README_MAX_CHARS, parseCatalog } from '../../shared/bugHunter.ts';
import { guardQuota, quotaRefusal } from '../../shared/quota.ts';

function githubToken() {
  for (const name of ['GITHUB_API_KEY', 'GH_TOKEN']) {
    try {
      const value = secrets.get(name);
      if (value) return value;
    } catch {
      // Secret not set — try the next one.
    }
  }
  return '';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const parsed = parseRepoUrl(body.source_url || DEFAULT_SOURCE);
    if (!parsed) {
      return Response.json({ error: 'Enter the catalog as owner/repo or a github.com URL.' }, { status: 400 });
    }

    const quota = await guardQuota(base44, user, 'ingest_catalog', 12);
    if (!quota.allowed) return quotaRefusal(quota);

    const { owner, repo } = parsed;
    const branch = String(body.branch || parsed.branch || 'main').slice(0, 120);
    const headers = {
      Accept: 'application/vnd.github.raw',
      'User-Agent': 'revengine-arsenal'
    };
    const token = githubToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    const response = await fetch(
      'https://api.github.com/repos/' + owner + '/' + repo + '/readme?ref=' + encodeURIComponent(branch),
      { headers, signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return Response.json({ error: 'No README found on ' + owner + '/' + repo + ' (' + branch + ').' }, { status: 404 });
      }
      if (response.status === 403 || response.status === 429) {
        return Response.json({ error: 'GitHub rate limit reached. Try again in a minute.' }, { status: 429 });
      }
      return Response.json({ error: 'GitHub answered ' + response.status + ' for that catalog.' }, { status: 502 });
    }

    const markdown = (await response.text()).slice(0, README_MAX_CHARS);
    const { sections, counts } = parseCatalog(markdown);
    if (!sections.length) {
      return Response.json(
        { error: 'The README on ' + owner + '/' + repo + ' has no tool tables this reader can parse.' },
        { status: 422 }
      );
    }

    const catalog = {
      source_url: 'https://github.com/' + owner + '/' + repo,
      branch,
      status: 'complete',
      synced_at: new Date().toISOString(),
      readme_chars: markdown.length,
      counts,
      sections
    };

    // The index is derived from the README, so a failed save still returns it.
    let record = null;
    try {
      record = await base44.entities.BugHunterCatalog.create(catalog);
    } catch (saveError) {
      console.log('ingestBugHunter could not persist the index: ' + (saveError && saveError.message));
    }

    console.log(
      'ingestBugHunter read ' + owner + '/' + repo + ': ' + counts.tools + ' tools across ' + counts.sections + ' sections'
    );

    return Response.json({ catalog, record, persisted: Boolean(record) });
  } catch (error) {
    console.log('ingestBugHunter failed: ' + (error && error.message));
    return Response.json({ error: (error && error.message) || 'The catalog could not be read.' }, { status: 500 });
  }
}