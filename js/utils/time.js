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
