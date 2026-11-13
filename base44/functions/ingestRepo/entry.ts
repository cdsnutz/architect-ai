import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import {
  parseRepoUrl,
  selectPaths,
  buildDigest,
  buildArchitecture,
  countLines,
  INGEST_MAX_FILE_CHARS
} from '../../shared/repoIngest.ts';

const API = 'https://api.github.com';

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

function authHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'revengine-ingest'
  };
  if (token) headers.Authorization = 'Bearer ' + token;
  return headers;
}

async function gh(path, token) {
  const response = await fetch(API + path, {
    headers: authHeaders(token),
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw Object.assign(new Error('GitHub ' + response.status + ' on ' + path + (detail ? ': ' + detail.slice(0, 160) : '')), {
      status: response.status
    });
  }
  return response;
}

async function readFile(owner, repo, ref, path, token) {
  const url =
    API +
    '/repos/' +
    owner +
    '/' +
    repo +
    '/contents/' +
    path.split('/').map(encodeURIComponent).join('/') +
    '?ref=' +
    encodeURIComponent(ref);
  const response = await fetch(url, {
    headers: { ...authHeaders(token), Accept: 'application/vnd.github.raw' },
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) return null;
  const text = await response.text();
  if (text.length <= INGEST_MAX_FILE_CHARS) return text;
  return text.slice(0, INGEST_MAX_FILE_CHARS) + '\n... [truncated at ' + INGEST_MAX_FILE_CHARS + ' characters]';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const parsed = parseRepoUrl(body.repo_url);
    if (!parsed) {
      return Response.json({ error: 'Enter a GitHub repository as owner/repo or a github.com URL.' }, { status: 400 });
    }

    const token = githubToken();
    const { owner, repo } = parsed;

    let metaResponse;
    try {
      metaResponse = await gh('/repos/' + owner + '/' + repo, token);
    } catch (error) {
      if (error.status === 404) {
        return Response.json(
          { error: 'Repository not found, or private to an account this app cannot read.' },
          { status: 404 }
        );
      }
      if (error.status === 403 || error.status === 429) {
        return Response.json({ error: 'GitHub rate limit reached. Try again in a minute.' }, { status: 429 });
      }
      throw error;
    }
    const meta = await metaResponse.json();
    const branch = String(body.branch || parsed.branch || meta.default_branch || 'main').slice(0, 120);

    const treeResponse = await gh(
      '/repos/' + owner + '/' + repo + '/git/trees/' + encodeURIComponent(branch) + '?recursive=1',
      token
    );
    const tree = await treeResponse.json();
    const blobs = (Array.isArray(tree.tree) ? tree.tree : []).filter((entry) => entry.type === 'blob' && entry.path);
    const paths = selectPaths(blobs.map((entry) => entry.path));
    if (!paths.length) {
      return Response.json(
        { error: 'No readable source files on ' + owner + '/' + repo + ' (' + branch + ').' },
        { status: 422 }
      );
    }

    const files = [];
    for (let index = 0; index < paths.length; index += 6) {
      const batch = paths.slice(index, index + 6);
      const settled = await Promise.allSettled(batch.map((path) => readFile(owner, repo, branch, path, token)));
      settled.forEach((result, position) => {
        if (result.status === 'fulfilled' && typeof result.value === 'string' && result.value.trim()) {
          files.push({ path: batch[position], content: result.value, lines: countLines(result.value) });
        }
      });
    }
    if (!files.length) {
      return Response.json({ error: 'The files on ' + owner + '/' + repo + ' could not be read.' }, { status: 502 });
    }

    const architecture = buildArchitecture(files);
    const digest = buildDigest({
      owner,
      repo,
      branch,
      meta: {
        description: meta.description,
        language: meta.language,
        stars: meta.stargazers_count,
        forks: meta.forks_count
      },
      files,
      trackedCount: blobs.length
    });
    const totalLines = files.reduce((sum, file) => sum + file.lines, 0);

    const record = await base44.entities.RepoIngest.create({
      repo_url: 'https://github.com/' + owner + '/' + repo,
      owner,
      repo,
      branch,
      description: meta.description || '',
      language: meta.language || '',
      stars: Number(meta.stargazers_count) || 0,
      file_count: files.length,
      tracked_files: blobs.length,
      total_lines: totalLines,
      digest_chars: digest.length,
      digest: digest.slice(0, 8000),
      architecture,
      status: 'complete'
    });

    console.log('ingestRepo: ' + owner + '/' + repo + ' read ' + files.length + ' files on ' + branch);

    return Response.json({
      record,
      digest,
      architecture,
      stats: {
        file_count: files.length,
        tracked_files: blobs.length,
        total_lines: totalLines,
        digest_chars: digest.length
      },
      sources: {
        gitingest: 'https://gitingest.com/' + owner + '/' + repo,
        gitdiagram: 'https://gitdiagram.com/' + owner + '/' + repo
      }
    });
  } catch (error) {
    console.log('ingestRepo failed: ' + (error && error.message));
    return Response.json(
      { error: (error && error.message) || 'The repository could not be ingested.' },
      { status: 500 }
    );
  }
}