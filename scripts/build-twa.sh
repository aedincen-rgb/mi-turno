#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  scripts/build-twa.sh
#  Compila el AAB firmado de Mi Turno para Google Play Store.
#
#  REQUISITOS:
#    - Java 17+ (ya disponible en tu sistema: openjdk 17.0.19)
#    - Android SDK en $ANDROID_HOME (ya configurado: ~/.bubblewrap/android_sdk)
#    - twa/android.keystore (regenerado en v163, password: miturno2026)
#
#  RESULTADO:
#    - app/build/outputs/bundle/release/app-release.aab  ← SUBIR A PLAY STORE
#    - app/build/outputs/apk/release/app-release.apk    ← opcional, para sideload
#
#  USO:
#    bash scripts/build-twa.sh
# ════════════════════════════════════════════════════════════════
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEYSTORE="$ROOT/twa/android.keystore"
KEY_ALIAS="miturno"
KEY_PASS="miturno2026"
STORE_PASS="miturno2026"

# ─── Validaciones previas ──────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   Mi Turno · Build TWA (Android App Bundle)                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

if [ ! -f "$KEYSTORE" ]; then
  echo "✗ ERROR: No encuentro twa/android.keystore"
  echo "  Regeneralo con:"
  echo "    keytool -genkeypair -keystore twa/android.keystore \\"
  echo "      -alias miturno -keyalg RSA -keysize 2048 -validity 25000 \\"
  echo "      -storepass miturno2026 -keypass miturno2026 \\"
  echo "      -dname 'CN=Mi Turno, OU=Apps, O=Mi Turno, L=Bogota, C=CO'"
  exit 1
fi

if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  echo "⚠ ANDROID_HOME no configurado. Probando con ~/.bubblewrap/android_sdk"
  export ANDROID_HOME="$HOME/.bubblewrap/android_sdk"
  export ANDROID_SDK_ROOT="$ANDROID_HOME"
fi

if ! command -v java >/dev/null 2>&1; then
  echo "✗ ERROR: java no está en PATH"
  exit 1
fi

if [ ! -x "./gradlew" ]; then
  echo "✗ ERROR: ./gradlew no existe o no es ejecutable"
  exit 1
fi

# ─── Verificar keystore ────────────────────────────────────────
echo "→ Verificando keystore..."
SHA256=$(keytool -list -v -keystore "$KEYSTORE" -storepass "$STORE_PASS" -alias "$KEY_ALIAS" 2>/dev/null | grep "SHA256:" | awk '{print $2}')
if [ -z "$SHA256" ]; then
  echo "✗ ERROR: No pude leer el keystore. ¿Password correcto? (esperado: $STORE_PASS)"
  exit 1
fi
echo "  SHA256: $SHA256"
echo "  Alias:  $KEY_ALIAS"
echo ""

# ─── Verificar que assetlinks.json coincide con el keystore ────
echo "→ Verificando .well-known/assetlinks.json..."
ASSETLINKS_SHA=$(grep -o '[A-F0-9:]\{95\}' .well-known/assetlinks.json | head -1)
if [ "$ASSETLINKS_SHA" != "$SHA256" ]; then
  echo "  ⚠ ADVERTENCIA: El SHA256 de assetlinks.json NO coincide con el keystore"
  echo "    Keystore:  $SHA256"
  echo "    assetlinks: $ASSETLINKS_SHA"
  echo "    Si subís este AAB a Play Store, Digital Asset Links NO va a validar."
  read -p "    ¿Continuar de todos modos? (s/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    exit 1
  fi
else
  echo "  ✓ Coincide: $SHA256"
fi
echo ""

# ─── Limpiar builds previos ────────────────────────────────────
echo "→ Limpiando builds previos..."
./gradlew clean --quiet 2>&1 | tail -3 || true
echo ""

# ─── Compilar AAB release ──────────────────────────────────────
echo "→ Compilando app-release.aab (puede tardar 2-5 min la primera vez)..."
./gradlew :app:bundleRelease \
  -Pandroid.injected.signing.store.file="$KEYSTORE" \
  -Pandroid.injected.signing.store.password="$STORE_PASS" \
  -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$KEY_PASS" \
  --no-daemon 2>&1 | tail -20

# ─── Verificar resultado ───────────────────────────────────────
AAB="app/build/outputs/bundle/release/app-release.aab"
APK="app/build/outputs/apk/release/app-release.apk"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
if [ -f "$AAB" ]; then
  AAB_SIZE=$(du -h "$AAB" | awk '{print $1}')
  echo "║  ✓ BUILD EXITOSO                                            ║"
  echo "╠═══════════════════════════════════════════════════════════════╣"
  echo "║  AAB:  $AAB ($AAB_SIZE)"
  [ -f "$APK" ] && echo "║  APK:  $APK ($(du -h "$APK" | awk '{print $1}'))"
  echo "╠═══════════════════════════════════════════════════════════════╣"
  echo "║  PRÓXIMOS PASOS (cuando completes el pago de USD \$25):     ║"
  echo "║                                                              ║"
  echo "║  1. Ir a https://play.google.com/console                     ║"
  echo "║  2. Crear app: 'Mi Turno' (id: one.miturno.twa)            ║"
  echo "║  3. Testing → Internal testing → Create release             ║"
  echo "║  4. Subir: $AAB"
  echo "║  5. Revisar y enviar a revisión (~24-48h)                   ║"
  echo "║                                                              ║"
  echo "║  Ver PLAY_STORE.md para guía paso a paso completa.           ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
else
  echo "║  ✗ BUILD FALLÓ                                               ║"
  echo "╠═══════════════════════════════════════════════════════════════╣"
  echo "║  No se generó $AAB"
  echo "║  Revisá los logs arriba o corré:                             ║"
  echo "║    ./gradlew :app:bundleRelease --stacktrace                 ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  exit 1
fi
