#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  scripts/build.sh — build de producción sin tooling
#  Concatena todos los .js locales en un solo app.js,
#  todos los .css en un solo app.css, y genera un index.html
#  que carga 2 archivos en vez de 90+.
#
#  Uso: ./scripts/build.sh
#  Salida: dist/ (lista para deploy)
#
#  Sin dependencias: solo bash + cat + sed.
# ════════════════════════════════════════════════════════════════
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🔨 Mi Turno · Build de producción"
echo ""

# ── 1. Preparar dist/ ──────────────────────────────────────────
rm -rf dist
mkdir -p dist

# Copiar assets estáticos tal cual (excepto css/ que se concatena)
echo "📁 Copiando assets..."
cp -r img        dist/
cp -r icon-*.png dist/ 2>/dev/null || true
cp    manifest.json  dist/
cp    sw.js          dist/
cp    version.json   dist/
cp    vercel.json    dist/
cp    sitemap.xml    dist/ 2>/dev/null || true
cp    robots.txt     dist/ 2>/dev/null || true
cp -r .well-known    dist/ 2>/dev/null || true

# ── 2. Concatenar CSS locales en orden ─────────────────────────
echo "🎨 Concatenando CSS..."

# Extraer versión antes de usarla en los banners
VER=$(cat version.json | python3 -c "import sys,json; print(json.load(sys.stdin)['v'])" 2>/dev/null || echo "v0")

# Orden exacto de app.html (<!-- CSS FRAGMENTADO -->)
CSS_FILES=(
  # base/
  css/base/variables.css
  css/base/reset.css
  css/base/typography.css
  css/base/background.css
  css/base/media-queries.css
  css/base/blur-fix.css

  # layout/
  css/layout/header.css
  css/layout/scroll.css
  css/layout/hero-card.css
  css/layout/progress-bar.css
  css/layout/action-button.css
  css/layout/shapes.css
  css/layout/fade-animations.css
  css/layout/misc-animations.css
  css/layout/misc.css

  # components/
  css/components/cards.css
  css/components/buttons.css
  css/components/buttons-glass.css
  css/components/inputs.css
  css/components/switches.css
  css/components/config-rows.css
  css/components/dashboard-hero.css
  css/components/dashboard-kpis.css
  css/components/dashboard-chart.css
  css/components/dashboard-tip.css
  css/components/assistant-chat.css
  css/components/history-list.css
  css/components/fast-pin.css
  css/components/auth-screen.css
  css/components/misc.css
  css/components/dark-mode-overrides.css

  # modals/
  css/modals/overlay.css
  css/modals/modal-card.css
  css/modals/bottom-sheets.css
  css/modals/auth-screen.css
  css/modals/assistant-chat.css
  css/modals/time-picker.css
  css/modals/splash.css
  css/modals/misc.css
  css/modals/onboarding.css
  css/modals/dark-overrides.css

  # animations/
  css/animations/keyframes.css
)

CSS_TOTAL=0
CSS_MISSING=0
for f in "${CSS_FILES[@]}"; do
  if [ -f "$f" ]; then
    CSS_TOTAL=$((CSS_TOTAL + 1))
  else
    echo "  ⚠ Falta: $f"
    CSS_MISSING=$((CSS_MISSING + 1))
  fi
done

if [ $CSS_MISSING -gt 0 ]; then
  echo "❌ Faltan $CSS_MISSING archivos CSS. Abortando."
  exit 1
fi

{
  echo "/* ════════════════════════════════════════════════════════════ */"
  echo "/*  MI TURNO · app.css (build de producción)                   */"
  echo "/*  Versión: $VER · $(date '+%Y-%m-%d %H:%M')                  */"
  echo "/*  Archivos concatenados: $CSS_TOTAL                          */"
  echo "/*  Generado por scripts/build.sh                              */"
  echo "/* ════════════════════════════════════════════════════════════ */"
  echo ""

  for f in "${CSS_FILES[@]}"; do
    echo "/* ── $f ── */"
    cat "$f"
    echo ""
    echo ""
  done
} > dist/app.css

CSS_SIZE=$(wc -c < dist/app.css)
CSS_SIZE_KB=$((CSS_SIZE / 1024))
echo "  ✓ $CSS_TOTAL archivos → dist/app.css (${CSS_SIZE_KB} KB)"

# ── 3. Concatenar JS locales en orden ──────────────────────────
echo "📦 Concatenando JS..."

# Lista de archivos en el orden exacto de index.html
# (extraído de los comentarios <!-- X. Nombre --> en index.html)
JS_FILES=(
  # 0. Scripts del head (deben ejecutar antes que todo)
  js/config.js
  js/theme-boot.js

  # 1. Config inicial
  js/config/react-init.js
  js/config/env.js
  js/config/viewport-fix.js
  js/config/globals.js

  # 2. Utilidades
  js/utils/storage.js
  js/utils/format.js
  js/utils/haptic.js
  js/utils/error-logger.js
  js/utils/network.js
  js/utils/uuid.js
  js/utils/icons.js
  js/utils/festivos.js
  js/utils/time.js
  js/utils/validation.js
  js/utils/otp.js
  js/utils/password-hash.js

  # 3. Servicios
  js/services/supabase.js
  js/services/supabase-init.js
  js/services/error-logger.js
  js/services/session-sync.js
  js/services/calculator.js
  js/services/quincena.js
  js/services/data.js
  js/services/backup.js
  js/services/ai-nlp.js
  js/services/ai.js
  js/services/ai-enhanced.js
  js/services/ai-help.js
  js/services/export-files.js
  js/services/export-email.js
  js/services/ai-history.js
  js/services/ai-greeting.js

  # 4. Tabs
  js/tabs/home.js
  js/tabs/dashboard.js
  js/tabs/assistant.js
  js/tabs/history.js
  js/tabs/config.js
  js/tabs/sync-queue.js

  # 5. Modales
  js/modals/error-viewer.js
  js/modals/splash.js
  js/modals/email-compose-card.js
  js/modals/forgot-password.js
  js/modals/forgot-pin.js
  js/modals/pin-setup.js
  js/modals/manage-account.js
  js/modals/diagnostico.js
  js/modals/asignar-pins.js
  js/modals/usuarios.js
  js/modals/export-report.js
  js/modals/onboarding.js

  # 6. App top-level
  js/app/auth-screen.js
  js/app/fast-pin-screen.js
  js/app/app-main.js
  js/app/root.js
  js/app/sw-register.js
  js/app/init.js
  js/app/install-prompt.js
)

# Contar y validar que todos los archivos existen
TOTAL=0
MISSING=0
for f in "${JS_FILES[@]}"; do
  if [ -f "$f" ]; then
    TOTAL=$((TOTAL + 1))
  else
    echo "  ⚠ Falta: $f"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -gt 0 ]; then
  echo "❌ Faltan $MISSING archivos. Abortando."
  exit 1
fi

# Concatenar con banner de versión
{
  echo "// ════════════════════════════════════════════════════════════"
  echo "//  MI TURNO · app.js (build de producción)"
  echo "//  Versión: $VER · $(date '+%Y-%m-%d %H:%M')"
  echo "//  Archivos concatenados: $TOTAL"
  echo "//  Generado por scripts/build.sh"
  echo "// ════════════════════════════════════════════════════════════"
  echo ""
  echo "(function(){"
  echo "'use strict';"
  echo ""

  for f in "${JS_FILES[@]}"; do
    echo "// ── $f ──"
    cat "$f"
    echo ""
    echo ""
  done

  echo "})();"
} > dist/app.js

# Tamaño del bundle
SIZE=$(wc -c < dist/app.js)
SIZE_KB=$((SIZE / 1024))
echo "  ✓ $TOTAL archivos → dist/app.js (${SIZE_KB} KB)"

# ── 4. Generar index.html de producción ─────────────────────────
echo "📄 Generando index.html de producción..."

# Reemplazar los CSS fragmentados por un solo <link> y los JS por un solo <script>
python3 -c "
import re

# Usamos app.html (la aplicación real, no el landing)
with open('app.html', 'r') as f:
    html = f.read()

# ── Reemplazar CSS ──
# Buscar el bloque <!-- CSS FRAGMENTADO --> y reemplazar todo hasta
# el comentario <!-- Librerías externas --> por un solo link
css_marker = '<!-- CSS FRAGMENTADO -->'
libs_marker = '<!-- Librerías externas -->'
pos_css = html.find(css_marker)
pos_libs = html.find(libs_marker)

if pos_css == -1:
    print('ERROR: no se encontró el marcador CSS FRAGMENTADO en app.html')
    exit(1)
if pos_libs == -1:
    print('ERROR: no se encontró el marcador Librerías externas en app.html')
    exit(1)

# Conservar todo antes del marcador CSS
before_css = html[:pos_css + len(css_marker)]
# Reemplazar el bloque de CSS fragmentado por un solo link
prod_css = '\n<link rel=\"stylesheet\" href=\"app.css\">'
# Todo desde Librerías externas hasta el final
rest = html[pos_libs:]

html = before_css + prod_css + '\n' + rest

# ── Reemplazar JS ──
# Eliminar scripts del head (ya incluidos en app.js)
html = html.replace('<script src=\"js/config.js\"></script>', '')
html = html.replace('<script src=\"js/theme-boot.js\"></script>', '')

# Encontrar el comentario <!-- JS FRAGMENTADO -->
js_marker = '<!-- JS FRAGMENTADO -->'
pos_js = html.find(js_marker)

if pos_js == -1:
    print('ERROR: no se encontró el marcador JS FRAGMENTADO en app.html')
    exit(1)

# Parte antes del marcador JS (head + CDNs + splash + body hasta el marker)
head = html[:pos_js + len(js_marker)]

# Cerrar el body
tail = '\n\n</body>\n</html>\n'

# Single script de producción
prod_script = '\n<script src=\"app.js\" defer></script>'

result = head + prod_script + tail

with open('dist/app.html', 'w') as f:
    f.write(result)

print('  ✓ dist/app.html generado')
"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ Build completado                          ║"
echo "║  🎨 app.css: ${CSS_SIZE_KB} KB ($CSS_TOTAL archivos)         ║"
echo "║  📦 app.js:  ${SIZE_KB} KB ($TOTAL archivos)          ║"
echo "║  📁 dist/ lista para deploy                   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Probar localmente:  cd dist && python3 -m http.server 8000"
echo "  Deploy en Vercel:   vercel dist/ --prod"
