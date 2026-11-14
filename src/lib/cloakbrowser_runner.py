#!/usr/bin/env python3
# (c) 2026 Unsaved Changes LLC. All Rights Reserved.
# Proprietary and Confidential. Unauthorized copying, modification,
# or distribution of this file strictly prohibited without prior
# written consent from the author.
"""CloakBrowser execution host for REVENGINE.

The app's backend runs JavaScript and cannot load a Python package, so a
browser-backed pass is handed to this runner wherever Python lives (your
workstation, a Fly machine, a lab box). It performs exactly one authorized
read-only navigation and prints one JSON evidence record on stdout. Nothing is
inlined, re-served or stored.

Usage:
  CLOAKBROWSER_LICENSE_KEY=... python cloakbrowser_runner.py --url https://example.com
  ... --proxy http://user:pass@host:port --geoip --preset careful --headed

Exit codes: 0 captured, 2 bad input, 3 engine not installed,
            4 navigation failed (evidence is still printed).
"""

import argparse
import json
import os
import sys
import time


def emit(payload):
    print(json.dumps(payload, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="Single read-only CloakBrowser pass.")
    parser.add_argument("--url", required=True, help="Authorized http(s) target.")
    parser.add_argument("--proxy", default=os.environ.get("CLOAKBROWSER_PROXY") or None,
                        help="http://user:pass@host:port. Omit for a direct connection.")
    parser.add_argument("--geoip", action="store_true", help="Align timezone/locale with the proxy IP.")
    parser.add_argument("--headed", action="store_true", help="Run visibly (default headless).")
    parser.add_argument("--humanize", default="humanize", help="Pass 'no-humanize' to disable.")
    parser.add_argument("--preset", default="careful", help="Human preset, e.g. careful.")
    parser.add_argument("--timeout", type=int, default=30000, help="Navigation timeout in ms.")
    args = parser.parse_args()

    if not args.url.lower().startswith(("http://", "https://")):
        emit({"ok": False, "error": "Only http(s) targets are accepted.", "url": args.url})
        return 2

    license_key = (os.environ.get("CLOAKBROWSER_LICENSE_KEY") or "").strip()
    if not license_key:
        emit({"ok": False, "error": "CLOAKBROWSER_LICENSE_KEY is not set on this host.", "url": args.url})
        return 2

    try:
        from cloakbrowser import launch  # noqa: PLC0415 - optional, reported when absent
    except Exception as error:
        emit({"ok": False, "error": "cloakbrowser is not importable: %s" % error, "url": args.url})
        return 3

    launch_args = {
        "license_key": license_key,
        "headless": not args.headed,
        "humanize": args.humanize != "no-humanize",
        "human_preset": args.preset,
        "geoip": args.geoip,
    }
    if args.proxy:
        launch_args["proxy"] = args.proxy

    started = time.time()
    browser = None
    try:
        browser = launch(**launch_args)
        page = browser.new_page()
        response = page.goto(args.url, timeout=args.timeout, wait_until="domcontentloaded")
        html = page.content() or ""
        emit({
            "ok": True,
            "url": args.url,
            "final_url": page.url,
            "status": getattr(response, "status", None) if response is not None else None,
            "title": page.title(),
            "html_bytes": len(html.encode("utf-8")),
            "elapsed_ms": int((time.time() - started) * 1000),
            "engine": "cloakbrowser",
            "transport": "sdk",
            "proxy": bool(args.proxy),
            "geoip": bool(args.geoip),
            "headless": not args.headed,
        })
        return 0
    except Exception as error:
        emit({
            "ok": False,
            "url": args.url,
            "error": str(error),
            "elapsed_ms": int((time.time() - started) * 1000),
            "engine": "cloakbrowser",
            "transport": "sdk",
        })
        return 4
    finally:
        try:
            if browser is not None:
                browser.close()
        except Exception:
            pass


if __name__ == "__main__":
    sys.exit(main())