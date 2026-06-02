// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/time.js
//  Helpers temporales
// ════════════════════════════════════════════════════════════════
function esNoct(d) {
  return d.getHours() >= 21 || d.getHours() < 6;
}

function semLun(d) {
  if (!d || isNaN(d.getTime())) return new Date(0);
  var r = new Date(d);
  r.setHours(0, 0, 0, 0);
  var dia = r.getDay();
  r.setDate(r.getDate() - (dia === 0 ? 6 : dia - 1));
  return r;
}

function dk(uid, n) {
  if (!uid) throw new Error('UID requerido para acceder a datos');
  return 'mt_' + n + '_' + uid;
}

// Ley 2101/2021: Obtener jornada máxima semanal según año del turno
// Facilita auditoría y mantenimiento de la reforma laboral colombiana
function obtenerJornadaMaximaSemanas(fechaTurno) {
  var anio = new Date(fechaTurno).getFullYear();
  if (anio <= 2022) return 48; // Pre-reforma
  if (anio === 2023) return 47; // A partir de jun 2023
  if (anio === 2024) return 46; // A partir de jun 2024
  if (anio === 2025) return 45; // A partir de jun 2025
  if (anio === 2026) return 44; // A partir de jun 2026
  return 42; // 2027 en adelante (meta final)
}
