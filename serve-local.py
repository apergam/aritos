"""Serve the compiled POC on localhost without caching development builds."""
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class LocalHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    output = Path(__file__).resolve().parent / "dist"
    if not (output / "index.html").is_file():
        raise SystemExit("Primero ejecuta pnpm build.")
    handler = partial(LocalHandler, directory=str(output))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 8000))
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"Aritos: http://127.0.0.1:{port}/ (sin caché)", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
