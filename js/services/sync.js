// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/sync.js
//  Cola offline → Supabase: encola operaciones cuando no hay red
//  y las procesa en orden cuando vuelve la conexión.
// ════════════════════════════════════════════════════════════════
var SYNC_Q_KEY = 'mt_sync_q';

// Añade una operación a la cola persistente.
// type: 'setActivo' | 'insertTurno' | 'deleteTurno' | 'deleteAllTurnos' | 'setSalario'
function enqueueOp(op) {
  var q = leer(SYNC_Q_KEY, []);

  // Para setActivo: solo mantener el más reciente por usuario (idempotente)
  if (op.type === 'setActivo') {
    q = q.filter(function (o) {
      return !(o.type === 'setActivo' && o.uid === op.uid);
    });
  }

  // Para deleteTurno: eliminar cualquier insertTurno pendiente del mismo id
  if (op.type === 'deleteTurno') {
    q = q.filter(function (o) {
      return !(o.type === 'insertTurno' && o.uid === op.uid && o.data && o.data.id === op.id);
    });
  }

  // Para deleteAllTurnos: limpiar todos los insertTurno del usuario
  if (op.type === 'deleteAllTurnos') {
    q = q.filter(function (o) {
      return !(o.type === 'insertTurno' && o.uid === op.uid);
    });
  }

  q.push(Object.assign({ ts: Date.now() }, op));
  grabar(SYNC_Q_KEY, q);
}

// Procesa la cola para un uid concreto.
// Solo actúa si hay red real; no lanza errores al llamador.
function flushSyncQueue(uid) {
  if (!CLOUD_MODE || !SUPA || !navigator.onLine) return Promise.resolve();

  var all = leer(SYNC_Q_KEY, []);
  var mine = all.filter(function (o) {
    return o.uid === uid;
  });
  var others = all.filter(function (o) {
    return o.uid !== uid;
  });

  if (!mine.length) return Promise.resolve();

  // Optimistic: sacar de la cola antes de enviar
  grabar(SYNC_Q_KEY, others);

  return Promise.allSettled(
    mine.map(function (op) {
      switch (op.type) {
        case 'setActivo':
          return supaSetActivo(op.uid, op.data);
        case 'insertTurno':
          return supaInsertTurno(op.uid, op.data);
        case 'deleteTurno':
          return supaDeleteTurno(op.uid, op.id);
        case 'deleteAllTurnos':
          return supaDeleteAllTurnos(op.uid);
        case 'setSalario':
          return supaSetSalario(op.uid, op.data);
        default:
          return Promise.resolve();
      }
    })
  ).then(function (results) {
    // Re-encolar solo las que fallaron (red caída a mitad de flush)
    var failed = mine.filter(function (_, i) {
      return results[i].status === 'rejected';
    });
    if (failed.length) {
      var current = leer(SYNC_Q_KEY, []);
      grabar(SYNC_Q_KEY, current.concat(failed));
    }
  });
}

// Cuántas ops hay pendientes para un uid (para mostrar badge/aviso)
function pendingOpsCount(uid) {
  return leer(SYNC_Q_KEY, []).filter(function (o) {
    return o.uid === uid;
  }).length;
}
