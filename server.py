import http.server
import socketserver
import os

PORT = 5000
DIRECTORY = "choco-site"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"サーバー起動中: http://0.0.0.0:{PORT}")
    httpd.serve_forever()
