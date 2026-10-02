#!/usr/bin/env bash
set -euo pipefail

cd /workspace

if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    npm ci
  elif [[ -f pnpm-lock.yaml ]]; then
    corepack enable
    pnpm install --frozen-lockfile
  else
    npm install
  fi
fi

if [[ -f requirements.txt ]]; then
  python3 -m pip install --user -r requirements.txt
fi

if [[ -f pyproject.toml ]] && command -v uv >/dev/null 2>&1; then
  uv sync
fi

echo "jothidam environment bootstrap complete"
