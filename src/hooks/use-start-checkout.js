import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// Sends a visitor to the paid workspace: account first, then checkout.
export function useStartCheckout() {
  const navigate = useNavigate();

  return async () => {
    const authed = await base44.auth.isAuthenticated();
    navigate(authed ? "/checkout" : "/register?returnTo=%2Fcheckout");
  };
}