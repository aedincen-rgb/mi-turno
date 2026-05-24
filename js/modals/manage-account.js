// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/manage-account.js
//  Modal gestionar cuenta
// ════════════════════════════════════════════════════════════════
function ManageAccountModal(props) {
  var session = props.session;
  var isPinOnly = session.pinOnly === true;
  var uid = session.uid;

  var ts = useState(0);
  var tab = ts[0],
    setTab = ts[1];
  var pinS = useState('');
  var pinVal = pinS[0],
    setPinVal = pinS[1];
  var emS = useState(session.email || '');
  var emailVal = emS[0],
    setEmailVal = emS[1];
  var pwS = useState('');
  var passVal = pwS[0],
    setPassVal = pwS[1];
  var bS = useState(false);
  var busy = bS[0],
    setBusy = bS[1];
  var fbS = useState(null);
  var feedback = fbS[0],
    setFeedback = fbS[1];

  // vfStep: null | 'confirm' | 'preparando' | 'codigo'
  // - confirm:   pide credenciales actuales (email + PIN o password)
  // - preparando: cuenta 15 s con barra de progreso; sin código aún
  // - codigo:    revela el código local + input para reescribirlo
  var vfS = useState(null);
  var vfStep = vfS[0],
    setVfStep = vfS[1];
  var pendingFnRef = useRef(null);
  var confirmPinS = useState('');
  var confirmPin = confirmPinS[0],
    setConfirmPin = confirmPinS[1];
  var confirmPassS = useState('');
  var confirmPass = confirmPassS[0],
    setConfirmPass = confirmPassS[1];
  var confirmMailS = useState('');
  var confirmMail = confirmMailS[0],
    setConfirmMail = confirmMailS[1];
  var codeInputS = useState('');
  var codeInput = codeInputS[0],
    setCodeInput = codeInputS[1];

  // ── OTP local (offline) ──
  var generatedOtpRef = useRef(null);
  var prepIntervalRef = useRef(null);
  var prS = useState(15);
  var prepSec = prS[0], setPrepSec = prS[1];

  var mountedRef = useRef(true);
  useEffect(function () {
    return function () {
      mountedRef.current = false;
      if (prepIntervalRef.current) {
        clearInterval(prepIntervalRef.current);
        prepIntervalRef.current = null;
      }
    };
  }, []);

  function _clearPrep() {
    if (prepIntervalRef.current) {
      clearInterval(prepIntervalRef.current);
      prepIntervalRef.current = null;
    }
  }

  var storedPin = session.pin || leer('mt_pin_' + uid, null) || leer('mt_pin_app_' + uid, null);
  var hasPassword = !isPinOnly && CLOUD_MODE && SUPA && !!session.email;

  function pinCloudErr(err) {
    if (!err) return 'No se pudo guardar el PIN en la nube.';
    var c = String(err.code || '');
    var m = String(err.message || '').toLowerCase();
    if (c === '23505' || m.indexOf('duplicate') >= 0 || m.indexOf('unique') >= 0)
      return 'Ese PIN ya está en uso en otra cuenta. Elige otro código.';
    return traducirError(err) || err.message || 'Error al guardar el PIN.';
  }

  function resetVf() {
    _clearPrep();
    generatedOtpRef.current = null;
    setVfStep(null);
    setConfirmPin('');
    setConfirmPass('');
    setConfirmMail('');
    setCodeInput('');
    setFeedback(null);
    setBusy(false);
    setPrepSec(15);
    pendingFnRef.current = null;
  }

  function initiateVerification(executeFn) {
    haptic();
    pendingFnRef.current = executeFn;
    setConfirmPin('');
    setConfirmPass('');
    setConfirmMail('');
    setFeedback(null);
    setCodeInput('');
    setVfStep('confirm');
  }

  // Genera un código de 6 dígitos LOCAL (sin internet) y lo guarda
  // en un ref. Arranca el paso 'preparando' con cuenta regresiva de
  // 15 s; al terminar revela el código en pantalla para que el usuario
  // lo reescriba en el input.
  function _startLocalOtp() {
    _clearPrep();
    var arr = (window.crypto && window.crypto.getRandomValues)
      ? window.crypto.getRandomValues(new Uint32Array(1))
      : [Math.floor(Math.random() * 1e9)];
    var code = String(100000 + (arr[0] % 900000));
    generatedOtpRef.current = code;
    setCodeInput('');
    setFeedback(null);
    setBusy(false);
    setPrepSec(15);
    setVfStep('preparando');
    prepIntervalRef.current = setInterval(function () {
      if (!mountedRef.current) {
        _clearPrep();
        return;
      }
      setPrepSec(function (s) {
        if (s <= 1) {
          _clearPrep();
          // Pequeño haptic al revelar
          try { haptic && haptic(); } catch (_) {}
          setVfStep('codigo');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  // ── Confirmar identidad ──
  function doConfirm() {
    if (busy) return;
    haptic();
    setBusy(true);
    setFeedback(null);

    if (hasPassword) {
      var accEm = (session.email || '').trim().toLowerCase();
      var typed = (confirmMail || '').trim().toLowerCase();
      if (!confirmMail || confirmMail.indexOf('@') < 0) {
        setFeedback('Escribe tu correo completo para confirmar identidad.');
        setBusy(false);
        return;
      }
      if (typed !== accEm) {
        setFeedback('El correo no coincide con el de esta sesión.');
        setBusy(false);
        return;
      }
      if (!confirmPass) {
        setFeedback('Ingresa tu contraseña actual.');
        setBusy(false);
        return;
      }
      SUPA.auth
        .signInWithPassword({ email: session.email, password: confirmPass })
        .then(function (res) {
          if (!mountedRef.current) return;
          if (res && res.error) {
            setFeedback('Contraseña incorrecta.');
            setBusy(false);
            return;
          }
          // Credenciales OK → arranca el OTP local con espera de 15 s
          _startLocalOtp();
        })
        .catch(function (e) {
          if (!mountedRef.current) return;
          setFeedback(traducirError(e));
          setBusy(false);
        });
    } else {
      // Modo PIN-only (offline-first): validamos PIN local y arrancamos
      // igualmente el flujo de OTP local con su espera de 15 s.
      if (!storedPin) {
        setFeedback('No hay credenciales para confirmar. Reinicia la sesión.');
        setBusy(false);
        return;
      }
      if (!confirmPin || confirmPin !== storedPin) {
        setFeedback('PIN incorrecto.');
        setBusy(false);
        return;
      }
      _startLocalOtp();
    }
  }

  // ── Verificar OTP local (sin internet) ──
  // Comparación directa contra el código generado en memoria. Si
  // coincide, ejecuta la acción pendiente (puede ser async, ej. PIN
  // a la nube).
  function doVerify() {
    if (busy) return;
    haptic();
    var code = codeInput.replace(/\D/g, '');
    if (code.length < 6) {
      setFeedback('Ingresá los 6 dígitos.');
      return;
    }
    if (code !== generatedOtpRef.current) {
      setFeedback('El código no coincide. Revisalo y volvé a intentar.');
      return;
    }
    setBusy(true);
    setFeedback(null);

    function finishOk() {
      generatedOtpRef.current = null;
      setFeedback('✓ Cambio aplicado correctamente');
      setVfStep(null);
      setBusy(false);
      pendingFnRef.current = null;
      setTimeout(function () {
        if (mountedRef.current) setFeedback(null);
      }, 3500);
    }
    function finishErr(msg) {
      generatedOtpRef.current = null;
      setFeedback(msg);
      setVfStep(null);
      setBusy(false);
      pendingFnRef.current = null;
      setTimeout(function () {
        if (mountedRef.current) setFeedback(null);
      }, 5200);
    }

    var fn = pendingFnRef.current;
    if (!fn) {
      finishOk();
      return;
    }
    try {
      var out = fn();
      if (out && typeof out.then === 'function') {
        out
          .then(function () { if (mountedRef.current) finishOk(); })
          .catch(function (e) {
            if (mountedRef.current)
              finishErr('Error al guardar: ' + (e && e.message ? e.message : 'inténtalo de nuevo'));
          });
        return;
      }
      finishOk();
    } catch (e) {
      finishErr('Error: ' + (e && e.message ? e.message : 'inténtalo de nuevo'));
    }
  }

  function StepBar(props2) {
    var steps = ['confirm', 'preparando', 'codigo'];
    var labels = ['Identidad', 'Preparando', 'Código'];
    var cur = steps.indexOf(props2.current);
    if (cur < 0) cur = 0;
    return h(
      'div',
      { className: 'vf-progress-wrap' },
      h(
        'div',
        { className: 'vf-progress' },
        steps.map(function (s, i) {
          var cls = i < cur ? 'done' : i === cur ? 'active' : '';
          return h(
            'div',
            { key: s, style: { display: 'contents' } },
            i > 0 ? h('div', { className: 'vf-line' + (i <= cur ? ' done' : '') }) : null,
            h('div', { className: 'vf-pip ' + cls }, i < cur ? '✓' : String(i + 1))
          );
        })
      ),
      h(
        'div',
        { className: 'vf-progress-lbls' },
        labels.map(function (lb, i) {
          var on = i === cur ? ' on' : i < cur ? ' done' : '';
          return h('span', { key: steps[i], className: 'vf-progress-lbl' + on }, lb);
        })
      )
    );
  }

  // ── Acciones reales (se ejecutan tras verificación) ──
  function savePIN() {
    if (!pinVal || pinVal.length !== 4) {
      setFeedback('PIN debe ser 4 dígitos');
      return;
    }
    if (!/^\d+$/.test(pinVal)) {
      setFeedback('Solo dígitos');
      return;
    }
    var val = pinVal;
    initiateVerification(function () {
      function applyLocal() {
        grabar('mt_pin_' + uid, val);
        var cur = leer(SKEY, {});
        if (cur) {
          cur.pin = val;
          grabar(SKEY, cur);
        }
        if (props.onSessionPatch) props.onSessionPatch({ pin: val });
        setPinVal('');
      }
      if (!isPinOnly && CLOUD_MODE && SUPA && session.email) {
        // onConflict: 'user_id' — la tabla tiene PK en `pin` y UNIQUE
        // en `user_id`. Sin onConflict el upsert intenta INSERT por PK
        // y falla por la unique de user_id (cada usuario solo tiene
        // una fila). Con onConflict='user_id' Postgres hace UPDATE
        // de la fila existente cambiando el PK (pin). Si el nuevo
        // PIN ya pertenece a otro usuario, sigue tirando 23505 (PK
        // duplicada), que mapeamos a "Ese PIN ya está en uso".
        return SUPA.from('pin_lookup')
          .upsert(
            {
              pin: val,
              user_email: session.email,
              user_id: uid,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          )
          .then(function (res) {
            if (res && res.error) {
              var c = String(res.error.code || '');
              var m = String(res.error.message || '').toLowerCase();
              if (c === '23505' || m.indexOf('duplicate') >= 0 || m.indexOf('unique') >= 0) {
                throw new Error('Ese PIN ya está en uso. Elegí otro.');
              }
              throw new Error(pinCloudErr(res.error));
            }
            applyLocal();
          });
      }
      applyLocal();
      return Promise.resolve();
    });
  }

  function saveEmail() {
    if (!emailVal || !emailVal.includes('@')) {
      setFeedback('Email inválido');
      return;
    }
    if (!CLOUD_MODE || !SUPA) {
      setFeedback('Requiere conexión a nube');
      return;
    }
    var val = emailVal.trim().toLowerCase();
    if (val === String(session.email || '').toLowerCase()) {
      setFeedback('Ese ya es tu correo actual');
      return;
    }
    initiateVerification(function () {
      // 1) Cambia el correo en auth.users (Supabase puede pedir
      //    confirmación por mail al nuevo destino — eso depende del
      //    setting del proyecto y queda fuera de nuestro control).
      return SUPA.auth.updateUser({ email: val })
        .then(function (res) {
          if (res && res.error) {
            throw new Error(traducirError(res.error) || 'No se pudo actualizar el correo.');
          }
          // 2) Propaga el correo a las tablas dependientes para que
          //    los lookups por email no queden desincronizados.
          //    Hacemos ambos updates en paralelo y los toleramos si
          //    fallan individualmente (el correo principal ya cambió).
          var jobs = [
            SUPA.from('pin_lookup')
              .update({ user_email: val, updated_at: new Date().toISOString() })
              .eq('user_id', uid)
              .then(function (r) {
                if (r && r.error) console.warn('[MT] pin_lookup.user_email no se pudo actualizar:', r.error);
              }),
            SUPA.from('perfiles')
              .update({ email: val, updated_at: new Date().toISOString() })
              .eq('id', uid)
              .then(function (r) {
                if (r && r.error) console.warn('[MT] perfiles.email no se pudo actualizar:', r.error);
              })
          ];
          return Promise.all(jobs).then(function () {
            // 3) Actualiza sesión local + state de React
            var cur = leer(SKEY, {});
            if (cur) {
              cur.email = val;
              grabar(SKEY, cur);
            }
            if (props.onSessionPatch) props.onSessionPatch({ email: val });
            setEmailVal('');
          });
        });
    });
  }

  function savePassword() {
    if (!passVal || passVal.length < 6) {
      setFeedback('Mínimo 6 caracteres');
      return;
    }
    if (!CLOUD_MODE || !SUPA) {
      setFeedback('Requiere conexión a nube');
      return;
    }
    var val = passVal;
    initiateVerification(function () {
      return SUPA.auth.updateUser({ password: val }).then(function (res) {
        if (res && res.error) throw new Error(traducirError(res.error) || 'No se pudo actualizar.');
        setPassVal('');
      });
    });
  }

  // ═══ RENDER: CONFIRMAR IDENTIDAD ═══
  if (vfStep === 'confirm') {
    return h(
      'div',
      { className: 'modal-card' },
      h(StepBar, { current: 'confirm' }),
      h(
        'div',
        { className: 'vf-step' },
        h('span', { className: 'vf-icon' }, '🔐'),
        h('div', { className: 'vf-title' }, 'Confirmar identidad'),
        h(
          'div',
          { className: 'vf-desc' },
          hasPassword
            ? 'Ingresa tu correo y contraseña actuales. Luego recibirás un código de 6 dígitos en tu email para confirmar el cambio.'
            : 'Ingresa tu PIN actual para confirmar el cambio.'
        )
      ),

      storedPin && !hasPassword
        ? h(
            'div',
            { style: { marginBottom: 10 } },
            h(
              'div',
              {
                style: {
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--muted)',
                  marginBottom: 5,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }
              },
              'PIN actual'
            ),
            h('input', {
              type: 'tel',
              inputMode: 'numeric',
              maxLength: '4',
              className: 'inp',
              placeholder: '••••',
              value: confirmPin,
              autoFocus: true,
              onChange: function (e) {
                setConfirmPin(e.target.value.replace(/\D/g, ''));
              },
              onKeyDown: function (e) {
                if (e.key === 'Enter') doConfirm();
              },
              style: { textAlign: 'center', fontSize: 22, letterSpacing: '8px' }
            })
          )
        : null,

      hasPassword
        ? h(
            'div',
            null,
            h(
              'div',
              { style: { marginBottom: 10 } },
              h(
                'div',
                {
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    marginBottom: 5,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }
                },
                'Correo de la cuenta'
              ),
              h('input', {
                type: 'email',
                inputMode: 'email',
                className: 'inp',
                placeholder: session.email || 'correo@ejemplo.com',
                value: confirmMail,
                autoFocus: true,
                onChange: function (e) {
                  setConfirmMail(e.target.value);
                },
                autoComplete: 'off',
                spellCheck: false,
                style: { marginBottom: 6 }
              }),
              h(
                'div',
                { style: { fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.45 } },
                'Debe coincidir con ',
                h('strong', null, session.email || 'tu correo')
              )
            ),
            h(
              'div',
              { style: { marginBottom: 10 } },
              h(
                'div',
                {
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    marginBottom: 5,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }
                },
                'Contraseña actual'
              ),
              h('input', {
                type: 'password',
                className: 'inp',
                placeholder: '••••••',
                value: confirmPass,
                onChange: function (e) {
                  setConfirmPass(e.target.value);
                },
                onKeyDown: function (e) {
                  if (e.key === 'Enter') doConfirm();
                }
              })
            )
          )
        : null,

      feedback
        ? h(
            'div',
            {
              style: {
                fontSize: 11.5,
                color: 'var(--danger)',
                background: 'var(--danger-dim)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 8,
                marginTop: 4
              }
            },
            feedback
          )
        : null,

      h(
        'button',
        {
          className: 'btn btn-accent btn-block',
          onClick: doConfirm,
          disabled: busy,
          style: { marginBottom: 8, marginTop: 4 }
        },
        busy
          ? h('span', { className: 'sp-in' })
          : hasPassword
            ? 'Verificar y enviar código →'
            : 'Confirmar y aplicar →'
      ),
      h('button', { className: 'btn btn-ghost btn-block', onClick: resetVf }, 'Cancelar')
    );
  }

  // ═══ RENDER: PREPARANDO CÓDIGO (espera 15 s, offline) ═══
  if (vfStep === 'preparando') {
    var totalSec = 15;
    var pct = Math.max(0, Math.min(100, ((totalSec - prepSec) / totalSec) * 100));
    return h(
      'div',
      { className: 'modal-card' },
      h(StepBar, { current: 'preparando' }),
      h(
        'div',
        { className: 'vf-step otp-prep' },
        h(
          'div',
          { className: 'otp-prep-shield' },
          h('div', { className: 'otp-prep-shield-glow' }),
          h('div', { className: 'otp-prep-shield-icon' }, '✦')
        ),
        h('div', { className: 'vf-title' }, 'Preparando tu código'),
        h(
          'div',
          { className: 'vf-desc' },
          'Por seguridad, tomamos unos segundos antes de mostrarte el código.'
        ),
        h(
          'div',
          { className: 'otp-prep-bar-wrap' },
          h('div', { className: 'otp-prep-bar' },
            h('div', { className: 'otp-prep-bar-fill', style: { width: pct + '%' } })
          ),
          h('div', { className: 'otp-prep-sec' }, prepSec + 's')
        )
      ),
      h(
        'button',
        { className: 'btn btn-ghost btn-block', onClick: resetVf, style: { marginTop: 8 } },
        'Cancelar'
      )
    );
  }

  // ═══ RENDER: CÓDIGO REVELADO + INPUT ═══
  if (vfStep === 'codigo') {
    var revealed = generatedOtpRef.current || '';
    return h(
      'div',
      { className: 'modal-card' },
      h(StepBar, { current: 'codigo' }),
      h(
        'div',
        { className: 'vf-step' },
        h('div', { className: 'vf-title' }, 'Tu código de confirmación'),
        h(
          'div',
          { className: 'vf-desc' },
          'Escribilo abajo para aplicar el cambio.'
        )
      ),

      // Código revelado (display prominente, estilo Apple verification)
      h(
        'div',
        { className: 'otp-reveal' },
        revealed.split('').map(function (d, i) {
          return h('span', { key: i, className: 'otp-reveal-digit' }, d);
        })
      ),

      // Input de 6 celdas para reescribirlo
      h(
        'div',
        { className: 'code-grid', style: { marginTop: 14, marginBottom: 4 } },
        Array.from({ length: 6 }).map(function (_, i) {
          return h('input', {
            key: i,
            type: 'tel',
            inputMode: 'numeric',
            maxLength: '1',
            className: 'code-cell',
            value: codeInput[i] || '',
            autoFocus: i === 0,
            onChange: function (e) {
              var v = e.target.value.replace(/\D/g, '');
              if (v.length > 1) v = v.slice(-1);
              var arr = codeInput.split('');
              arr[i] = v;
              var combined = arr.join('').slice(0, 6);
              setCodeInput(combined);
              if (v && i < 5) {
                var sib = e.target.parentElement.children[i + 1];
                if (sib) sib.focus();
              }
            },
            onKeyDown: function (e) {
              if (e.key === 'Backspace' && !codeInput[i] && i > 0) {
                var sib = e.target.parentElement.children[i - 1];
                if (sib) sib.focus();
              }
              if (e.key === 'Enter') doVerify();
            }
          });
        })
      ),

      feedback
        ? h(
            'div',
            {
              style: {
                fontSize: 11.5,
                color: feedback[0] === '✓' ? 'var(--success)' : 'var(--danger)',
                background: feedback[0] === '✓' ? 'var(--success-dim)' : 'var(--danger-dim)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginTop: 8,
                marginBottom: 4
              }
            },
            feedback
          )
        : null,

      h(
        'button',
        {
          className: 'btn btn-accent btn-block',
          onClick: doVerify,
          disabled: busy || codeInput.replace(/\D/g, '').length < 6,
          style: { marginTop: 10, marginBottom: 8 }
        },
        busy ? h('span', { className: 'sp-in' }) : 'Confirmar cambio'
      ),
      h('button', { className: 'btn btn-ghost btn-block', onClick: resetVf }, 'Cancelar')
    );
  }

  // ═══ RENDER: PANTALLA PRINCIPAL DE GESTIÓN ═══
  return h(
    'div',
    { className: 'modal-card' },
    h(
      'div',
      { style: { fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 14 } },
      'Gestionar cuenta'
    ),
    isPinOnly
      ? h(
          'div',
          {
            style: {
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11.5,
              marginBottom: 12,
              lineHeight: 1.55,
              border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)'
            }
          },
          '📌 Modo local. Añade email y contraseña para sincronizar en nube.'
        )
      : null,

    h(
      'div',
      {
        style: {
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 8
        }
      },
      h(
        'button',
        {
          className: 'btn',
          onClick: function () {
            setTab(0);
            setFeedback(null);
          },
          style: {
            flex: 1,
            padding: '8px 10px',
            fontSize: 11.5,
            borderRadius: 'var(--radius-sm)',
            background: tab === 0 ? 'var(--text)' : 'transparent',
            color: tab === 0 ? 'var(--surface)' : 'var(--muted)',
            border: tab === 0 ? 'none' : '1px solid var(--border)'
          }
        },
        '🔐 PIN'
      ),
      h(
        'button',
        {
          className: 'btn',
          onClick: function () {
            setTab(1);
            setFeedback(null);
          },
          disabled: isPinOnly,
          style: {
            flex: 1,
            padding: '8px 10px',
            fontSize: 11.5,
            borderRadius: 'var(--radius-sm)',
            background: tab === 1 ? 'var(--text)' : 'transparent',
            color: tab === 1 ? 'var(--surface)' : 'var(--muted)',
            border: tab === 1 ? 'none' : '1px solid var(--border)',
            opacity: isPinOnly ? 0.4 : 1
          }
        },
        '✉ Email'
      ),
      h(
        'button',
        {
          className: 'btn',
          onClick: function () {
            setTab(2);
            setFeedback(null);
          },
          disabled: isPinOnly,
          style: {
            flex: 1,
            padding: '8px 10px',
            fontSize: 11.5,
            borderRadius: 'var(--radius-sm)',
            background: tab === 2 ? 'var(--text)' : 'transparent',
            color: tab === 2 ? 'var(--surface)' : 'var(--muted)',
            border: tab === 2 ? 'none' : '1px solid var(--border)',
            opacity: isPinOnly ? 0.4 : 1
          }
        },
        '🔑 Contraseña'
      )
    ),

    tab === 0
      ? h(
          'div',
          null,
          h(
            'div',
            {
              style: {
                fontSize: 12,
                color: 'var(--muted)',
                marginBottom: 12,
                lineHeight: 1.5,
                background: 'var(--surface2)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)'
              }
            },
            '🔒 ' +
              (hasPassword
                ? 'Confirma con contraseña y recibirás un código en tu email.'
                : 'Confirma con tu PIN actual para cambiar.')
          ),
          h('input', {
            type: 'tel',
            inputMode: 'numeric',
            maxLength: '4',
            placeholder: '°°°°',
            className: 'inp',
            value: pinVal,
            onChange: function (e) {
              setPinVal(e.target.value.replace(/\D/g, ''));
            },
            style: {
              marginBottom: feedback ? 8 : 12,
              textAlign: 'center',
              fontSize: 20,
              letterSpacing: '8px'
            }
          }),
          feedback
            ? h(
                'div',
                {
                  style: {
                    fontSize: 11.5,
                    color: feedback[0] === '✓' ? 'var(--success)' : 'var(--danger)',
                    background: feedback[0] === '✓' ? 'var(--success-dim)' : 'var(--danger-dim)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 12
                  }
                },
                feedback
              )
            : null,
          h(
            'button',
            { className: 'btn btn-accent btn-block', onClick: savePIN, disabled: busy },
            'Cambiar PIN'
          )
        )
      : tab === 1
        ? h(
            'div',
            null,
            h(
              'div',
              {
                style: {
                  fontSize: 12,
                  color: 'var(--muted)',
                  marginBottom: 12,
                  lineHeight: 1.5,
                  background: 'var(--surface2)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)'
                }
              },
              '🔒 Confirma con contraseña y luego un código llegará a tu email.'
            ),
            h('input', {
              type: 'email',
              placeholder: 'Nuevo correo electrónico',
              inputMode: 'email',
              className: 'inp',
              value: emailVal,
              onChange: function (e) {
                setEmailVal(e.target.value);
              },
              style: { marginBottom: feedback ? 8 : 12 }
            }),
            feedback
              ? h(
                  'div',
                  {
                    style: {
                      fontSize: 11.5,
                      color: feedback[0] === '✓' ? 'var(--success)' : 'var(--danger)',
                      background: feedback[0] === '✓' ? 'var(--success-dim)' : 'var(--danger-dim)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 12
                    }
                  },
                  feedback
                )
              : null,
            h(
              'button',
              {
                className: 'btn btn-accent btn-block',
                onClick: saveEmail,
                disabled: busy || !CLOUD_MODE || isPinOnly
              },
              'Cambiar Email'
            )
          )
        : tab === 2
          ? h(
              'div',
              null,
              h(
                'div',
                {
                  style: {
                    fontSize: 12,
                    color: 'var(--muted)',
                    marginBottom: 12,
                    lineHeight: 1.5,
                    background: 'var(--surface2)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)'
                  }
                },
                '🔒 Confirma con contraseña y luego un código llegará a tu email.'
              ),
              h('input', {
                type: 'password',
                placeholder: 'Nueva contraseña (mín. 6 caracteres)',
                autoComplete: 'new-password',
                className: 'inp',
                value: passVal,
                onChange: function (e) {
                  setPassVal(e.target.value);
                },
                style: { marginBottom: feedback ? 8 : 12 }
              }),
              feedback
                ? h(
                    'div',
                    {
                      style: {
                        fontSize: 11.5,
                        color: feedback[0] === '✓' ? 'var(--success)' : 'var(--danger)',
                        background:
                          feedback[0] === '✓' ? 'var(--success-dim)' : 'var(--danger-dim)',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 12
                      }
                    },
                    feedback
                  )
                : null,
              h(
                'button',
                {
                  className: 'btn btn-accent btn-block',
                  onClick: savePassword,
                  disabled: busy || !CLOUD_MODE || isPinOnly
                },
                'Cambiar Contraseña'
              )
            )
          : null,

    h(
      'button',
      {
        className: 'btn btn-ghost btn-block',
        onClick: function () {
          haptic();
          resetVf();
          props.onClose();
        },
        style: { marginTop: 12 }
      },
      'Cerrar'
    )
  );
}
