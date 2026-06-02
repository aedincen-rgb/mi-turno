// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/pin-setup.js
//  Modal configurar PIN
// ════════════════════════════════════════════════════════════════
function PinSetup(props) {
  var session = props.session;
  var stS = useState('pin');
  var step = stS[0],
    setStep = stS[1];
  // 'pin' | 'wait' | 'verify' | 'done'
  var pinS = useState(['', '', '', '']);
  var pinCells = pinS[0],
    setPinCells = pinS[1];
  var codeS = useState('');
  var codeInput = codeS[0],
    setCodeInput = codeS[1];
  var bsS = useState(false);
  var busy = bsS[0],
    setBusy = bsS[1];
  var erS = useState(null);
  var err = erS[0],
    setErr = erS[1];
  var nowS = useState(Date.now());
  var nowMs = nowS[0],
    setNowMs = nowS[1];

  var codeRef = useRef(''); // El código generado
  var startTsRef = useRef(0); // Timestamp de inicio del countdown
  var tickRef = useRef(null); // Handle del interval
  var pinRefs = [useRef(), useRef(), useRef(), useRef()];
  var codeRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  var pinVal = pinCells.join('');

  // Cleanup al desmontar
  useEffect(function () {
    return function () {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Countdown robusto basado en Date.now() — sobrevive a pausas del navegador
  function startWait() {
    startTsRef.current = Date.now();
    setNowMs(Date.now());
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(function () {
      setNowMs(Date.now());
    }, 500);
  }

  // Tiempo en segundos desde inicio
  function elapsedSec() {
    if (!startTsRef.current) return 0;
    return Math.floor((nowMs - startTsRef.current) / 1000);
  }

  // Generar código de 6 dígitos
  function genCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // Cuando se cumplen los 15s, generamos el código (si aún no existe)
  useEffect(
    function () {
      if (step === 'wait' && elapsedSec() >= 15 && !codeRef.current) {
        codeRef.current = genCode();
        setStep('verify');
      }
      if (step === 'verify' && elapsedSec() >= 300) {
        // Expirado tras 5 min total
        codeRef.current = '';
        if (tickRef.current) clearInterval(tickRef.current);
      }
    },
    [nowMs, step]
  );

  // ── Inputs PIN ──
  function handlePinCell(e, i) {
    var v = e.target.value.replace(/\D/g, '').slice(-1);
    var next = pinCells.slice();
    next[i] = v;
    setPinCells(next);
    if (v && i < 3 && pinRefs[i + 1].current) pinRefs[i + 1].current.focus();
  }
  function handlePinKey(e, i) {
    if (e.key === 'Backspace' && !pinCells[i] && i > 0) {
      var next = pinCells.slice();
      next[i - 1] = '';
      setPinCells(next);
      if (pinRefs[i - 1].current) pinRefs[i - 1].current.focus();
    }
  }

  // ── Inputs código ──
  function handleCodeCell(e, i) {
    var v = e.target.value.replace(/\D/g, '').slice(-1);
    var arr = codeInput.split('');
    arr[i] = v;
    var combined = arr.join('').slice(0, 6);
    setCodeInput(combined);
    if (v && i < 5 && codeRefs[i + 1].current) codeRefs[i + 1].current.focus();
  }
  function handleCodeKey(e, i) {
    if (e.key === 'Backspace' && !codeInput[i] && i > 0) {
      if (codeRefs[i - 1].current) codeRefs[i - 1].current.focus();
    }
    if (e.key === 'Enter') verificar();
  }

  // ── Paso 1: Validar PIN y arrancar la espera ──
  function continuar() {
    if (busy) return;
    haptic();
    setErr(null);
    if (pinVal.length !== 4) {
      setErr('Ingresa los 4 dígitos del PIN');
      return;
    }
    if (!/^\d{4}$/.test(pinVal)) {
      setErr('Solo dígitos numéricos');
      return;
    }
    if (
      [
        '0000',
        '1111',
        '2222',
        '3333',
        '4444',
        '5555',
        '6666',
        '7777',
        '8888',
        '9999',
        '1234',
        '4321',
        '0123'
      ].indexOf(pinVal) >= 0
    ) {
      setErr('PIN demasiado simple. Elige otro más seguro.');
      return;
    }
    setBusy(true);

    // Verificar que el PIN no esté en uso (si hay nube)
    if (CLOUD_MODE && SUPA) {
      withTimeout(
        SUPA.from('pin_lookup').select('user_id').eq('pin', pinVal).maybeSingle(),
        6000,
        'Verificar PIN'
      )
        .then(function (res) {
          if (res && res.data && res.data.user_id && res.data.user_id !== session.uid) {
            setErr('Este PIN ya está en uso. Elige otro.');
            setBusy(false);
            return;
          }
          // PIN libre, iniciar espera
          codeRef.current = '';
          setCodeInput('');
          setStep('wait');
          setBusy(false);
          startWait();
        })
        .catch(function () {
          // Sin verificación remota, continuamos igual (offline)
          codeRef.current = '';
          setCodeInput('');
          setStep('wait');
          setBusy(false);
          startWait();
        });
    } else {
      codeRef.current = '';
      setCodeInput('');
      setStep('wait');
      setBusy(false);
      startWait();
    }
  }

  // ── Guardar PIN en local + nube ──
  function guardarPIN() {
    grabar('mt_pin_' + session.uid, pinVal);
    var cur = leer(SKEY, {});
    if (cur) {
      cur.pin = pinVal;
      grabar(SKEY, cur);
    }

    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    if (!SUPA || !CLOUD_MODE) {
      setStep('done');
      setBusy(false);
      return;
    }

    withTimeout(
      SUPA.from('pin_lookup').upsert(
        {
          pin: pinVal,
          user_email: session.email,
          user_id: session.uid,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      ),
      8000,
      'Guardar PIN'
    )
      .then(function (res) {
        if (res && res.error) {
          var c = String(res.error.code || '');
          if (c === '23505') {
            setErr('Este PIN ya fue tomado. Intenta con otro.');
            setStep('pin');
            setPinCells(['', '', '', '']);
            setBusy(false);
            return;
          }
          throw res.error;
        }
        setStep('done');
        setBusy(false);
      })
      .catch(function (e) {
        // Guardado local funcionó, no es crítico
        console.warn('PIN guardado solo localmente:', e);
        setStep('done');
        setBusy(false);
      });
  }

  // ── Paso 3: Verificar código ──
  function verificar() {
    if (busy) return;
    haptic();
    setErr(null);
    if (codeInput.length !== 6) {
      setErr('Ingresa los 6 dígitos del código');
      return;
    }
    if (elapsedSec() >= 300) {
      setErr('El código expiró. Pulsa "Generar nuevo".');
      return;
    }
    if (codeInput !== codeRef.current) {
      setErr('Código incorrecto. Revisa los dígitos.');
      return;
    }
    setBusy(true);
    guardarPIN();
  }

  function regenerar() {
    haptic();
    setCodeInput('');
    setErr(null);
    codeRef.current = '';
    startTsRef.current = Date.now();
    setStep('wait');
    startWait();
  }

  // ── Indicador de pasos ──
  function StepIndicator() {
    var steps = ['pin', 'wait', 'verify'];
    var curIdx = steps.indexOf(step);
    if (curIdx < 0) curIdx = 0;
    return h(
      'div',
      { className: 'pin-setup-step', style: { justifyContent: 'center', marginBottom: 24 } },
      steps.map(function (s, i) {
        var cls = i < curIdx ? 'done' : i === curIdx ? '' : 'pending';
        return h(
          React.Fragment,
          { key: s },
          i > 0
            ? h('div', { className: 'pin-setup-step-line' + (i <= curIdx ? ' done' : '') })
            : null,
          h('div', { className: 'pin-setup-step-num ' + cls }, i < curIdx ? '✓' : String(i + 1))
        );
      })
    );
  }

  // ─── PANTALLA: ÉXITO ───
  if (step === 'done') {
    return h(
      'div',
      {
        className: 'pin-setup-wrap',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'PIN creado exitosamente'
      },
      h(
        'div',
        { className: 'pin-setup-card', style: { textAlign: 'center' } },
        h('div', { style: { fontSize: 48, marginBottom: 12 } }, '🎉'),
        h(
          'div',
          {
            style: {
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 8,
              letterSpacing: '-0.5px'
            }
          },
          '¡PIN creado!'
        ),
        h(
          'div',
          { style: { fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 } },
          'Tu PIN es ',
          h(
            'strong',
            {
              style: {
                color: 'var(--accent)',
                letterSpacing: '4px',
                fontSize: 22,
                fontFamily: 'ui-monospace,monospace'
              }
            },
            pinVal
          ),
          '. Guárdalo: lo usarás para entrar rápidamente.'
        ),
        h(
          'div',
          {
            style: {
              background: 'var(--accent-dim)',
              border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              fontSize: 12,
              color: 'var(--accent)',
              marginBottom: 20,
              lineHeight: 1.55
            }
          },
          '✓ La próxima vez puedes entrar con tu PIN de 4 dígitos y tu contraseña.'
        ),
        h(
          'button',
          {
            className: 'auth-btn',
            onClick: function () {
              haptic();
              props.onDone(pinVal);
            }
          },
          'Entrar a la app →'
        )
      )
    );
  }

  // ─── PANTALLA: VERIFICAR CÓDIGO ───
  if (step === 'verify') {
    var segRest = Math.max(0, 300 - elapsedSec());
    var minStr = String(Math.floor(segRest / 60)).padStart(2, '0');
    var secStr = String(segRest % 60).padStart(2, '0');
    var expirado = segRest <= 0;

    return h(
      'div',
      {
        className: 'pin-setup-wrap',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Crear tu PIN'
      },
      h(
        'div',
        { className: 'pin-setup-card' },
        h(
          'div',
          { style: { textAlign: 'center', marginBottom: 18 } },
          h('div', { style: { fontSize: 32, marginBottom: 6 } }, '🔐'),
          h(
            'div',
            {
              style: {
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.5px'
              }
            },
            'Crear tu PIN'
          ),
          h(
            'div',
            { style: { fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 } },
            'Confirmación final'
          )
        ),

        h(StepIndicator, null),

        // Código visible (prueba de humano automática)
        expirado
          ? null
          : h(
              'div',
              { style: { textAlign: 'center', padding: '8px 0 18px' } },
              h(
                'div',
                {
                  style: {
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--muted)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 10
                  }
                },
                'Tu código (válido ' + minStr + ':' + secStr + ')'
              ),
              h(
                'div',
                {
                  style: {
                    fontSize: 42,
                    fontWeight: 900,
                    color: 'var(--accent)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '10px',
                    padding: '16px 18px',
                    background: 'var(--surface2)',
                    borderRadius: 'var(--radius)',
                    border: '2px solid var(--accent)',
                    fontFamily: 'ui-monospace,monospace',
                    marginBottom: 6,
                    display: 'inline-block'
                  }
                },
                codeRef.current
              ),
              h(
                'div',
                { style: { fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4 } },
                '👁 Esto valida que eres un humano. Ingrésalo abajo.'
              )
            ),

        expirado
          ? h(
              'div',
              { style: { textAlign: 'center', padding: '18px 0' } },
              h('div', { style: { fontSize: 34, marginBottom: 8 } }, '⌛'),
              h(
                'div',
                {
                  style: { fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }
                },
                'Código expirado'
              ),
              h(
                'div',
                { style: { fontSize: 12, color: 'var(--muted)', marginBottom: 14 } },
                'Genera uno nuevo para continuar.'
              )
            )
          : null,

        h(
          'div',
          {
            style: {
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 8,
              textAlign: 'center'
            }
          },
          'Ingresa el código'
        ),
        h(
          'div',
          { className: 'code-grid' },
          Array.from({ length: 6 }).map(function (_, i) {
            return h('input', {
              key: i,
              ref: codeRefs[i],
              type: 'tel',
              inputMode: 'numeric',
              maxLength: '1',
              className: 'code-cell',
              value: codeInput[i] || '',
              autoFocus: i === 0 && !expirado,
              disabled: expirado,
              onChange: function (e) {
                handleCodeCell(e, i);
              },
              onKeyDown: function (e) {
                handleCodeKey(e, i);
              }
            });
          })
        ),

        err ? h('div', { className: 'auth-err', style: { marginTop: 10 } }, err) : null,

        expirado
          ? h(
              'button',
              {
                className: 'auth-btn',
                onClick: regenerar,
                style: { marginTop: 12, marginBottom: 10 }
              },
              '🔄 Generar nuevo código'
            )
          : h(
              'button',
              {
                className: 'auth-btn',
                onClick: verificar,
                disabled: busy || codeInput.length !== 6,
                style: { marginTop: 12, marginBottom: 10 }
              },
              busy ? h('span', { className: 'sp-in' }) : 'Verificar y crear PIN'
            ),

        h(
          'button',
          {
            className: 'auth-guest',
            style: { width: '100%' },
            onClick: function () {
              haptic();
              if (tickRef.current) clearInterval(tickRef.current);
              props.onSkip();
            }
          },
          'Omitir · crear PIN después'
        )
      )
    );
  }

  // ─── PANTALLA: ESPERANDO (15s de delay) ───
  if (step === 'wait') {
    var elapsed = elapsedSec();
    var segParaCodigo = Math.max(0, 15 - elapsed);

    return h(
      'div',
      { className: 'pin-setup-wrap' },
      h(
        'div',
        { className: 'pin-setup-card' },
        h(
          'div',
          { style: { textAlign: 'center', marginBottom: 18 } },
          h('div', { style: { fontSize: 32, marginBottom: 6 } }, '⏳'),
          h(
            'div',
            {
              style: {
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.5px'
              }
            },
            'Validando'
          ),
          h(
            'div',
            { style: { fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 } },
            'Tu código aparecerá en unos segundos'
          )
        ),

        h(StepIndicator, null),

        h(
          'div',
          { style: { textAlign: 'center', padding: '30px 0 20px' } },
          h(
            'div',
            {
              style: {
                fontSize: 74,
                fontWeight: 900,
                color: 'var(--accent)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                marginBottom: 8,
                fontFamily: 'ui-monospace,monospace'
              }
            },
            String(segParaCodigo)
          ),
          h(
            'div',
            { style: { fontSize: 12, color: 'var(--muted)', fontWeight: 600 } },
            segParaCodigo > 0 ? 'segundos' : '¡listo!'
          )
        ),

        h(
          'div',
          {
            style: {
              background: 'var(--accent-dim)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11.5,
              color: 'var(--accent)',
              lineHeight: 1.55,
              marginTop: 18,
              textAlign: 'center',
              border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)'
            }
          },
          '🤖 Confirmando que eres un humano…'
        ),

        h(
          'button',
          {
            className: 'auth-guest',
            style: { width: '100%', marginTop: 16 },
            onClick: function () {
              haptic();
              if (tickRef.current) clearInterval(tickRef.current);
              props.onSkip();
            }
          },
          'Omitir · crear PIN después'
        )
      )
    );
  }

  // ─── PANTALLA: PASO 1 — INGRESAR PIN ───
  return h(
    'div',
    { className: 'pin-setup-wrap' },
    h(
      'div',
      { className: 'pin-setup-card' },
      h(
        'div',
        { style: { textAlign: 'center', marginBottom: 18 } },
        h('div', { style: { fontSize: 32, marginBottom: 6 } }, '🔐'),
        h(
          'div',
          {
            style: { fontSize: 18, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }
          },
          'Crear tu PIN'
        ),
        h(
          'div',
          { style: { fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 } },
          'Elige 4 dígitos únicos. Será tu acceso rápido a la app.'
        )
      ),

      h(StepIndicator, null),

      h(
        'div',
        { className: 'pin-grid', style: { marginBottom: err ? 10 : 16 } },
        pinCells.map(function (v, i) {
          return h('input', {
            key: i,
            ref: pinRefs[i],
            type: 'tel',
            inputMode: 'numeric',
            maxLength: '1',
            className: 'pin-cell',
            value: v,
            onChange: function (e) {
              handlePinCell(e, i);
            },
            onKeyDown: function (e) {
              handlePinKey(e, i);
            },
            placeholder: '•',
            autoComplete: 'off',
            autoFocus: i === 0
          });
        })
      ),

      err ? h('div', { className: 'auth-err' }, err) : null,

      h(
        'button',
        { className: 'auth-btn', onClick: continuar, disabled: busy, style: { marginBottom: 10 } },
        busy ? h('span', { className: 'sp-in' }) : 'Continuar →'
      ),

      h(
        'button',
        {
          className: 'auth-guest',
          style: { width: '100%' },
          onClick: function () {
            haptic();
            props.onSkip();
          }
        },
        'Ahora no · crear PIN después'
      )
    )
  );
}
