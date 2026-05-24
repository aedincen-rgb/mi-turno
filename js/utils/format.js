// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/format.js
//  Formateo de moneda y duración
// ════════════════════════════════════════════════════════════════
function fCOP(v) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(v || 0);
}

function fDur(m) {
  var mm = Math.max(0, Math.round(m));
  return Math.floor(mm / 60) + 'h ' + String(mm % 60).padStart(2, '0') + 'm';
}

function fDurShort(m) {
  var mm = Math.max(0, Math.round(m));
  var hh = Math.floor(mm / 60);
  return hh + 'h' + (mm % 60 > 0 ? ' ' + (mm % 60) + 'm' : '');
}
