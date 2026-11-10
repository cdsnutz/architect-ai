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