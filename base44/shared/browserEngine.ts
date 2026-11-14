/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// The engine of record for every browser-backed session in this lab. A
// self-hosted CloakBrowser answers on CDP; nothing else is offered as an
// alternative, so a run can never silently fall back to a different browser
// than the one it is documented against.

import { secrets } from "base44:runtime";

export const ENGINE = {
  id: "cloakbrowser",
  label: "CloakBrowser",
  source: "https://github.com/CloakHQ/CloakBrowser",
  mode: "self-hosted · cloakserve (CDP 9222)",
  is_default: true
};

function secret(name: string) {
  try {
    return String(secrets.get(name) || "").trim();
  } catch (error) {
    return "";
  }
}

export function engineConfig() {
  return {
    url: secret("CLOAKBROWSER_CDP_URL").replace(/\/+$/, ""),
    token: secret("CLOAKBROWSER_CDP_TOKEN")
  };
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch (error) {
    return url;
  }
}

// Reads only the discovery document: the browser version it reports, and
// whether per-seed routing is answering. The CDP websocket URL is a live
// credential, so it is never returned or logged.
export async function probeEngine() {
  const { url, token } = engineConfig();

  if (!url) {
    return {
      ...ENGINE,
      configured: false,
      reachable: false,
      detail:
        "No cloakserve endpoint is set. Run the container on a host, then save its URL as CLOAKBROWSER_CDP_URL."
    };
  }

  if (!/^https:/i.test(url)) {
    return {
      ...ENGINE,
      host: hostOf(url),
      configured: true,
      reachable: false,
      detail: "The endpoint must be https. Port 9222 grants full control of the browser and is never exposed over plain http."
    };
  }

  try {
    const response = await fetch(url + "/json/version", {
      headers: token ? { Authorization: "Bearer " + token } : {},
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return {
        ...ENGINE,
        host: hostOf(url),
        configured: true,
        reachable: false,
        status: response.status,
        detail:
          response.status === 401 || response.status === 403
            ? "The endpoint answered but refused the app. Check the token your proxy requires."
            : "cloakserve answered " + response.status + " instead of a browser version."
      };
    }

    const data = await response.json().catch(() => ({}) as any);
    return {
      ...ENGINE,
      host: hostOf(url),
      configured: true,
      reachable: true,
      browser: String(data.Browser || ""),
      protocol: String(data["Protocol-Version"] || ""),
      detail:
        (data.Browser ? String(data.Browser) : "A browser answered") +
        " reachable over CDP. Per-seed fingerprint routing is available, so every run can be stamped with the seed it used."
    };
  } catch (error: any) {
    const timedOut = error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      ...ENGINE,
      host: hostOf(url),
      configured: true,
      reachable: false,
      detail: timedOut
        ? "No answer from " + hostOf(url) + " within 8 seconds. The container may be stopped, or the tunnel down."
        : "Could not reach " + hostOf(url) + ": " + ((error && error.message) || "unknown network error")
    };
  }
}