"""Serve the compiled POC on localhost without caching development builds."""
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
    with ThreadingHTTPServer(("127.0.0.1", 8000), handler) as server:
        print("Aritos: http://127.0.0.1:8000/ (sin caché)", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
