// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/data.js
//  CRUD de datos local/nube
// ════════════════════════════════════════════════════════════════
function cargarDatos(uid, pinOnly) {
  if (!uid) return Promise.reject(new Error('UID requerido'));
  var getLocal = function () {
    var t = validarTurnos(leer(dk(uid, 't'), []), uid);
    var a = validarTurnoActivo(leer(dk(uid, 'a'), null), uid);
    var s = leer(dk(uid, 's'), SMIN);
    return { turnos: t, activo: a, salario: s };
  };
  // Sin red: devolver datos locales al instante (no esperar timeout de 8s)
  if (!CLOUD_MODE || pinOnly || !SUPA || !navigator.onLine) return Promise.resolve(getLocal());
  return withTimeout(supaSyncDown(uid), 4000, 'sync')
    .then(function (remote) {
      if (!remote) return getLocal();
      var remoteTurnos = (remote.turnos || []).filter(function (t) {
        return t.userId === uid;
      });
      if (remote.activo && remote.activo.userId !== uid) remote.activo = null;
      var localTurnos = validarTurnos(leer(dk(uid, 't'), []), uid);
      var remoteIds = new Set(
        remoteTurnos.map(function (t) {
          return t.id;
        })
      );
      var merged = remoteTurnos.concat(
        localTurnos.filter(function (t) {
          return !remoteIds.has(t.id);
        })
      );
      grabar(dk(uid, 't'), merged);
      if (remote.activo) grabar(dk(uid, 'a'), remote.activo);
      else borrarKey(dk(uid, 'a'));
      grabar(dk(uid, 's'), remote.salario);
      return { turnos: merged, activo: remote.activo, salario: remote.salario };
    })
    .catch(function (e) {
      console.warn('[MT] fallback local:', e.message);
      return getLocal();
    });
}

function insertTurno(uid, inicio) {
  return Promise.resolve({
    id: 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
    inicio: inicio,
    userId: uid
  });
}
