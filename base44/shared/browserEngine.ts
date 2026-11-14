/**
* (c) 2026 Unsaved Changes LLC. All Rights Reserved.
* Proprietary and Confidential. Unauthorized copying, modification,
* or distribution of this file strictly prohibited without prior
* written consent from the author.
*/

// The engine of record for every browser-backed session in this lab. Two
// transports reach the same binary: the licence-key SDK (cloakbrowser.launch,
// executed by a Python host) and a self-hosted cloakserve answering on CDP.
// Nothing else is offered, so a run can never silently fall back to a
// different browser than the one it is documented against.

import { secrets } from "base44:runtime";

export const ENGINE = {
  id: "cloakbrowser",
  label: "CloakBrowser",
  source: "https://github.com/CloakHQ/CloakBrowser",
  mode: "licence-key sdk · cloakbrowser.launch",
  transports: ["sdk", "cdp"],
  is_default: true
};

export const RUNNER = "cloakbrowser_runner.py";

function secret(name: string) {
  try {
    return String(secrets.get(name) || "").trim();
  } catch (error) {
    return "";
  }
}

// The licence key is a credential: it is read, reported only as present (with
// its last four characters so the operator can tell which key is installed),
// and never returned in full or written to a log.
export function engineConfig() {
  const key = secret("CLOAKBROWSER_LICENSE_KEY");
  return {
    url: secret("CLOAKBROWSER_CDP_URL").replace(/\/+$/, ""),
    token: secret("CLOAKBROWSER_CDP_TOKEN"),
    key_present: Boolean(key),
    key_suffix: key ? key.slice(-4) : ""
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
  const { url, token, key_present, key_suffix } = engineConfig();

  if (!url) {
    if (key_present) {
      return {
        ...ENGINE,
        transport: "sdk",
        licence: "installed · ****" + key_suffix,
        configured: true,
        reachable: false,
        runner: RUNNER,
        runner_command: "CLOAKBROWSER_LICENSE_KEY=… python " + RUNNER + " --url https://example.com --geoip",
        detail:
          "The licence key is installed, so the SDK can launch the browser with humanize and geoip. This app's backend is JavaScript and cannot load a Python package, so the pass runs on a host that has one: " +
          RUNNER +
          " executes it and hands the evidence back. Save a reachable endpoint as CLOAKBROWSER_CDP_URL to drive that host from here."
      };
    }
    return {
      ...ENGINE,
      configured: false,
      reachable: false,
      detail:
        "Neither a licence key nor a cloakserve endpoint is set. Save CLOAKBROWSER_LICENSE_KEY to run the SDK on a Python host, or CLOAKBROWSER_CDP_URL for a self-hosted endpoint."
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
      transport: "cdp",
      licence: key_present ? "installed · ****" + key_suffix : "not installed",
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