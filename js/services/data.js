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
  if (!CLOUD_MODE || pinOnly || !SUPA) return Promise.resolve(getLocal());
  return withTimeout(supaSyncDown(uid), 8000, 'sync')
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

      // ── Resolución de conflictos para SALARIO ──
      // Si el usuario marcó su salario como configurado localmente
      // (flag 'sc'), local es la fuente de verdad — no dejamos que
      // un cloud desactualizado lo arrastre hacia atrás.
      // Esto resuelve el bug donde editar el salario en Ajustes no
      // se aplicaba al estimado tras un reload: cargarDatos pulía
      // siempre el valor remoto sobre el local recién guardado.
      var localSalario = leer(dk(uid, 's'), null);
      var localConfigured = leer(dk(uid, 'sc'), false) === true;
      var finalSalario = remote.salario;
      var pushBackToCloud = false;

      if (localConfigured && localSalario && Number(localSalario) > 0) {
        // Local manda — y si difiere del remoto, programamos un push
        if (Number(localSalario) !== Number(remote.salario)) {
          finalSalario = Number(localSalario);
          pushBackToCloud = true;
        } else {
          finalSalario = Number(localSalario);
        }
      }
      grabar(dk(uid, 's'), finalSalario);

      if (pushBackToCloud) {
        // Fire-and-forget: no bloqueamos la carga
        try {
          if (typeof supaSetSalario === 'function') {
            supaSetSalario(uid, finalSalario).catch(function () {});
          }
        } catch (_) {}
      }

      return {
        turnos: merged,
        activo: remote.activo,
        salario: finalSalario,
        // El flag remoto solo es útil si local NO está marcado todavía:
        // el usuario puede haber pulsado en este device → local manda.
        // Pero si local nunca fue tocado en este device, el flag remoto
        // nos dice si fue configurado desde OTRO device (incluyendo
        // dominios distintos como github.io vs vercel.app).
        salarioConfigured: remote.salarioConfigured === true
      };
    })
    .catch(function (e) {
      console.warn('[MT] fallback local:', e.message);
      return getLocal();
    });
}

function insertTurno(uid, inicio) {
  return Promise.resolve({
    id: generateUUID(),
    inicio: inicio,
    userId: uid
  });
}
