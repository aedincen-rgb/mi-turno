// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/sync-queue.js
//  Cola de sincronización offline-first para Supabase
// ════════════════════════════════════════════════════════════════

var _SYNC_QUEUE_KEY = 'mt_sync_queue';

// Carga la cola de sincronización para un UID específico
function _loadSyncQueue(uid) {
  try {
    var allQueues = leer(_SYNC_QUEUE_KEY, {});
    return allQueues[uid] || [];
  } catch (e) {
    console.error('[SyncQueue] Error al cargar cola:', e);
    return [];
  }
}

// Guarda la cola de sincronización para un UID específico
function _saveSyncQueue(uid, queue) {
  try {
    var allQueues = leer(_SYNC_QUEUE_KEY, {});
    allQueues[uid] = queue;
    grabar(_SYNC_QUEUE_KEY, allQueues);
  } catch (e) {
    console.error('[SyncQueue] Error al guardar cola:', e);
  }
}

// Añade una acción a la cola
function queueAction(uid, actionType, payload) {
  if (!uid) {
    console.warn('[SyncQueue] UID no proporcionado para queueAction. Acción ignorada.');
    return;
  }
  var queue = _loadSyncQueue(uid);
  queue.push({ id: generateUUID(), timestamp: Date.now(), actionType, payload });
  _saveSyncQueue(uid, queue);
  console.log('[SyncQueue] Acción encolada:', actionType, payload);
}

// Procesa la cola de sincronización
async function processQueue(uid) {
  if (!uid || !isOnline() || !CLOUD_MODE || !SUPA) {
    return; // No hay UID, offline, o no hay Supabase
  }

  var queue = _loadSyncQueue(uid);
  if (queue.length === 0) {
    return; // Cola vacía
  }

  console.log('[SyncQueue] Procesando cola de sincronización para UID:', uid, '(', queue.length, 'acciones)');

  var successfulActions = [];
  for (var i = 0; i < queue.length; i++) {
    var action = queue[i];
    try {
      var result;
      switch (action.actionType) {
        case 'insertTurno':
          result = await supaInsertTurno(uid, action.payload);
          break;
        case 'setActivo':
          result = await supaSetActivo(uid, action.payload);
          break;
        case 'deleteTurno':
          result = await supaDeleteTurno(uid, action.payload.id);
          break;
        case 'deleteAllTurnos':
          result = await supaDeleteAllTurnos(uid);
          break;
        case 'setSalario':
          result = await supaSetSalario(uid, action.payload.salario);
          break;
        default:
          console.warn('[SyncQueue] Tipo de acción desconocido:', action.actionType);
          result = { success: true }; // Para eliminar acciones desconocidas
      }
      if (result && result.success) {
        successfulActions.push(action.id);
        console.log('[SyncQueue] Acción sincronizada con éxito:', action.actionType);
      } else {
        console.warn('[SyncQueue] Fallo al sincronizar acción:', action.actionType, result.error || 'Error desconocido');
        // Si falla, no la eliminamos de la cola para reintentar más tarde
      }
    } catch (e) {
      console.error('[SyncQueue] Error al ejecutar acción de cola:', action.actionType, e);
      // Si hay un error, no la eliminamos de la cola para reintentar más tarde
    }
  }

  // Eliminar solo las acciones que fueron exitosas
  var newQueue = queue.filter(function (a) {
    return successfulActions.indexOf(a.id) === -1;
  });
  _saveSyncQueue(uid, newQueue);
  if (newQueue.length < queue.length) {
    console.log('[SyncQueue] Cola actualizada. Acciones restantes:', newQueue.length);
  }
}

// Limpia la cola de sincronización para un UID específico
function clearSyncQueue(uid) {
  if (!uid) return;
  var allQueues = leer(_SYNC_QUEUE_KEY, {});
  delete allQueues[uid];
  grabar(_SYNC_QUEUE_KEY, allQueues);
  console.log('[SyncQueue] Cola de sincronización limpiada para UID:', uid);
}