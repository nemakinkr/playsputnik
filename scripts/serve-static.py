#!/usr/bin/env python3
"""Threaded static file server for the test gates.

`python3 -m http.server` is single-threaded: when several headless-Chrome gate
instances each boot the app (~35 module + data requests) concurrently, a slow
request can block the whole server and the app never reaches #top-pick — the
intermittent app-ready flake. ThreadingHTTPServer serves requests concurrently,
removing that stall.

Usage: python3 scripts/serve-static.py [port]   (default 7432, binds 127.0.0.1)
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

port = int(sys.argv[1]) if len(sys.argv) > 1 else 7432


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):  # silence per-request logging
        pass


httpd = ThreadingHTTPServer(("127.0.0.1", port), QuietHandler)
httpd.daemon_threads = True
httpd.serve_forever()
