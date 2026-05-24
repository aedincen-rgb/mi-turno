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
