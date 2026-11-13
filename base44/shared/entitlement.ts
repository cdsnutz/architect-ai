/**
* (c) 2026 REVENGINE. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// Access logic: every signed-in user can run analyses.

export type Entitlement = {
  signedIn: boolean;
  admin: boolean;
  analysesRun: number;
  hasAccess: boolean;
};

export async function getEntitlement(base44: any, user: any): Promise<Entitlement> {
  if (!user) {
    return { signedIn: false, admin: false, analysesRun: 0, hasAccess: false };
  }

  const analysesRun = await base44.asServiceRole.entities.SiteAnalysis.count({ created_by_id: user.id });

  return {
    signedIn: true,
    admin: user.role === "admin",
    analysesRun,
    hasAccess: true,
  };
}