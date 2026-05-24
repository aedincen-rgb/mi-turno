#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  scripts/check.sh — validación rápida pre-commit:
#    1) sintaxis JS (node -c) en todos los .js
#    2) JSON válido en version.json / vercel.json / manifest.json
#    3) las 3 versiones (globals.js / sw.js / version.json) coinciden
#    4) cada .js de la app está en index.html Y en sw.js precache
#  Sin dependencias externas más allá de node + python3.
# ════════════════════════════════════════════════════════════════
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0

ok()   { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

echo "→ Sintaxis JS"
while IFS= read -r -d '' f; do
  if node -c "$f" 2>/dev/null; then
    : # ok, silencioso para no spammear
  else
    fail "$f no parsea"
    node -c "$f" || true
  fi
done < <(find js sw.js -name '*.js' -print0 2>/dev/null)
ok "todos los .js parsean"

echo
echo "→ JSON files"
for f in version.json vercel.json manifest.json; do
  if [ -f "$f" ]; then
    if python3 -c "import json; json.load(open('$f'))" 2>/dev/null; then
      ok "$f válido"
    else
      fail "$f no es JSON válido"
    fi
  fi
done

echo
echo "→ Versión sincronizada en las 3 fuentes"
V_GLOBALS=$(grep -oE "MT_APP_VERSION = 'v[0-9]+" js/config/globals.js | grep -oE '[0-9]+' || echo "?")
V_SW=$(grep -oE "CACHE = 'mt-v[0-9]+" sw.js | grep -oE '[0-9]+' || echo "?")
V_JSON=$(python3 -c "import json; print(json.load(open('version.json'))['v'][1:])" 2>/dev/null || echo "?")
if [ "$V_GLOBALS" = "$V_SW" ] && [ "$V_SW" = "$V_JSON" ]; then
  ok "todas en v${V_GLOBALS}"
else
  fail "MISMATCH — globals=v${V_GLOBALS}, sw=v${V_SW}, version.json=v${V_JSON}"
  echo "    → corregilo con: scripts/bump.sh <N>"
fi

echo
echo "→ Archivos .js de la app referenciados en index.html y sw.js"
MISSING_IN_HTML=0
MISSING_IN_SW=0
while IFS= read -r -d '' f; do
  rel="${f#./}"
  # solo archivos bajo js/ (no node_modules ni nada raro)
  if [[ "$rel" != js/* ]]; then continue; fi
  if ! grep -q "$rel" index.html 2>/dev/null; then
    fail "$rel NO está en index.html"
    MISSING_IN_HTML=$((MISSING_IN_HTML+1))
  fi
  if ! grep -q "$rel" sw.js 2>/dev/null; then
    fail "$rel NO está en sw.js precache"
    MISSING_IN_SW=$((MISSING_IN_SW+1))
  fi
done < <(find js -name '*.js' -print0)
if [ $MISSING_IN_HTML -eq 0 ] && [ $MISSING_IN_SW -eq 0 ]; then
  ok "todos los .js están registrados"
fi

echo
echo "═══════════════════════════════════════"
echo "  $PASS OK · $FAIL fallos"
echo "═══════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
  exit 1
fi
