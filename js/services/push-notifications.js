// ════════════════════════════════════════════════════════════════
//  MI TURNO · Notificaciones Inteligentes v352
//  Smart alerts: turno activo > 8h + resumen semanal (domingos)
// ════════════════════════════════════════════════════════════════
/* global leer, grabar, dk, semLun, fCOP, doCalc, SMIN */

var _NOTIF_U8H = 8 * 3600000;

function notifEstado() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

function notifPedir(cb) {
  if (typeof Notification === 'undefined') {
    if (cb) cb('unsupported');
    return;
  }
  if (Notification.permission !== 'default') {
    if (cb) cb(Notification.permission);
    return;
  }
  Notification.requestPermission().then(function (perm) {
    if (cb) cb(perm);
  });
}

function notifEnviar(titulo, cuerpo, tag) {
  if (notifEstado() !== 'granted') return;
  try {
    new Notification(titulo, {
      body: cuerpo,
      icon: '/icon-192.png',
      tag: tag || 'mt-general',
      renotify: false
    });
  } catch (e) {}
}

function _notifCheckActivo() {
  var sess = leer('mt_sess', null);
  if (!sess || !sess.user || !sess.user.id) return;
  var uid = sess.user.id;
  var activo = leer(dk(uid, 'a'), null);
  if (!activo || !activo.inicio) return;
  var elapsed = Date.now() - new Date(activo.inicio).getTime();
  if (elapsed < _NOTIF_U8H) return;
  var notifKey = 'mt_notif_act_' + (activo.id || activo.inicio);
  if (leer(notifKey, false)) return;
  grabar(notifKey, true);
  var horas = Math.round(elapsed / 3600000);
  notifEnviar(
    '¿Cerrás el turno? 👋',
    'Llevas ' + horas + 'h activo. Cerrá el turno para que quede registrado correctamente.',
    'mt-turno-activo'
  );
}

function _notifCheckSemanal() {
  var ahora = new Date();
  if (ahora.getDay() !== 0) return; // solo domingos
  var sess = leer('mt_sess', null);
  if (!sess || !sess.user || !sess.user.id) return;
  var uid = sess.user.id;
  var lun = semLun(ahora);
  var semKeyStr = lun.toISOString().slice(0, 10);
  var semKey = dk(uid, 'notif_sem_' + semKeyStr);
  if (leer(semKey, false)) return;
  var turnos = leer(dk(uid, 't'), []);
  var salario = leer(dk(uid, 's'), SMIN);
  var vh = salario / 240;
  if (!vh || !Array.isArray(turnos) || turnos.length === 0) return;
  var semTurnos = turnos.filter(function (t) {
    if (!t.fin) return false;
    var ini = new Date(t.inicio);
    return ini >= lun && ini <= ahora;
  });
  if (semTurnos.length === 0) return;
  grabar(semKey, true);
  var calc = doCalc(semTurnos, null, ahora, vh);
  notifEnviar(
    'Resumen de tu semana 📋',
    semTurnos.length +
      (semTurnos.length === 1 ? ' turno' : ' turnos') +
      ' · ' +
      fCOP(Math.round(calc.totalCOP)) +
      ' estimados',
    'mt-sem-summary'
  );
}

function notifOnVisible() {
  if (notifEstado() !== 'granted') return;
  _notifCheckActivo();
  _notifCheckSemanal();
}

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    notifOnVisible();
  }
});

window.notifEstado = notifEstado;
window.notifPedir = notifPedir;
window.notifEnviar = notifEnviar;
window.notifOnVisible = notifOnVisible;
