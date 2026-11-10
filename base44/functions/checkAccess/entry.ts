import { createClientFromRequest } from "npm:@base44/sdk@0.8.54";
import { getEntitlement } from "../../shared/entitlement.ts";

export default async function (req: Request) {
  try {
    if (req.method !== "POST" && req.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e: any) => (e.status === 401 ? null : Promise.reject(e)));

    if (!user) {
      return Response.json({ hasAccess: false, signedIn: false, admin: false, analysesRun: 0 });
    }

    const access = await getEntitlement(base44, user);
    return Response.json(access);
  } catch (error: any) {
    console.error("checkAccess: failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}