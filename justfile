run_api:
    uv run fastapi dev ./backend/main.py

serve_frontend:
    npm --prefix frontend run dev

serve:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    just run_api &
    just serve_frontend &
    wait
