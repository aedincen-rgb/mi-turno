#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  scripts/setup-hooks.sh — apunta git a .githooks/ (versionado).
#  Correr UNA vez por clon del repo.
# ════════════════════════════════════════════════════════════════
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit 2>/dev/null || true

echo "✓ Hooks configurados (core.hooksPath = .githooks)"
echo
echo "Para skipear puntualmente: git commit --no-verify"
