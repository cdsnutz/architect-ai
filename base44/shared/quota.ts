/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Per-account hourly ceilings for the paths that spend integration credits,
// read the app's stored keys or drive the licensed browser host. Every guarded
// action records itself in QuotaEvent, so a scripted caller costs the same as a
// person pressing the button. Ordinary use sits far below every limit here.

export const QUOTA_WINDOW_MINUTES = 60;

export type QuotaVerdict = { allowed: boolean; used: number; limit: number };

export async function guardQuota(base44, user, action: string, limit: number): Promise<QuotaVerdict> {
  const since = new Date(Date.now() - QUOTA_WINDOW_MINUTES * 60 * 1000).toISOString();
  const used = await base44.entities.QuotaEvent.count({
    created_by_id: user.id,
    action,
    created_date: { $gte: since }
  });
  if (used >= limit) return { allowed: false, used, limit };

  // A counter that fails to record is logged, never a reason to refuse the run.
  await base44.entities.QuotaEvent.create({ action }).catch(() => {});
  return { allowed: true, used: used + 1, limit };
}

export function quotaRefusal(verdict: QuotaVerdict) {
  return Response.json(
    {
      error: 'That is the limit for this run — ' + verdict.limit + ' per hour on this account. Try again a little later.',
      quota: { used: verdict.used, limit: verdict.limit, window_minutes: QUOTA_WINDOW_MINUTES }
    },
    { status: 429 }
  );
}