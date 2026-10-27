// Shared entitlement check for the REVENGINE lifetime license.
export const PRODUCT_ID = "revengine-lifetime";

export async function hasLifetimeAccess(base44: any, user: any): Promise<boolean> {
  if (!user) return false;
  // The builder/admin owns the app and always keeps access.
  if (user.role === "admin") return true;

  const db = base44.asServiceRole;

  const byUser = await db.entities.Base44Purchase.filter({
    status: "paid",
    productId: PRODUCT_ID,
    appUserId: user.id,
  });
  if (byUser.length) return true;

  // Guest purchase bound to the platform-verified account email.
  const byEmail = await db.entities.Base44Purchase.filter({
    status: "paid",
    productId: PRODUCT_ID,
    buyerEmail: user.email,
  });
  return byEmail.length > 0;
}