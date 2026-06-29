// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/delete-account.js
//  GDPR: eliminación de cuenta + todos los datos (local + nube).
//  Confirmación por escritura ("ELIMINAR") para evitar borrados
//  accidentales. Acción irreversible.
// ════════════════════════════════════════════════════════════════

// Limpia TODO el rastro local del usuario: claves por uid, cachés
// offline por email, sesión, y marcadores de device conocido.
function wipeLocalAccount(uid, email) {
  try {
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k) continue;
      // Cualquier clave que contenga el uid (mt_t_<uid>, mt_pin_<uid>, …)
      if (uid && k.indexOf(uid) !== -1) {
        toRemove.push(k);
        continue;
      }
      // Cachés offline keyed por email en base64
      if (email) {
        try {
          var b64 = btoa(String(email).toLowerCase());
          if (k === 'mt_offline_' + b64 || k === 'mt_pass_' + b64) toRemove.push(k);
        } catch (_) {}
      }
    }
    for (var j = 0; j < toRemove.length; j++) {
      try {
        localStorage.removeItem(toRemove[j]);
      } catch (_) {}
    }
    // Marcadores globales de sesión/device
    ['mt_session', 'mt_sess', 'mt_last_user', 'mt_aviso', 'mt_sync_queue'].forEach(function (k) {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });
  } catch (_) {}
}

function DeleteAccountModal(props) {
  var session = props.session || {};
  var esCloud = !!(session.cloud && !session.guest && !session.pinOnly);

  var ts = useState('');
  var typed = ts[0],
    setTyped = ts[1];
  var ps = useState('idle'); // idle | borrando | error
  var phase = ps[0],
    setPhase = ps[1];
  var er = useState('');
  var errMsg = er[0],
    setErrMsg = er[1];

  var confirmOk = typed.trim().toUpperCase() === 'ELIMINAR';

  function close() {
    if (phase === 'borrando') return;
    try {
      if (typeof haptic === 'function') haptic();
    } catch (_) {}
    if (props.onClose) props.onClose();
  }

  function ejecutar() {
    if (!confirmOk || phase === 'borrando') return;
    try {
      if (typeof haptic === 'function') haptic();
    } catch (_) {}

    // Para cuentas en la nube necesitamos conexión: el borrado GDPR
    // debe llegar al servidor, no podemos solo limpiar local.
    if (esCloud && (typeof isOnline !== 'function' || !isOnline())) {
      setErrMsg('Necesitás conexión a internet para eliminar tu cuenta de forma segura.');
      setPhase('error');
      return;
    }

    setPhase('borrando');
    setErrMsg('');

    var doCloud = esCloud && typeof supaDeleteAccount === 'function';
    var p = doCloud ? supaDeleteAccount() : Promise.resolve({ success: true });

    p.then(function (res) {
      if (doCloud && (!res || !res.success)) {
        setErrMsg('No se pudo eliminar en el servidor. Probá de nuevo en un momento.');
        setPhase('error');
        return;
      }
      // Borrado en la nube ok (o cuenta local): limpiar todo el rastro local.
      wipeLocalAccount(session.uid, session.email);
      // Cerrar sesión de Supabase local (el usuario ya no existe).
      try {
        if (typeof SUPA !== 'undefined' && SUPA && SUPA.auth) {
          SUPA.auth.signOut({ scope: 'local' }).catch(function () {});
        }
      } catch (_) {}
      if (props.onDeleted) props.onDeleted();
      // Recarga limpia a la pantalla de entrada.
      setTimeout(function () {
        try {
          window.location.reload();
        } catch (_) {}
      }, 300);
    }).catch(function () {
      setErrMsg('Ocurrió un error. Probá de nuevo.');
      setPhase('error');
    });
  }

  return h(
    'div',
    {
      className: 'ovl da-ovl',
      onClick: function (e) {
        if (e.target === e.currentTarget) close();
      }
    },
    h(
      'div',
      {
        className: 'da-card',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Eliminar cuenta'
      },
      h('div', { className: 'da-ico', 'aria-hidden': 'true' }, '⚠'),
      h('div', { className: 'da-ttl' }, 'Eliminar mi cuenta'),
      h(
        'div',
        { className: 'da-sub' },
        'Esta acción es ',
        h('b', null, 'permanente'),
        '. Se borrarán tus turnos, salario, PIN y perfil',
        esCloud ? ' de este dispositivo y de la nube.' : ' de este dispositivo.'
      ),
      h(
        'div',
        { className: 'da-warn' },
        'No vas a poder recuperar tus datos. Si querés conservarlos, cancelá y usá ',
        h('b', null, 'Respaldar datos'),
        ' antes.'
      ),
      h(
        'label',
        { className: 'da-field' },
        h('span', { className: 'da-field-lbl' }, 'Escribí ELIMINAR para confirmar'),
        h('input', {
          className: 'da-input inp',
          type: 'text',
          value: typed,
          autoCapitalize: 'characters',
          autoCorrect: 'off',
          spellCheck: false,
          disabled: phase === 'borrando',
          'aria-label': 'Escribí la palabra ELIMINAR para confirmar',
          placeholder: 'ELIMINAR',
          onChange: function (e) {
            setTyped(e.target.value);
          }
        })
      ),
      phase === 'error' ? h('div', { className: 'da-err', role: 'alert' }, errMsg) : null,
      h(
        'div',
        { className: 'da-actions' },
        h(
          'button',
          {
            type: 'button',
            className: 'da-btn da-btn-cancel',
            disabled: phase === 'borrando',
            onClick: close
          },
          'Cancelar'
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'da-btn da-btn-danger',
            disabled: !confirmOk || phase === 'borrando',
            onClick: ejecutar
          },
          phase === 'borrando' ? 'Eliminando…' : 'Eliminar cuenta'
        )
      )
    )
  );
}
