// Shared entitlement logic: one paid purchase = one website analysis.

export const PRODUCT_ID = "revengine-analysis";
export const PRICE_USD = "49.99";

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