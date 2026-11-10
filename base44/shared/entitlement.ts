// Shared entitlement logic: one paid purchase = one website analysis.

export const PRODUCT_ID = "revengine-analysis";
export const PRICE_USD = "49.99";

// ===== TEMPORARY TESTING SWITCH =====
// Paywall bypass for testing: every signed-in user is treated as having unlimited analyses.
// Payment, webhook and purchase code stay fully intact underneath.
// Set to false (or delete this block) before publishing to paying customers.
export const TESTING_PAYWALL_BYPASS = true;

export type Entitlement = {
  signedIn: boolean;
  admin: boolean;
  granted: number;
  used: number;
  remaining: number;
  hasAccess: boolean;
};

export async function getEntitlement(base44: any, user: any): Promise<Entitlement> {
  if (!user) {
    return { signedIn: false, admin: false, granted: 0, used: 0, remaining: 0, hasAccess: false };
  }

  const db = base44.asServiceRole;
  const admin = user.role === "admin";

  if (TESTING_PAYWALL_BYPASS) {
    const used = await db.entities.SiteAnalysis.count({ created_by_id: user.id });
    return {
      signedIn: true,
      admin: true,
      granted: 999,
      used,
      remaining: 999,
      hasAccess: true,
    };
  }

  const [byUser, byEmail] = await Promise.all([
    db.entities.Base44Purchase.filter({
      status: "paid",
      productId: PRODUCT_ID,
      appUserId: user.id,
    }),
    db.entities.Base44Purchase.filter({
      status: "paid",
      productId: PRODUCT_ID,
      buyerEmail: user.email,
    }),
  ]);

  const unique = new Map([...byUser, ...byEmail].map((p: any) => [p.id, p]));
  const granted = [...unique.values()].reduce(
    (sum: number, p: any) => sum + (Number(p.quantity) > 0 ? Number(p.quantity) : 1),
    0
  );

  const used = await db.entities.SiteAnalysis.count({ created_by_id: user.id });
  const remaining = Math.max(0, granted - used);

  return {
    signedIn: true,
    admin,
    granted,
    used,
    remaining,
    hasAccess: admin || granted > 0,
  };
}