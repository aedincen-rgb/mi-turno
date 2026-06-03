// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/sync-queue.js
//  Cola de sincronización offline-first para Supabase
//
//  Patrón (web research 2026, ver "JS PWAs at Scale: Offline Sync"):
//   1. queueAction()  → encola Y dispara _scheduleFlush (debounced)
//   2. _scheduleFlush → setTimeout 250 ms para coalescer ráfagas
//                       (ej. parar turno = insertTurno + setActivo null)
//   3. processQueue   → IN_FLIGHT guard para evitar runs concurrentes
//   4. onOnline       → re-flush cuando la red vuelve
//   5. Errores permanentes (23505) se descartan; transitorios reintentan
// ════════════════════════════════════════════════════════════════

var _SYNC_QUEUE_KEY = 'mt_sync_queue';
var _flushTimers = {}; // uid → timeout id (debounce)
var _processingFlags = {}; // uid → bool (IN_FLIGHT)

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
    // Notificar al indicador de sync que la cola cambió
    if (typeof window.__updateQueueCount === 'function') {
      window.__updateQueueCount();
    }
  } catch (e) {
    console.error('[SyncQueue] Error al guardar cola:', e);
  }
}

// Añade una acción a la cola Y dispara un flush inmediato (debounced
// 250 ms) para que el dato llegue a Supabase ahora — no en el próximo
// reload. Sin esto las acciones quedaban estancadas en localStorage
// y los otros devices nunca veían el cambio (causa raíz de v39).
function queueAction(uid, actionType, payload) {
  if (!uid) {
    console.warn('[SyncQueue] UID no proporcionado para queueAction. Acción ignorada.');
    return;
  }
  var queue = _loadSyncQueue(uid);
  queue.push({ id: generateUUID(), timestamp: Date.now(), actionType, payload });
  _saveSyncQueue(uid, queue);
  console.log('[SyncQueue] Acción encolada:', actionType, payload);
  _scheduleFlush(uid);
}

// Debounce per-uid: si vienen varias acciones en menos de 250 ms (caso
// típico: parar turno encola insertTurno + setActivo null casi juntos)
// se procesan en una sola pasada.
function _scheduleFlush(uid) {
  if (!uid) return;
  if (_flushTimers[uid]) return; // ya hay uno agendado
  _flushTimers[uid] = setTimeout(function () {
    _flushTimers[uid] = null;
    processQueue(uid);
  }, 250);
}

// Procesa la cola de sincronización
async function processQueue(uid) {
  if (!uid || !isOnline() || !CLOUD_MODE || !SUPA) {
    return; // No hay UID, offline, o no hay Supabase
  }
  // IN_FLIGHT guard: evita que dos invocaciones concurrentes
  // (boot + queueAction + onOnline en milisegundos) procesen lo
  // mismo dos veces — fuente clásica de duplicados.
  if (_processingFlags[uid]) {
    console.log('[SyncQueue] Ya hay un flush en curso para', uid, '— saltando');
    return;
  }
  _processingFlags[uid] = true;

  // Auth-gate: si Supabase no tiene sesión autenticada (p. ej. se entró por
  // PIN sin restaurar tokens, o tras un logout) NO machacamos la cola contra
  // RLS en bucle — eso dejaba el LED ámbar pegado para siempre. La dejamos
  // intacta; se vacía cuando vuelve la auth (root.js dispara processQueue en
  // SIGNED_IN / TOKEN_REFRESHED) o cuando vuelve la red (onOnline).
  try {
    var _authed = await withTimeout(SUPA.auth.getSession(), 6000, 'auth-gate cola');
    if (!_authed || !_authed.data || !_authed.data.session) {
      _processingFlags[uid] = false;
      return;
    }
  } catch (_) {
    _processingFlags[uid] = false;
    return;
  }

  var queue = _loadSyncQueue(uid);
  if (queue.length === 0) {
    _processingFlags[uid] = false;
    return; // Cola vacía
  }

  console.log(
    '[SyncQueue] Procesando cola de sincronización para UID:',
    uid,
    '(',
    queue.length,
    'acciones)'
  );

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
        case 'updatePinLookup':
          result = await supaUpdatePinLookup(uid, action.payload);
          break;
        case 'propagateEmail':
          result = await supaPropagateEmail(uid, action.payload);
          break;
        default:
          console.warn('[SyncQueue] Tipo de acción desconocido:', action.actionType);
          result = { success: true }; // Para eliminar acciones desconocidas
      }
      if (result && result.success) {
        successfulActions.push(action.id);
        console.log('[SyncQueue] Acción sincronizada con éxito:', action.actionType);
      } else if (result && result.permanent) {
        // Errores permanentes (ej. PIN duplicado): descartar la acción
        // para no reintentarla eternamente. El usuario verá un toast
        // y deberá elegir otro PIN desde la UI.
        successfulActions.push(action.id);
        console.warn(
          '[SyncQueue] Acción descartada (error permanente):',
          action.actionType,
          result.error
        );
        try {
          var msg =
            action.actionType === 'updatePinLookup'
              ? 'Tu PIN nuevo ya estaba en uso por otra cuenta. Configurá otro desde Ajustes.'
              : 'Cambio rechazado por el servidor.';
          // Toast diferido para no chocar con otras notificaciones
          setTimeout(function () {
            if (typeof window.showToast === 'function') window.showToast(msg);
          }, 600);
        } catch (_) {}
      } else {
        console.warn(
          '[SyncQueue] Fallo al sincronizar acción:',
          action.actionType,
          result.error || 'Error desconocido'
        );
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
  _processingFlags[uid] = false;
  // Si alguna acción falló pero es transitoria, re-agendamos otro
  // intento en 5 s. Sin esto la cola se quedaba estancada hasta el
  // próximo reload / cambio de red.
  if (newQueue.length > 0) {
    setTimeout(function () {
      _scheduleFlush(uid);
    }, 5000);
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
