// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/session-sync.js
//  Sincronización de cierre de sesión entre dispositivos
// ════════════════════════════════════════════════════════════════
//
//  Al cerrar sesión en modo global, Supabase revoca los refresh tokens,
//  pero el JWT de acceso de los demás dispositivos sigue siendo válido
//  hasta que caduca (≈1 h). Por eso un dispositivo "no se entera" de
//  inmediato cuando se cierra sesión en otro.
//
//  Este módulo verifica activamente el refresh token contra el servidor.
//  Si fue revocado en otro dispositivo la verificación falla con un
//  error de autenticación y avisamos para cerrar sesión también aquí.
//
//  La verificación se dispara:
//    · al volver la app a primer plano  (visibilitychange → visible)
//    · al recuperar conexión            (online)
//    · de forma periódica con la app visible
//
//  NUNCA cierra sesión por errores de red: el modo offline queda intacto.

(function () {
  var INTERVALO = 120000; // verificación periódica con la app visible (2 min)
  var ANTIREBOTE = 12000; // separación mínima entre verificaciones

  var _ultimaVerif = 0;
  var _verificando = false;
  var _intervalId = null;
  var _activo = false;
  var _alCerrarRemoto = null;

  // Un fallo de red NO debe cerrar la sesión: el usuario simplemente
  // está sin internet y debe poder seguir usando la app offline.
  function _esErrorDeRed(error) {
    if (!error) return false;
    var msg = (error.message || error.toString() || '').toLowerCase();
    return (
      msg.indexOf('fetch') >= 0 ||
      msg.indexOf('network') >= 0 ||
      msg.indexOf('load failed') >= 0 ||
      msg.indexOf('tiempo de espera') >= 0 ||
      msg.indexOf('timeout') >= 0
    );
  }

  // El refresh token fue rechazado/revocado: la sesión ya no es válida.
  function _esErrorDeAuth(error) {
    if (!error) return false;
    var status = error.status;
    if (status === 400 || status === 401 || status === 403) return true;
    var msg = (error.message || '').toLowerCase();
    return (
      msg.indexOf('refresh token') >= 0 ||
      msg.indexOf('refresh_token') >= 0 ||
      msg.indexOf('not found') >= 0 ||
      msg.indexOf('already used') >= 0 ||
      msg.indexOf('session missing') >= 0 ||
      msg.indexOf('revoked') >= 0 ||
      msg.indexOf('invalid') >= 0 ||
      msg.indexOf('expired') >= 0
    );
  }

  // Verifica contra el servidor si la sesión sigue viva.
  //   Promise<true>  → sigue válida, o no se pudo determinar (sin red)
  //   Promise<false> → fue cerrada/revocada en otro dispositivo
  function verificarSesion() {
    if (!CLOUD_MODE || !SUPA || !SUPA.auth) return Promise.resolve(true);
    if (!navigator.onLine) return Promise.resolve(true);

    return SUPA.auth
      .getSession()
      .then(function (g) {
        // Sin sesión local de Supabase: no hay nada que verificar aquí.
        if (!g || !g.data || !g.data.session) return true;

        return withTimeout(SUPA.auth.refreshSession(), 10000, 'Verificación de sesión')
          .then(function (res) {
            if (res && res.error) {
              if (_esErrorDeRed(res.error)) return true;
              if (_esErrorDeAuth(res.error)) return false;
              return true; // error ambiguo → conservador, no cerrar
            }
            if (res && res.data && !res.data.session) return false;
            return true;
          })
          .catch(function () {
            // timeout o caída de red → conservador, no cerramos sesión
            return true;
          });
      })
      .catch(function () {
        return true;
      });
  }

  function _verificar(forzar) {
    if (!_activo || _verificando) return;
    var ahora = Date.now();
    if (!forzar && ahora - _ultimaVerif < ANTIREBOTE) return;
    _ultimaVerif = ahora;
    _verificando = true;
    verificarSesion()
      .then(function (viva) {
        _verificando = false;
        if (!viva && _activo) {
          _activo = false; // evita avisos repetidos
          console.warn('[MT] Sesión cerrada desde otro dispositivo. Cerrando aquí.');
          if (_alCerrarRemoto) _alCerrarRemoto();
        }
      })
      .catch(function () {
        _verificando = false;
      });
  }

  function _onVisibilidad() {
    if (document.visibilityState === 'visible') _verificar(false);
  }
  function _onOnline() {
    _verificar(true);
  }

  // Arranca la vigilancia. callback se invoca si se detecta cierre remoto.
  function startSessionSync(callback) {
    _alCerrarRemoto = callback;
    if (_activo) return;
    _activo = true;
    document.addEventListener('visibilitychange', _onVisibilidad, { passive: true });
    window.addEventListener('online', _onOnline);
    _intervalId = setInterval(function () {
      if (document.visibilityState === 'visible') _verificar(false);
    }, INTERVALO);
    _verificar(true); // verificación inicial al entrar
  }

  function stopSessionSync() {
    _activo = false;
    _alCerrarRemoto = null;
    document.removeEventListener('visibilitychange', _onVisibilidad);
    window.removeEventListener('online', _onOnline);
    if (_intervalId) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
  }

  window.startSessionSync = startSessionSync;
  window.stopSessionSync = stopSessionSync;
  window.verificarSesion = verificarSesion;
})();
