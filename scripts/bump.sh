#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  scripts/bump.sh — bumpea las 3 fuentes de verdad de versión:
#    js/config/globals.js   MT_APP_VERSION
#    sw.js                  CACHE
#    version.json           "v"
#  Uso: scripts/bump.sh <numero> [label]
#  Ej:  scripts/bump.sh 42 "Fix sync entre devices"
# ════════════════════════════════════════════════════════════════
set -euo pipefail

N="${1:-}"
LABEL="${2:-}"

if [ -z "$N" ]; then
  echo "Uso: scripts/bump.sh <numero> [label]"
  echo "Ej:  scripts/bump.sh 42 \"Fix sync entre devices\""
  exit 1
fi

if ! [[ "$N" =~ ^[0-9]+$ ]]; then
  echo "Error: el número de versión debe ser entero (sin la 'v')."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 1) globals.js
sed -i.bak "s/var MT_APP_VERSION = 'v[0-9]\+';/var MT_APP_VERSION = 'v${N}';/" js/config/globals.js
rm -f js/config/globals.js.bak

# 2) sw.js — actualiza SHELL_CACHE (CDN_CACHE es independiente, no se toca)
sed -i.bak "s/^const SHELL_CACHE = 'mt-shell-v[0-9]\+';/const SHELL_CACHE = 'mt-shell-v${N}';/" sw.js
rm -f sw.js.bak

# 3) version.json
DEFAULT_LABEL="Release v${N}"
cat > version.json <<EOF
{
  "v": "v${N}",
  "label": "${LABEL:-$DEFAULT_LABEL}"
}
EOF

echo "✓ Bumpeado a v${N}"
echo
grep -E "MT_APP_VERSION|^const SHELL_CACHE|\"v\":" js/config/globals.js sw.js version.json
