// ════════════════════════════════════════════════════════════════
//  MI TURNO · services/clerk-init.js
//  Inicialización de Clerk como proveedor de autenticación.
//
//  PARA ACTIVAR:
//  1. Creá tu aplicación en https://dashboard.clerk.com
//  2. Copiá la "Publishable key" (empieza con pk_test_ o pk_live_)
//  3. Reemplazá el string 'CLERK_PUBLISHABLE_KEY' en la línea marcada ↓
//  4. Bumpeá la versión: scripts/bump.sh NN "Clerk auth activo"
// ════════════════════════════════════════════════════════════════

(function initClerk() {
  // ── Clave pública de Clerk ────────────────────────────────────
  // REEMPLAZÁ ESTE VALOR con tu Publishable Key real.
  // No uses la Secret Key acá — esta clave es pública y va al cliente.
  var CLERK_PK = 'pk_test_aW50ZW5zZS1jcmlja2V0LTguY2xlcmsuYWNjb3VudHMuZGV2JA';

  // ── Estado global ─────────────────────────────────────────────
  // Expone CLERK_MODE (análogo a CLOUD_MODE) y CLERK_ERROR para
  // que el resto de la app sepa si Clerk está operativo.
  window.CLERK_MODE  = false;
  window.CLERK_ERROR = null;

  // Promise que resuelve true cuando Clerk está listo y hay sesión,
  // false si no hay sesión activa, o rechaza si el SDK no cargó.
  // Análogo a window.__cloudReady de supabase-init.js.
  window.__clerkReady = new Promise(function (resolve) {
    // Si la key no fue reemplazada, no intentar nada.
    if (!CLERK_PK || CLERK_PK === 'CLERK_PUBLISHABLE_KEY') {
      window.CLERK_ERROR = 'Publishable Key no configurada';
      console.warn('[MT Clerk] Clave no configurada — modo local activado');
      resolve(false);
      return;
    }

    // Si el SDK de Clerk no cargó (error de red, SRI mismatch, etc.)
    if (!window.Clerk) {
      window.CLERK_ERROR = 'SDK de Clerk no disponible';
      console.warn('[MT Clerk] window.Clerk no encontrado — SDK no cargó');
      resolve(false);
      return;
    }

    // Cargar e inicializar Clerk con la Publishable Key.
    // window.Clerk es la instancia del SDK browser (@clerk/clerk-js).
    window.Clerk.load({ publishableKey: CLERK_PK })
      .then(function () {
        window.CLERK_MODE = true;
        console.log('[MT Clerk] SDK inicializado');

        // Si ya hay sesión activa (usuario venía logueado), sincronizar.
        var user = window.Clerk.user;
        if (user) {
          _clerkSyncSession(user);
          resolve(true);
        } else {
          resolve(false);
        }

        // Escuchar cambios de sesión (login, logout, cambio de cuenta).
        window.Clerk.addListener(function (resources) {
          var u = resources.user;
          if (u) {
            _clerkSyncSession(u);
          } else {
            // Usuario cerró sesión — limpiar sesión local.
            _clerkClearSession();
          }
        });
      })
      .catch(function (e) {
        window.CLERK_ERROR = (e && e.message) ? e.message : String(e);
        window.CLERK_MODE  = false;
        console.error('[MT Clerk] Error al cargar SDK:', e);
        resolve(false);
      });
  });

  // ── _clerkSyncSession ─────────────────────────────────────────
  // Sincroniza el usuario de Clerk con:
  //   1. window._mtSession (sesión en memoria usada por toda la app)
  //   2. localStorage mt_sess (persistencia)
  //   3. public.perfiles en Supabase (upsert por user_id de Clerk)
  //
  // IMPORTANTE: el uid que se usa como PK en todas las tablas de
  // Supabase (turnos, turno_activo, perfiles, pin_lookup) pasa a
  // ser el user.id de Clerk — un string tipo "user_2abc123".
  // Los UIDs de Supabase Auth (UUID v4) ya no se usan para auth;
  // los registros existentes que tenían UUID de Supabase Auth
  // deben migrarse manualmente si se necesita preservarlos.
  function _clerkSyncSession(clerkUser) {
    if (!clerkUser) return;

    // Extraer email primario del objeto de Clerk.
    // clerkUser.primaryEmailAddress es un objeto EmailAddress, no string.
    var primaryEmail = clerkUser.primaryEmailAddress;
    var emailStr = '';
    if (primaryEmail && primaryEmail.emailAddress) {
      emailStr = primaryEmail.emailAddress;
    } else if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
      var firstEmail = clerkUser.emailAddresses[0];
      emailStr = (firstEmail && firstEmail.emailAddress) ? firstEmail.emailAddress : '';
    }

    var ses = {
      uid:     clerkUser.id,
      email:   emailStr,
      cloud:   true,
      guest:   false,
      isAdmin: false
    };

    // Persistir sesión y marcar device conocido.
    grabar(SKEY, ses);
    try {
      grabar('mt_last_user', { uid: ses.uid, email: ses.email });
    } catch (_) {}

    // Exponer en window._mtSession para compatibilidad con módulos
    // que leen la sesión directamente (p. ej. tabs, IA, sync-queue).
    window._mtSession = ses;

    // Sincronizar perfil en Supabase (upsert).
    // Esto garantiza que la fila en public.perfiles existe para el uid
    // de Clerk antes de que cualquier dato de turno se intente guardar.
    _clerkUpsertPerfil(ses.uid, ses.email);
  }

  // ── _clerkClearSession ────────────────────────────────────────
  // Limpia la sesión local cuando Clerk dispara un evento de logout.
  function _clerkClearSession() {
    window._mtSession = null;
    try {
      grabar(SKEY, null);
    } catch (_) {}
  }

  // ── _clerkUpsertPerfil ────────────────────────────────────────
  // Hace upsert en public.perfiles usando el uid de Clerk como PK.
  // No sobreescribe salario_base si ya existe — solo asegura la fila.
  function _clerkUpsertPerfil(uid, email) {
    // SUPA puede ser null si Supabase no está configurado o no hay red.
    // En ese caso lo ignoramos — la app funciona offline igual.
    if (!uid) return;
    if (typeof SUPA === 'undefined' || !SUPA) return;

    SUPA.from('perfiles')
      .upsert(
        {
          id:         uid,
          email:      email,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      .then(function (res) {
        if (res && res.error) {
          console.warn('[MT Clerk] upsert perfiles error:', res.error.message || res.error);
        }
      })
      .catch(function (e) {
        console.warn('[MT Clerk] upsert perfiles falló (no crítico):', e);
      });
  }

  // ── clerkReady ────────────────────────────────────────────────
  // Helper público para esperar a que Clerk esté listo.
  // Uso: clerkReady().then(function(ok) { ... })
  window.clerkReady = function () {
    return window.__clerkReady || Promise.resolve(false);
  };

  // ── clerkSignOut ──────────────────────────────────────────────
  // Cierre de sesión delegado a Clerk.
  // Lo usa root.js en su función signOut() cuando CLERK_MODE=true.
  window.clerkSignOut = function () {
    if (!window.Clerk || !window.CLERK_MODE) return Promise.resolve();
    return window.Clerk.signOut().catch(function (e) {
      console.warn('[MT Clerk] signOut error:', e);
    });
  };

  // ── clerkGetUser ──────────────────────────────────────────────
  // Devuelve el usuario actual de Clerk (o null si no hay sesión).
  window.clerkGetUser = function () {
    if (!window.Clerk) return null;
    return window.Clerk.user || null;
  };
})();
