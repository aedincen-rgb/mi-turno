// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/supabase.js
//  Helpers CRUD de Supabase
// ════════════════════════════════════════════════════════════════
function supaSyncDown(uid) {
  if (!SUPA) return Promise.resolve(null);
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
      var salario = perfil && perfil.salario_base ? Number(perfil.salario_base) : SMIN;
      return { turnos: turnos, activo: activo, salario: salario };
    })
    .catch(function (e) {
      console.warn('[Supa] error:', e);
      return null;
    });
}

function supaSetActivo(uid, activo) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  if (!activo) {
    return SUPA.from('turno_activo')
      .delete()
      .eq('user_id', uid)
      .then(function (res) { return { success: !res.error, error: res.error }; })
      .catch(function (e) { return { success: false, error: e }; });
  }
  return SUPA.from('turno_activo')
    .upsert({
      user_id: uid,
      id: activo.id,
      inicio: activo.inicio,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' }) // Upsert para manejar si ya existe un activo
    .then(function (res) { return { success: !res.error, error: res.error }; })
    .catch(function (e) { return { success: false, error: e }; });
}

function supaInsertTurno(uid, turno) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('turnos')
    .insert({ id: turno.id, user_id: uid, inicio: turno.inicio, fin: turno.fin })
    .then(function (res) { return { success: !res.error, error: res.error }; })
    .catch(function (e) { return { success: false, error: e }; });
}

function supaDeleteTurno(uid, id) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('turnos')
    .delete()
    .eq('user_id', uid)
    .eq('id', id)
    .then(function (res) { return { success: !res.error, error: res.error }; })
    .catch(function (e) { return { success: false, error: e }; });
}

function supaDeleteAllTurnos(uid) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('turnos')
    .delete()
    .eq('user_id', uid)
    .then(function (res) { return { success: !res.error, error: res.error }; })
    .catch(function (e) { return { success: false, error: e }; });
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
    .then(function (res) { return { success: !res.error, error: res.error }; })
    .catch(function (e) { return { success: false, error: e }; });
}

// Nueva función para upsert de perfil (usada en sync-queue)
function supaUpsertPerfil(uid, data) {
  if (!SUPA) return Promise.resolve({ success: false, error: 'Supabase no inicializado' });
  return SUPA.from('perfiles')
    .upsert({ id: uid, ...data }, { onConflict: 'id' })
    .then(function (res) { return { success: !res.error, error: res.error }; })
    .catch(function (e) { return { success: false, error: e }; });
}

// ── Cambio de PIN (lookup) — usado por sync-queue ────────────────
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
    .catch(function (e) { return { success: false, error: e }; });
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
    SUPA.from('perfiles')
      .update({ email: payload.email, updated_at: ts })
      .eq('id', uid)
  ])
    .then(function (results) {
      var anyError = results.find(function (r) { return r && r.error; });
      if (anyError) return { success: false, error: anyError.error };
      return { success: true };
    })
    .catch(function (e) { return { success: false, error: e }; });
}
