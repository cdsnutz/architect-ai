#!/usr/bin/env python3
# (c) 2026 Unsaved Changes LLC. All Rights Reserved.
# Proprietary and Confidential. Unauthorized copying, modification,
# or distribution of this file strictly prohibited without prior
# written consent from the author.
"""CloakBrowser execution host for REVENGINE.

The app's backend runs JavaScript and cannot load a Python package, so a
browser-backed pass is executed here, on a host that has one (your Fly machine,
a lab box, your workstation). Exactly one authorized read-only navigation per
request; nothing is inlined, re-served or stored.

Two modes:

  CLI, for a one-off pass:
    CLOAKBROWSER_LICENSE_KEY=... python cloakbrowser_runner.py --url https://example.com

  Serve, so the app can call it remotely:
    CLOAKBROWSER_LICENSE_KEY=... CLOAKBROWSER_RUNNER_TOKEN=... \
      python cloakbrowser_runner.py --serve --port 8787
    GET  /health   -> readiness, never the licence key
    POST /capture  -> {"url": "...", "geoip": true, "preset": "careful", "proxy": null}

CLOAKBROWSER_RUNNER_TOKEN is required in serve mode: without it the runner
refuses to start, so the browser is never exposed unauthenticated. The app sends
it as a bearer token and every request without it is refused.

Serve binds to loopback by default. A host that must be reached through a
platform proxy (Fly, a container, a reverse proxy) has to pass --host 0.0.0.0
explicitly, which is the only way this runner listens on a public interface.

Exit codes: 0 captured, 2 bad input, 3 engine not installed,
            4 navigation failed (evidence is still printed).
"""

import argparse
import hmac
import json
import os
import sys
import time


def licence_key():
    return (os.environ.get("CLOAKBROWSER_LICENSE_KEY") or "").strip()


def load_engine():
    try:
        from cloakbrowser import launch  # noqa: PLC0415 - optional, reported when absent
        return launch, None
    except Exception as error:
        return None, "cloakbrowser is not importable: %s" % error


def capture(target_url, proxy=None, geoip=False, headed=False, preset="careful",
            humanize=True, timeout=30000):
    """Runs the single authorized pass and returns an evidence dict."""
    started = time.time()
    if not str(target_url or "").lower().startswith(("http://", "https://")):
        return {"ok": False, "error": "Only http(s) targets are accepted.", "url": target_url}

    key = licence_key()
    if not key:
        return {"ok": False, "error": "CLOAKBROWSER_LICENSE_KEY is not set on this host.", "url": target_url}

    launch, problem = load_engine()
    if launch is None:
        return {"ok": False, "error": problem, "url": target_url}

    launch_args = {
        "license_key": key,
        "headless": not headed,
        "humanize": humanize,
        "human_preset": preset,
        "geoip": geoip,
    }
    if proxy:
        launch_args["proxy"] = proxy

    browser = None
    try:
        browser = launch(**launch_args)
        page = browser.new_page()
        response = page.goto(target_url, timeout=timeout, wait_until="domcontentloaded")
        html = page.content() or ""
        return {
            "ok": True,
            "url": target_url,
            "final_url": page.url,
            "status": getattr(response, "status", None) if response is not None else None,
            "title": page.title(),
            "html_bytes": len(html.encode("utf-8")),
            "elapsed_ms": int((time.time() - started) * 1000),
            "engine": "cloakbrowser",
            "transport": "sdk",
            "proxy": bool(proxy),
            "geoip": bool(geoip),
            "headless": not headed,
        }
    except Exception as error:
        return {
            "ok": False,
            "url": target_url,
            "error": str(error),
            "elapsed_ms": int((time.time() - started) * 1000),
            "engine": "cloakbrowser",
            "transport": "sdk",
        }
    finally:
        try:
            if browser is not None:
                browser.close()
        except Exception:
            pass


def serve(port, host="127.0.0.1"):
    from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

    token = (os.environ.get("CLOAKBROWSER_RUNNER_TOKEN") or "").strip()
    if not token:
        print(
            "refusing to serve: set CLOAKBROWSER_RUNNER_TOKEN and the same value in the app. "
            "An unauthenticated runner would let anyone drive this browser.",
            file=sys.stderr,
        )
        return 2

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, fmt, *args):  # quieter access log
            sys.stderr.write("runner: " + (fmt % args) + "\n")

        def reply(self, code, payload):
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def authorized(self):
            # Fail closed: no token means no browser control, never open access.
            if not token:
                return False
            header = self.headers.get("Authorization", "")
            return hmac.compare_digest(header, "Bearer " + token)

        def do_GET(self):
            if self.path.rstrip("/") not in ("/health", ""):
                return self.reply(404, {"ok": False, "error": "unknown path"})
            _, problem = load_engine()
            self.reply(200, {
                "ok": problem is None,
                "engine": "cloakbrowser",
                "transport": "sdk",
                "licence": "installed" if licence_key() else "missing",
                "auth_required": bool(token),
                "problem": problem,
            })

        def do_POST(self):
            if self.path.rstrip("/") != "/capture":
                return self.reply(404, {"ok": False, "error": "unknown path"})
            if not self.authorized():
                return self.reply(401, {"ok": False, "error": "runner token refused"})
            try:
                length = int(self.headers.get("Content-Length") or 0)
                if length > 65536:
                    return self.reply(413, {"ok": False, "error": "payload too large"})
                payload = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                return self.reply(400, {"ok": False, "error": "body must be JSON"})

            evidence = capture(
                payload.get("url"),
                proxy=payload.get("proxy") or None,
                geoip=bool(payload.get("geoip")),
                headed=bool(payload.get("headed")),
                preset=str(payload.get("preset") or "careful"),
                humanize=bool(payload.get("humanize", True)),
                timeout=min(int(payload.get("timeout") or 30000), 60000),
            )
            self.reply(200 if evidence.get("ok") else 502, evidence)

    print("cloakbrowser runner listening on %s:%d" % (host, port), file=sys.stderr)
    ThreadingHTTPServer((host, port), Handler).serve_forever()
    return 0


def main():
    parser = argparse.ArgumentParser(description="CloakBrowser read-only pass runner.")
    parser.add_argument("--url", help="Authorized http(s) target (CLI mode).")
    parser.add_argument("--serve", action="store_true", help="Serve /health and /capture instead.")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT") or 8787))
    parser.add_argument("--host", default=os.environ.get("CLOAKBROWSER_RUNNER_HOST") or "127.0.0.1",
                        help="Interface to bind (serve mode). Default loopback; pass 0.0.0.0 behind a platform proxy.")
    parser.add_argument("--proxy", default=os.environ.get("CLOAKBROWSER_PROXY") or None,
                        help="http://user:pass@host:port. Omit for a direct connection.")
    parser.add_argument("--geoip", action="store_true", help="Align timezone/locale with the proxy IP.")
    parser.add_argument("--headed", action="store_true", help="Run visibly (default headless).")
    parser.add_argument("--no-humanize", action="store_true", help="Disable humanize.")
    parser.add_argument("--preset", default="careful", help="Human preset, e.g. careful.")
    parser.add_argument("--timeout", type=int, default=30000, help="Navigation timeout in ms.")
    args = parser.parse_args()

    if args.serve:
        return serve(args.port, args.host)

    if not args.url:
        parser.error("--url is required unless --serve is passed")

    evidence = capture(
        args.url,
        proxy=args.proxy,
        geoip=args.geoip,
        headed=args.headed,
        preset=args.preset,
        humanize=not args.no_humanize,
        timeout=args.timeout,
    )
    print(json.dumps(evidence, ensure_ascii=False))
    if evidence.get("ok"):
        return 0
    return 3 if "not importable" in str(evidence.get("error")) else 4


if __name__ == "__main__":
    sys.exit(main())