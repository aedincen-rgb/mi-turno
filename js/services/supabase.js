// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/supabase.js
//  Helpers CRUD de Supabase
// ════════════════════════════════════════════════════════════════
function supaSyncDown(uid){
  if(!SUPA) return Promise.resolve(null);
  return Promise.all([
    SUPA.from('perfiles').select('salario_base').eq('id',uid).maybeSingle(),
    SUPA.from('turnos').select('id,inicio,fin').eq('user_id',uid).order('inicio',{ascending:false}).limit(500),
    SUPA.from('turno_activo').select('id,inicio').eq('user_id',uid).maybeSingle()
  ]).then(function(results){
    if(results[0].error||results[1].error) return null;
    if(results[2].error && results[2].error.code!=='PGRST116') return null;
    var perfil=results[0].data;
    var turnos=(results[1].data||[]).map(function(t){return {id:t.id,inicio:t.inicio,fin:t.fin,userId:uid};});
    var activoRaw=results[2].data;
    var activo=activoRaw?{id:activoRaw.id,inicio:activoRaw.inicio,userId:uid}:null;
    var salario=perfil&&perfil.salario_base?Number(perfil.salario_base):SMIN;
    return {turnos:turnos, activo:activo, salario:salario};
  }).catch(function(e){console.warn('[Supa] error:',e);return null;});
}

function supaSetActivo(uid, activo){
  if(!SUPA) return Promise.resolve();
  if(!activo) return SUPA.from('turno_activo').delete().eq('user_id',uid).then(function(){}).catch(function(){});
  return SUPA.from('turno_activo').upsert({user_id:uid,id:activo.id,inicio:activo.inicio,updated_at:new Date().toISOString()})
    .then(function(){}).catch(function(){});
}

function supaInsertTurno(uid, turno){
  if(!SUPA) return Promise.resolve();
  return SUPA.from('turnos').insert({id:turno.id,user_id:uid,inicio:turno.inicio,fin:turno.fin})
    .then(function(){}).catch(function(){});
}

function supaDeleteTurno(uid, id){
  if(!SUPA) return Promise.resolve();
  return SUPA.from('turnos').delete().eq('user_id',uid).eq('id',id).then(function(){}).catch(function(){});
}

function supaDeleteAllTurnos(uid){
  if(!SUPA) return Promise.resolve();
  return SUPA.from('turnos').delete().eq('user_id',uid).then(function(){}).catch(function(){});
}

function supaSetSalario(uid, salario){
  if(!SUPA) return Promise.resolve();
  return SUPA.from('perfiles').update({salario_base:salario,updated_at:new Date().toISOString()}).eq('id',uid)
    .then(function(){}).catch(function(){});
}
