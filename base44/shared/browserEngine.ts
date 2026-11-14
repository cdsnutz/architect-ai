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

// The runner on your own host (a Fly machine, a lab box). Both values are
// credentials: the URL is reported by host only, the token never at all.
export function runnerConfig() {
  return {
    url: secret("CLOAKBROWSER_RUNNER_URL").replace(/\/+$/, ""),
    token: secret("CLOAKBROWSER_RUNNER_TOKEN")
  };
}

function runnerHeaders(token: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  return headers;
}

export async function probeRunner(runner = runnerConfig()) {
  const host = hostOf(runner.url);

  if (!/^https:/i.test(runner.url)) {
    return {
      ...ENGINE,
      host,
      transport: "sdk-http",
      configured: true,
      reachable: false,
      detail: "The runner must answer over https: it holds the licence key and drives the browser."
    };
  }

  try {
    const response = await fetch(runner.url + "/health", {
      headers: runnerHeaders(runner.token),
      signal: AbortSignal.timeout(8000)
    });
    const data = await response.json().catch(() => ({}) as any);

    if (!response.ok) {
      return {
        ...ENGINE,
        host,
        transport: "sdk-http",
        configured: true,
        reachable: false,
        status: response.status,
        detail:
          response.status === 401 || response.status === 403
            ? "The runner answered but refused the app. Check that CLOAKBROWSER_RUNNER_TOKEN matches on both sides."
            : "The runner answered " + response.status + " from /health."
      };
    }

    const ready = data && data.ok === true;
    return {
      ...ENGINE,
      host,
      transport: "sdk-http",
      configured: true,
      reachable: ready,
      licence: String((data && data.licence) || "unknown"),
      auth_required: Boolean(data && data.auth_required),
      detail: ready
        ? "The runner on " + host + " is listening, holds the licence key and executes cloakbrowser.launch for this app."
        : "The runner on " + host + " is up but not ready: " + String((data && data.problem) || "the engine is not importable there.")
    };
  } catch (error: any) {
    const timedOut = error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      ...ENGINE,
      host,
      transport: "sdk-http",
      configured: true,
      reachable: false,
      detail: timedOut
        ? "No answer from " + host + " within 8 seconds. The machine may be stopped."
        : "Could not reach " + host + ": " + ((error && error.message) || "unknown network error")
    };
  }
}

// Hands one authorized read-only pass to the runner and returns its evidence.
// The target is validated here, so the runner is never asked to open anything
// but an http(s) surface.
export async function captureViaRunner(
  targetUrl: string,
  options: { proxy?: string; geoip?: boolean; preset?: string; headed?: boolean } = {}
) {
  const runner = runnerConfig();
  if (!runner.url) {
    return { ok: false, status: 0, error: "CLOAKBROWSER_RUNNER_URL is not set, so there is no runner to call." };
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch (error) {
    return { ok: false, status: 0, error: "The target must be an absolute http(s) URL." };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, status: 0, error: "Only http(s) targets can be captured." };
  }

  try {
    const response = await fetch(runner.url + "/capture", {
      method: "POST",
      headers: runnerHeaders(runner.token),
      body: JSON.stringify({
        url: parsed.toString(),
        proxy: options.proxy || undefined,
        geoip: Boolean(options.geoip),
        preset: options.preset || "careful",
        headed: Boolean(options.headed)
      }),
      signal: AbortSignal.timeout(65000)
    });
    const data = await response.json().catch(() => ({} as any));
    if (!response.ok || !data || data.ok !== true) {
      return {
        ok: false,
        status: response.status,
        error: String((data && data.error) || "The runner answered " + response.status + " without evidence."),
        evidence: data
      };
    }
    return { ok: true, status: response.status, evidence: data };
  } catch (error: any) {
    const timedOut = error && (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      ok: false,
      status: 0,
      error: timedOut
        ? "The runner did not finish the pass within 65 seconds."
        : "Could not reach the runner: " + ((error && error.message) || "unknown network error")
    };
  }
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
  // A runner on your own host wins: it is the only transport that both holds
  // the licence key and can be called from this app over the network.
  const runner = runnerConfig();
  if (runner.url) return probeRunner(runner);

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
        runner_command: RUNNER + " --serve --port 8787",
        detail:
          "The licence key is installed, so the SDK can launch the browser with humanize and geoip. This app's backend is JavaScript and cannot load a Python package, so the pass runs on a host that has one. Start " +
          RUNNER +
          " in serve mode on that host and save its https address as CLOAKBROWSER_RUNNER_URL so this app can call it."
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