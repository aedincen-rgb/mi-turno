// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/supabase.js
//  Helpers CRUD de Supabase
// ════════════════════════════════════════════════════════════════

// Estado de la suscripción Realtime, para el indicador de conexión del
// header. Valores: null | 'CONNECTING' | 'SUBSCRIBED' | 'TIMED_OUT' |
// 'CHANNEL_ERROR' | 'CLOSED'. Es informativo: lo lee getRealtimeStatus().
var _mtRealtimeStatus = null;
function getRealtimeStatus() {
  return _mtRealtimeStatus;
}

function supaSyncDown(uid) {
  if (!SUPA) return Promise.resolve(null);
  return SUPA.auth.getSession().then(function (sres) {
    // Sin sesión autenticada en Supabase (p. ej. se entró por PIN offline
    // tras un signOut global) la nube NO es fuente de verdad: sus queries
    // con RLS devuelven vacío SIN error y borrarían el turno activo y el
    // salario locales. Devolvemos null → cargarDatos cae a los datos locales.
    if (!sres || !sres.data || !sres.data.session) return null;
    return Promise.all([
      SUPA.from('perfiles').select('salario_base').eq('id', uid).maybeSingle(),
      SUPA.from('turnos')
        .select('id,inicio,fin')
        .eq('user_id', uid)
        .order('inicio', { ascending: false })
        .limit(500),
      SUPA.from('turno_activo').select('id,inicio').eq('user_id', uid).maybeSingle()
    ])
      .then(function (results) {
        if (results[0].error || results[1].error) return null;
        if (results[2].error && results[2].error.code !== 'PGRST116') return null;
        var perfil = results[0].data;
        var turnos = (results[1].data || []).map(function (t) {
          return { id: t.id, inicio: t.inicio, fin: t.fin, userId: uid };
        });
        var activoRaw = results[2].data;
        var activo = activoRaw ? { id: activoRaw.id, inicio: activoRaw.inicio, userId: uid } : null;
        // Distinguimos "configurado" de "default": si perfil.salario_base
        // es un número > 0, el usuario lo guardó explícitamente alguna vez
        // (aunque coincida con SMIN actual por casualidad). Esto evita que
        // el banner de "Salario no configurado" aparezca para siempre cuando
        // el SMIN del año sube hasta el valor que el usuario ya tenía.
        var rawSalario = perfil && perfil.salario_base;
        var salarioConfigured = rawSalario != null && Number(rawSalario) > 0;
        var salario = salarioConfigured ? Number(rawSalario) : SMIN;
        return {
          turnos: turnos,
          activo: activo,
          salario: salario,
          salarioConfigured: salarioConfigured
        };
      })
      .catch(function (e) {
        console.warn('[Supa] error:', e);
        return null;
      });
  });
}

function supaSetActivo(uid, activo) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  if (!activo) {
    return SUPA.from('turno_activo')
      .delete()
      .eq('user_id', uid)
      .then(function (res) {
        return { success: !res.error, error: res.error };
      })
      .catch(function (e) {
        return { success: false, error: e };
      });
  }
  return SUPA.from('turno_activo')
    .upsert(
      {
        user_id: uid,
        id: activo.id,
        inicio: activo.inicio,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    ) // Upsert para manejar si ya existe un activo
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

function supaInsertTurno(uid, turno) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('turnos')
    .insert({ id: turno.id, user_id: uid, inicio: turno.inicio, fin: turno.fin })
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

function supaUpdateTurno(uid, turno) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  // Edición de un turno existente: cambia inicio/fin, preserva id (PK).
  // .update() (no upsert): si la fila no existe es no-op silencioso, pero
  // eso solo pasaría si el insertTurno previo aún no sincronizó (FIFO lo evita).
  return SUPA.from('turnos')
    .update({ inicio: turno.inicio, fin: turno.fin })
    .eq('user_id', uid)
    .eq('id', turno.id)
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

function supaDeleteTurno(uid, id) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('turnos')
    .delete()
    .eq('user_id', uid)
    .eq('id', id)
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

function supaDeleteAllTurnos(uid) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('turnos')
    .delete()
    .eq('user_id', uid)
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

// GDPR: borra la cuenta del usuario autenticado y TODOS sus datos en la
// nube (turnos, turno_activo, pin_lookup, perfiles, logs, y la fila de
// auth.users). Usa la RPC delete_my_account (SECURITY DEFINER, opera sobre
// auth.uid() — el cliente nunca pasa el uid, lo resuelve el servidor).
function supaDeleteAccount() {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.rpc('delete_my_account')
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

function supaSetSalario(uid, salario) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  // UPSERT (no UPDATE): si la fila no existe la crea, si existe la actualiza.
  // Antes usábamos .update() y si el perfil no estaba creado, fallaba en
  // silencio — la app marcaba "sincronizado" pero el valor nunca llegaba.
  return SUPA.from('perfiles')
    .upsert(
      { id: uid, salario_base: salario, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

// Nueva función para upsert de perfil (usada en sync-queue)
function supaUpsertPerfil(uid, data) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  var payload = {};
  payload.id = uid;
  // Object.assign evita spread operator (...data) que viola ES5 y rompe Android <60
  if (data && typeof data === 'object') Object.assign(payload, data);
  return SUPA.from('perfiles')
    .upsert(payload, { onConflict: 'id' })
    .then(function (res) {
      return { success: !res.error, error: res.error };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

// ── Suscripción Realtime por usuario ──────────────────────────────
// Escucha cambios en turno_activo y turnos filtrados por user_id y
// dispara onChange(table, payload) por cada evento (INSERT/UPDATE/
// DELETE). Devuelve una función de limpieza. Tolera entornos donde
// SUPA no expone channel() (fallback silencioso).
// Resuscribir manualmente el canal activo (lo exponemos en window para
// que app-main lo dispare al volver del background / recuperar red).
var _mtForceResubscribe = null;

function supaSubscribeUser(uid, onChange) {
  if (!SUPA || !uid || typeof SUPA.channel !== 'function') return function () {};

  var ch = null;
  var disposed = false;
  var attempts = 0;
  var reconnectT = null;

  function clearReconnect() {
    if (reconnectT) {
      clearTimeout(reconnectT);
      reconnectT = null;
    }
  }

  function teardown() {
    try {
      if (ch && SUPA && SUPA.removeChannel) SUPA.removeChannel(ch);
    } catch (_) {}
    ch = null;
  }

  // Backoff exponencial con jitter y tope: 2s, 4s, 8s, 16s … máx 30s.
  // Sin esto, un CHANNEL_ERROR/TIMED_OUT/CLOSED dejaba el canal muerto
  // y el LED en rojo hasta recargar la app (causa del bug recurrente).
  function scheduleReconnect() {
    if (disposed) return;
    clearReconnect();
    attempts++;
    var base = Math.min(30000, 1000 * Math.pow(2, Math.min(attempts, 5)));
    var delay = base + Math.floor(Math.random() * 1000);
    reconnectT = setTimeout(function () {
      if (disposed) return;
      teardown();
      connect();
    }, delay);
  }

  function connect() {
    if (disposed || !SUPA || typeof SUPA.channel !== 'function') return;
    // Sin red no tiene sentido intentar: marcamos CLOSED y reprogramamos
    // (el evento 'online' / la vuelta al foreground forzarán antes).
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      _mtRealtimeStatus = 'CLOSED';
      scheduleReconnect();
      return;
    }
    _mtRealtimeStatus = 'CONNECTING';
    try {
      ch = SUPA.channel('mt-user-' + uid)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'turno_activo', filter: 'user_id=eq.' + uid },
          function (payload) {
            try {
              onChange('turno_activo', payload);
            } catch (_) {}
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'turnos', filter: 'user_id=eq.' + uid },
          function (payload) {
            try {
              onChange('turnos', payload);
            } catch (_) {}
          }
        )
        .subscribe(function (status) {
          _mtRealtimeStatus = status;
          if (status === 'SUBSCRIBED') {
            attempts = 0;
            clearReconnect();
            console.log('[MT] Realtime suscrito para', uid);
            // Realtime NUNCA reenvía los eventos perdidos mientras estuvo
            // desconectado. Por eso, en CADA (re)suscripción forzamos un
            // re-fetch completo para reconciliar (best practice Supabase).
            try {
              if (typeof window.__mtResync === 'function') setTimeout(window.__mtResync, 250);
            } catch (_) {}
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('[MT] Realtime status:', status, '→ reintento con backoff');
            scheduleReconnect();
          }
        });
    } catch (e) {
      _mtRealtimeStatus = 'CHANNEL_ERROR';
      console.warn('[MT] No se pudo iniciar realtime:', e);
      scheduleReconnect();
    }
  }

  // Resuscripción inmediata bajo demanda (al volver al foreground / online).
  // Si ya está SUBSCRIBED no hace nada; si está caído, reinicia el backoff.
  _mtForceResubscribe = function () {
    if (disposed) return;
    if (_mtRealtimeStatus === 'SUBSCRIBED') return;
    clearReconnect();
    attempts = 0;
    teardown();
    connect();
  };

  connect();

  return function () {
    disposed = true;
    clearReconnect();
    _mtForceResubscribe = null;
    _mtRealtimeStatus = null;
    teardown();
  };
}

// Expuesto para app-main: fuerza resuscripción si el canal se cayó.
function supaResubscribe() {
  if (typeof _mtForceResubscribe === 'function') _mtForceResubscribe();
}
if (typeof window !== 'undefined') window.__mtResubscribe = supaResubscribe;
// Upsert en pin_lookup con onConflict en user_id (UNIQUE), así
// permite cambiar el PIN (PK) sin crear filas duplicadas. Si el
// nuevo PIN ya está tomado por otro usuario, Postgres devuelve
// 23505 que mapeamos a un mensaje claro.
function supaUpdatePinLookup(uid, payload) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('pin_lookup')
    .upsert(
      {
        pin: payload.pin,
        user_email: payload.user_email,
        user_id: uid,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    )
    .then(function (res) {
      if (res && res.error) {
        var c = String(res.error.code || '');
        var m = String(res.error.message || '').toLowerCase();
        // 23505 = unique_violation. Si es la PK pin, el PIN está usado.
        // Esto NO debe reintentarse en la cola (el usuario debe elegir
        // otro), pero la cola lo descartará al recibir success:false con
        // un marcador especial — ver processQueue.
        if (c === '23505' || m.indexOf('duplicate') >= 0) {
          return { success: false, error: res.error, permanent: true };
        }
        return { success: false, error: res.error };
      }
      return { success: true };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}

// ── Propagar cambio de email a pin_lookup + perfiles ─────────────
// auth.users.email es la fuente de verdad pero estas dos tablas
// guardan el email para lookups rápidos. Las actualizamos en
// paralelo; cualquiera puede fallar y reintentarse.
function supaPropagateEmail(uid, payload) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  var ts = new Date().toISOString();
  return Promise.all([
    SUPA.from('pin_lookup')
      .update({ user_email: payload.email, updated_at: ts })
      .eq('user_id', uid),
    SUPA.from('perfiles').update({ email: payload.email, updated_at: ts }).eq('id', uid)
  ])
    .then(function (results) {
      var anyError = results.find(function (r) {
        return r && r.error;
      });
      if (anyError) return { success: false, error: anyError.error };
      return { success: true };
    })
    .catch(function (e) {
      return { success: false, error: e };
    });
}
