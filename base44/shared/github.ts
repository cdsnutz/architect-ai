/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

import { secrets } from 'base44:runtime';

/** GitHub token from app secrets. Falls back to unauthenticated reads. */
export function githubToken(): string {
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

export function authHeaders(token: string, accept = 'application/vnd.github+json') {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'revengine-ingest'
  };
  if (token) headers.Authorization = 'Bearer ' + token;
  return headers;
}