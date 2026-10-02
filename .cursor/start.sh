#!/usr/bin/env bash
set -euo pipefail

cd /workspace

if [[ -f package.json ]]; then
  if node -e "const p=require('./package.json'); process.exit(p.scripts?.dev ? 0 : 1)" 2>/dev/null; then
    exec npm run dev -- --host 0.0.0.0 --port 3000
  fi
  if node -e "const p=require('./package.json'); process.exit(p.scripts?.start ? 0 : 1)" 2>/dev/null; then
    exec npm start
  fi
fi

if [[ -f manage.py ]]; then
  exec python3 manage.py runserver 0.0.0.0:8000
fi

exec python3 -m http.server 8080 --bind 0.0.0.0
