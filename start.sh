#!/bin/bash
# ─────────────────────────────────────────────
#  MI TURNO · Servidor de desarrollo local
#  Uso: ./start.sh
# ─────────────────────────────────────────────
IP=$(hostname -I | awk '{print $1}')
DIR="$(cd "$(dirname "$0")" && pwd)"
CERT="$DIR/192.168.80.23+2.pem"
KEY="$DIR/192.168.80.23+2-key.pem"

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║        MI TURNO — Dev Server          ║"
echo "╠═══════════════════════════════════════╣"

if [ -f "$CERT" ] && [ -f "$KEY" ]; then
  echo "║  ✅ HTTPS activo (iPhone compatible)  ║"
  echo "╠═══════════════════════════════════════╣"
  echo "║  PC:      https://localhost:8000      ║"
  echo "║  iPhone:  https://$IP:8000  ║"
  echo "╠═══════════════════════════════════════╣"
  echo "║  Admin:   https://$IP:8000/admin-bypass.html ║"
  echo "╚═══════════════════════════════════════╝"
  echo ""
  npx http-server "$DIR" -p 8000 --ssl --cert "$CERT" --key "$KEY" -c-1 --cors -o
else
  echo "║  ⚠️  HTTP (sin certificado SSL)        ║"
  echo "╠═══════════════════════════════════════╣"
  echo "║  PC:      http://localhost:8000       ║"
  echo "║  iPhone:  http://$IP:8000   ║"
  echo "╚═══════════════════════════════════════╝"
  echo ""
  python3 -m http.server 8000 --bind 0.0.0.0
fi
