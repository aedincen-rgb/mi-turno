// ════════════════════════════════════════════════════════════════
//  MI TURNO · utils/validation.js
//  Validación de datos almacenados
// ════════════════════════════════════════════════════════════════
function validarTurnoActivo(activo, uid){
  if(!activo||typeof activo!=='object'||!activo.inicio) return null;
  if(isNaN(new Date(activo.inicio).getTime())) return null;
  if(activo.userId && activo.userId!==uid) return null;
  return activo;
}

function validarTurnos(turnos, uid){
  if(!Array.isArray(turnos)) return [];
  return turnos.filter(function(t){
    if(!t||typeof t!=='object'||!t.inicio||!t.fin) return false;
    if(isNaN(new Date(t.inicio).getTime())||isNaN(new Date(t.fin).getTime())) return false;
    if(t.userId && t.userId!==uid) return false;
    return true;
  });
}

/**
 * Valida la estructura de la sesión recuperada de storage o nube
 * @param {Object} s - Objeto de sesión
 */
function validarSesion(s) {
  console.log("[DIAG] Validando sesión:", s);
  
  if (!s || typeof s !== 'object') {
    console.warn("[DIAG] Sesión nula o tipo incorrecto");
    return null;
  }

  if (!s.uid) {
    console.error("[DIAG] Sesión inválida: falta UID");
    return null;
  }

  return {
    uid: s.uid,
    email: s.email || 'invitado@local',
    guest: !!s.guest,
    cloud: !!s.cloud,
    isAdmin: !!s.isAdmin,
    pin: s.pin || null
  };
}
