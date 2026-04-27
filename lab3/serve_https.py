#!/usr/bin/env python3
"""Small HTTPS static file server for the AR laboratory work.

Run from the project root after creating cert.pem and key.pem:
    python3 serve_https.py
"""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import ssl

HOST = "0.0.0.0"
PORT = 8443
ROOT = Path(__file__).resolve().parent / "src"
CERT_FILE = Path(__file__).resolve().parent / "cert.pem"
KEY_FILE = Path(__file__).resolve().parent / "key.pem"

if not CERT_FILE.exists() or not KEY_FILE.exists():
    raise SystemExit(
        "Missing cert.pem/key.pem. Generate them first with:\n"
        "./generate_cert.sh"
    )

class ArLabHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

httpd = ThreadingHTTPServer((HOST, PORT), ArLabHandler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile=str(CERT_FILE), keyfile=str(KEY_FILE))
httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

print(f"Serving {ROOT} at https://localhost:{PORT}/")
httpd.serve_forever()