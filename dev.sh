#!/usr/bin/env bash
# Rebuild the site and serve it locally.
#   ./dev.sh          serve on port 3000
#   ./dev.sh 8080     serve on a custom port
set -e

ROOT="$(dirname "$(readlink -f "$0")")"
PORT="${1:-3000}"
cd "$ROOT"

# Only the process listening on the port, never a browser connected to it.
PIDS=$(ss -ltnpH "sport = :$PORT" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u || true)
if [ -n "$PIDS" ]; then
  echo "Stopping existing server on port $PORT (pid $(echo $PIDS))..."
  kill $PIDS
  sleep 0.5
fi

echo "Building..."
uv run build/build.py

echo "Serving dist/ at http://localhost:$PORT"
cd dist
exec python3 -m http.server "$PORT"
