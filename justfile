run_api:
    uv run fastapi dev ./backend/main.py --port 8001

serve_frontend:
    npm --prefix frontend run dev -- --host

serve:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    just run_api &
    just serve_frontend &
    wait
