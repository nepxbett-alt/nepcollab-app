#!/usr/bin/env bash
# Reliable production deploy: build locally, upload prebuilt artifacts.
# Use this when Vercel remote npm install hangs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Set VERCEL_TOKEN" >&2
  exit 1
fi
npm ci --no-audit --no-fund --maxsockets=3
npm run build
# Pin serverless runtime
node -e "
const fs=require('fs');
const p='.vercel/output/functions/__server.func/.vc-config.json';
if(fs.existsSync(p)){const d=JSON.parse(fs.readFileSync(p,'utf8'));d.runtime='nodejs22.x';fs.writeFileSync(p,JSON.stringify(d)+'\n');}
"
npx --yes vercel@59 deploy --prebuilt --prod --token "$VERCEL_TOKEN" --yes
