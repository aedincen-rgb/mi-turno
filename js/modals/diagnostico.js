// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/diagnostico.js
//  Modal diagnóstico admin
// ════════════════════════════════════════════════════════════════
function DiagnosticoModal(props) {
  var session = props.session;
  var lsS = useState(null);
  var localData = lsS[0],
    setLocalData = lsS[1];
  var cloudS = useState(null);
  var cloudData = cloudS[0],
    setCloudData = cloudS[1];
  var loadS = useState(true);
  var loading = loadS[0],
    setLoading = loadS[1];
  var errS = useState(null);
  var cloudErr = errS[0],
    setCloudErr = errS[1];

  function scanLocal() {
    var found = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        if (k.indexOf('mt_pin_') === 0) {
          var raw = localStorage.getItem(k);
          var val = raw;
          try {
            val = JSON.parse(raw);
          } catch (e) {}
          found.push({
            key: k,
            pin: val,
            tipo: k.indexOf('mt_pin_app_') === 0 ? 'app (v.antigua)' : 'estándar'
          });
        }
      }
      var ses = leer(SKEY, null);
      if (ses && ses.pin) {
        found.push({ key: SKEY + ' (sesión activa)', pin: ses.pin, tipo: 'sesión' });
      }
    } catch (e) {
      console.warn('scanLocal error', e);
    }
    return found;
  }

  function scanCloud() {
    if (!CLOUD_MODE || !SUPA) {
      setCloudErr('Sin conexión a la nube — solo se muestran datos locales.');
      setLoading(false);
      return;
    }
    withTimeout(
      SUPA.from('pin_lookup')
        .select('pin,user_email,user_id,updated_at')
        .order('updated_at', { ascending: false }),
      8000,
      'Diagnóstico nube'
    )
      .then(function (res) {
        if (res && res.error) throw res.error;
        setCloudData(res.data || []);
        setLoading(false);
      })
      .catch(function (e) {
        setCloudErr(traducirError(e) || 'No se pudo leer la nube.');
        setLoading(false);
      });
  }

  useEffect(function () {
    setLocalData(scanLocal());
    scanCloud();
  }, []);

  var cloudPins = {};
  if (cloudData) {
    cloudData.forEach(function (r) {
      if (r.pin) cloudPins[String(r.pin)] = r;
    });
  }

  function fmtFecha(s) {
    if (!s) return '—';
    try {
      var d = new Date(s);
      return (
        d.toLocaleDateString('es-CO') +
        ' ' +
        d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (e) {
      return s;
    }
  }

  function resync(pin) {
    if (!CLOUD_MODE || !SUPA) {
      alert('Necesitas conexión a la nube.');
      return;
    }
    if (!session.email || session.pinOnly || session.guest) {
      alert('Inicia sesión con tu correo primero.');
      return;
    }
    if (!confirm('¿Vincular el PIN ' + pin + ' a ' + session.email + '?')) return;
    SUPA.from('pin_lookup')
      .upsert({
        pin: String(pin),
        user_email: session.email,
        user_id: session.uid,
        updated_at: new Date().toISOString()
      })
      .then(function (res) {
        if (res && res.error) throw res.error;
        alert('✓ PIN ' + pin + ' sincronizado.');
        setLoading(true);
        scanCloud();
      })
      .catch(function (e) {
        alert('Error: ' + (traducirError(e) || 'inténtalo de nuevo'));
      });
  }

  return h(
    'div',
    { className: 'modal-card', style: { maxHeight: '80vh', overflowY: 'auto' } },
    h(
      'div',
      { style: { fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 } },
      '🔍 Diagnóstico de PINs'
    ),
    h(
      'div',
      { style: { fontSize: 11.5, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 } },
      'Compara los PINs guardados en este dispositivo con los registrados en la nube. Solo lectura.'
    ),

    h(
      'div',
      { className: 'diag-sec' },
      h('div', { className: 'diag-sec-ttl' }, '☁ En la nube (Supabase)'),
      loading
        ? h(
            'div',
            { className: 'diag-empty' },
            h('span', { className: 'sp-in' }),
            ' Consultando la nube...'
          )
        : cloudErr
          ? h('div', { className: 'diag-empty', style: { color: 'var(--danger)' } }, cloudErr)
          : !cloudData || cloudData.length === 0
            ? h('div', { className: 'diag-empty' }, 'No hay PINs registrados en la nube.')
            : cloudData.map(function (r, i) {
                return h(
                  'div',
                  { key: 'c' + i, className: 'diag-row' },
                  h(
                    'div',
                    { style: { minWidth: 0, flex: 1 } },
                    h('div', { className: 'diag-pin-big' }, r.pin),
                    h(
                      'div',
                      { className: 'diag-row-v', style: { textAlign: 'left', marginTop: 2 } },
                      r.user_email || 'sin correo'
                    )
                  ),
                  h(
                    'div',
                    { style: { textAlign: 'right', flexShrink: 0 } },
                    h('div', { className: 'diag-badge cloud' }, 'NUBE'),
                    h(
                      'div',
                      { style: { fontSize: 9.5, color: 'var(--muted)', marginTop: 3 } },
                      fmtFecha(r.updated_at)
                    )
                  )
                );
              })
    ),

    h(
      'div',
      { className: 'diag-sec' },
      h('div', { className: 'diag-sec-ttl' }, '📱 En este dispositivo (localStorage)'),
      !localData || localData.length === 0
        ? h('div', { className: 'diag-empty' }, 'No hay PINs guardados localmente.')
        : localData.map(function (d, i) {
            var pinStr = String(d.pin);
            var enNube = cloudPins[pinStr];
            return h(
              'div',
              { key: 'l' + i, className: 'diag-row' },
              h(
                'div',
                { style: { minWidth: 0, flex: 1 } },
                h('div', { className: 'diag-pin-big' }, d.pin),
                h(
                  'div',
                  {
                    className: 'diag-row-v',
                    style: { textAlign: 'left', marginTop: 2, fontSize: 10 }
                  },
                  d.tipo + ' · ' + d.key
                )
              ),
              h(
                'div',
                {
                  style: {
                    textAlign: 'right',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    alignItems: 'flex-end'
                  }
                },
                enNube
                  ? h('div', { className: 'diag-badge ok' }, '✓ EN NUBE')
                  : h('div', { className: 'diag-badge warn' }, 'SOLO LOCAL'),
                !enNube && !session.pinOnly && !session.guest && session.email
                  ? h(
                      'button',
                      {
                        onClick: function () {
                          resync(d.pin);
                        },
                        style: {
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 99,
                          border: '1px solid var(--accent)',
                          background: 'transparent',
                          color: 'var(--accent)',
                          cursor: 'pointer'
                        }
                      },
                      '↑ Sincronizar'
                    )
                  : null
              )
            );
          })
    ),

    h(
      'div',
      { className: 'diag-note' },
      h('strong', null, 'Cómo leer: '),
      'Los marcados ',
      h('strong', null, '✓ EN NUBE'),
      ' están respaldados. Los ',
      h('strong', null, 'SOLO LOCAL'),
      ' viven aquí.'
    ),

    h(
      'button',
      {
        className: 'btn btn-ghost btn-block',
        onClick: function () {
          haptic();
          props.onClose();
        },
        style: { marginTop: 14 }
      },
      'Cerrar'
    )
  );
}
