#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════
#  clone-fresh.sh
#  Borra los clones locales viejos y clona una versión limpia.
#
#  USO: bash clone-fresh.sh
#
#  Esto es seguro: el repo en GitHub es la fuente de verdad.
#  Después del clone, regenera el keystore TWA con una sola línea.
# ════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_URL="https://github.com/aedincen-rgb/mi-turno-BETA.git"
TARGET="mi-turno"
SHA_NEW="7D:04:95:A9:38:E7:14:77:A4:91:9A:52:18:83:31:F0:E4:5E:E4:56:6D:08:8A:80:70:32:26:BA:85:45:AB:7B"
STORE_PASS="miturno2026"

cd ~/  # importante: desde el home para no borrar lo que estás parado

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Mi Turno · Clonado limpio"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Esto va a:"
echo "  1. Borrar ~/mi-turno y ~/mi-turno-BETA (si existen)"
echo "  2. Clonar el repo desde GitHub en ~/mi-turno"
echo "  3. Regenerar el keystore TWA local"
echo "  4. Actualizar .well-known/assetlinks.json con el SHA256 nuevo"
echo "  5. Dejarte en ~/mi-turno listo para trabajar"
echo ""
read -p "¿Continuar? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
  echo "Cancelado."
  exit 1
fi

# Borrar clones viejos
for dir in mi-turno mi-turno-BETA; do
  if [ -d "$HOME/$dir" ]; then
    echo "  - Borrando ~/$dir..."
    rm -rf "$HOME/$dir"
  fi
done

# Clonar limpio
echo "  - Clonando $REPO_URL en ~/$TARGET..."
git clone "$REPO_URL" "$HOME/$TARGET"
cd "$HOME/$TARGET"

# Regenerar keystore
echo "  - Regenerando twa/android.keystore..."
keytool -genkeypair \
  -keystore twa/android.keystore \
  -alias miturno \
  -keyalg RSA -keysize 2048 -validity 25000 \
  -storepass "$STORE_PASS" -keypass "$STORE_PASS" \
  -dname "CN=Mi Turno, OU=Apps, O=Mi Turno, L=Bogota, ST=Cundinamarca, C=CO" \
  2>&1 | tail -2

# Actualizar assetlinks
cat > .well-known/assetlinks.json <<EOF
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "one.miturno.twa",
    "sha256_cert_fingerprints": [
      "$SHA_NEW"
    ]
  }
}]
EOF

# Verificación final
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Listo. Estado final:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Carpeta:    ~/$TARGET"
echo "  Versión:    $(grep MT_APP_VERSION js/config/globals.js)"
echo "  Keystore:   $(ls -la twa/android.keystore | awk '{print $5}') bytes"
echo "  Assetlinks: SHA256 $(grep -o '[A-F0-9:]\{95\}' .well-known/assetlinks.json | head -1 | cut -c1-12)..."
echo "  Working:    $(git status --short | wc -l) archivos modificados (esperado 0 en disco, keystore en .gitignore)"
echo ""
echo "Próximos pasos:"
echo "  cd ~/$TARGET"
echo "  scripts/check.sh         # valida sintaxis y versionado"
echo "  npm run dev              # arranca el server en :8000"
echo ""
