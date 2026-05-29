// ═══════════════════════════════════════════════════════════════
// tabs/config.js · Ajustes (rediseño)
// ───────────────────────────────────────────────────────────────
// Sustituye la versión anterior. Mantiene la firma:
//   props = { salario, valorHora, session, onSalario, onSignOut,
//             theme, onThemeChange }
// Usa globales existentes: useState, h, haptic, fCOP, SMIN, RC,
// CLOUD_MODE, ManageAccountModal.
// ═══════════════════════════════════════════════════════════════

// Wrapper a prueba de fallos: si ConfigTabInner crashea por cualquier
// motivo (versión vieja de globals.js en caché, etc.) mostramos un
// estado mínimo y un botón para forzar recarga, en vez de pantalla blanca.
function ConfigTab(props) {
  try {
    return ConfigTabInner(props);
  } catch (err) {
    console.error('[MT] ConfigTab render error:', err);
    return h(
      'div',
      { className: 'fadeUp', style: { padding: '24px' } },
      h(
        'div',
        {
          className: 'card',
          style: {
            padding: '20px',
            borderRadius: '20px',
            background: 'var(--warn-dim)',
            border: '1.5px solid var(--warn)'
          }
        },
        h(
          'div',
          { style: { fontSize: '15px', fontWeight: 700, marginBottom: '8px' } },
          '⚠ Ajustes no pudo cargar correctamente'
        ),
        h(
          'div',
          {
            style: {
              fontSize: '13px',
              color: 'var(--text-2)',
              marginBottom: '14px',
              lineHeight: 1.45
            }
          },
          'Tu app tiene una versión mezclada en caché. Tocá el botón para descargar la última versión completa.'
        ),
        h(
          'button',
          {
            style: {
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%'
            },
            onClick: function () {
              try {
                if (window._mtHardReset) {
                  window._mtHardReset('Reiniciando app…');
                  return;
                }
                if (window._mtCheckUpdate) {
                  window._mtCheckUpdate(true);
                  return;
                }
              } catch (_) {}
              window.location.reload();
            }
          },
          'Reiniciar y aplicar última versión'
        ),
        h(
          'div',
          {
            style: {
              fontSize: '11px',
              color: 'var(--muted)',
              marginTop: '12px',
              textAlign: 'center'
            }
          },
          'Versión: ' + (typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : 'desconocida')
        )
      )
    );
  }
}

function ConfigTabInner(props) {
  var salario = props.salario,
    vh = props.valorHora,
    session = props.session;

  var es = useState(false);
  var editSal = es[0],
    setEditSal = es[1];
  var st = useState('');
  var tempSal = st[0],
    setTempSal = st[1];
  var gs = useState(false);
  var showMgtAcct = gs[0],
    setShowMgtAcct = gs[1];
  var rs = useState(false);
  var openRec = rs[0],
    setOpenRec = rs[1];
  var su = useState(false);
  var showUsuarios = su[0],
    setShowUsuarios = su[1];
  var sp = useState(false);
  var showPins = sp[0],
    setShowPins = sp[1];
  var sd = useState(false);
  var showDiag = sd[0],
    setShowDiag = sd[1];
  var sv = useState(false);
  var showErrorViewer = sv[0],
    setShowErrorViewer = sv[1];

  // Estado del acordeón del modo quincenal
  var oq = useState(false);
  var openQuincena = oq[0],
    setOpenQuincena = oq[1];

  // ── Perfil personal (foto + nombre/apodo) ─────────────────
  // Guardado por uid en localStorage. Local-only por ahora.
  var uid = session && session.uid ? session.uid : 'guest';
  var pp = useState(function () {
    return leer(dk(uid, 'photo'), null);
  });
  var photo = pp[0],
    setPhoto = pp[1];
  var pn = useState(function () {
    return leer(dk(uid, 'pname'), '');
  });
  var pname = pn[0],
    setPname = pn[1];
  var ne = useState(false);
  var editName = ne[0],
    setEditName = ne[1];
  var tn = useState('');
  var tempName = tn[0],
    setTempName = tn[1];
  var asp = useState(false);
  var showPhotoSheet = asp[0],
    setShowPhotoSheet = asp[1];
  var fileInputRef = useRef(null);

  function onPickPhoto(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('La foto es muy grande (máximo 8 MB)');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        try {
          var SIZE = 240;
          var canvas = document.createElement('canvas');
          canvas.width = SIZE;
          canvas.height = SIZE;
          var ctx = canvas.getContext('2d');
          // Recorte cuadrado centrado (cover)
          var sw = Math.min(img.width, img.height);
          var sx = (img.width - sw) / 2;
          var sy = (img.height - sw) / 2;
          ctx.drawImage(img, sx, sy, sw, sw, 0, 0, SIZE, SIZE);
          var dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          // Si localStorage está lleno, grabar() devuelve false: avisamos
          // en vez de fingir que guardó (la UI no debe mostrar una foto
          // que no persiste tras recargar).
          var okGuardado = grabar(dk(uid, 'photo'), dataUrl);
          if (!okGuardado) {
            // Reintento con más compresión por si fue tema de tamaño.
            var dataUrlSmall = canvas.toDataURL('image/jpeg', 0.5);
            okGuardado = grabar(dk(uid, 'photo'), dataUrlSmall);
            if (okGuardado) dataUrl = dataUrlSmall;
          }
          if (!okGuardado) {
            alert(
              'No se pudo guardar la foto: almacenamiento del dispositivo lleno. Liberá espacio e intentá de nuevo.'
            );
            return;
          }
          setPhoto(dataUrl);
          haptic();
        } catch (err) {
          alert('No se pudo procesar la imagen');
        }
      };
      img.onerror = function () {
        alert('No se pudo leer la imagen');
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      alert('No se pudo abrir el archivo');
    };
    reader.readAsDataURL(file);
  }
  function eliminarFoto() {
    haptic();
    borrarKey(dk(uid, 'photo'));
    setPhoto(null);
    setShowPhotoSheet(false);
  }
  function abrirGaleria() {
    setShowPhotoSheet(false);
    setTimeout(function () {
      if (fileInputRef.current) fileInputRef.current.click();
    }, 80);
  }
  function abrirEditName() {
    haptic();
    setTempName(pname || '');
    setEditName(true);
  }
  function guardarName() {
    haptic();
    var clean = String(tempName || '')
      .trim()
      .slice(0, 32);
    if (clean) {
      var okName = grabar(dk(uid, 'pname'), clean);
      if (!okName) {
        alert('No se pudo guardar el nombre: almacenamiento lleno.');
        return;
      }
      setPname(clean);
    } else {
      borrarKey(dk(uid, 'pname'));
      setPname('');
    }
    setEditName(false);
  }

  // Estado local de texto para los inputs Q1/Q2 — permite vaciar el
  // campo y reescribir sin que React lo fuerce a su valor previo.
  // Se sincroniza con prefs solo cuando el texto es un número válido.
  var q1t = useState('');
  var q1Text = q1t[0],
    setQ1Text = q1t[1];
  var q2t = useState('');
  var q2Text = q2t[0],
    setQ2Text = q2t[1];

  // Estado del chequeo manual de actualización
  // updStatus: 'idle' | 'checking' | 'uptodate' | 'available' | 'error'
  var us = useState({ status: 'idle', remote: null, checkedAt: null });
  var updState = us[0],
    setUpdState = us[1];

  function checkVersionNow() {
    haptic();
    setUpdState({ status: 'checking', remote: null, checkedAt: null });
    var local = typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : '';
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r || !r.ok) throw new Error('http ' + (r && r.status));
        return r.json();
      })
      .then(function (j) {
        var remote = j && j.v ? String(j.v) : null;
        if (!remote) throw new Error('formato inválido');
        var ts = new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit'
        });
        if (remote === local) {
          setUpdState({ status: 'uptodate', remote: remote, checkedAt: ts });
        } else {
          setUpdState({ status: 'available', remote: remote, checkedAt: ts });
          // Pedimos al SW que se actualice en segundo plano para que el
          // botón "Actualizar ahora" sea instantáneo cuando lo toquen.
          try {
            if (window._mtCheckUpdate) window._mtCheckUpdate(false);
          } catch (_) {}
        }
      })
      .catch(function () {
        setUpdState({ status: 'error', remote: null, checkedAt: null });
      });
  }

  function applyUpdateNow() {
    haptic();
    try {
      if (window._mtCheckUpdate) {
        window._mtCheckUpdate(true);
        return;
      }
    } catch (_) {}
    window.location.reload();
  }

  var prefs =
    props.prefs ||
    (typeof QUINCENA_PREFS_DEFAULT !== 'undefined'
      ? QUINCENA_PREFS_DEFAULT
      : { auxTransp: false, prestaciones: false, quincenaMode: false, q1Day: 1, q2Day: 16 });
  function patchPrefs(p) {
    if (props.onPrefsChange) props.onPrefsChange(p);
  }

  // Constantes con fallback por si globals.js está en versión vieja en caché
  var AUX_VAL = typeof AUX_TRANSPORTE_2026 !== 'undefined' ? AUX_TRANSPORTE_2026 : 249095;
  var PRES_PCT = typeof PRESTACIONES_PCT !== 'undefined' ? PRESTACIONES_PCT : 0.218;

  // Sincroniza el texto local con los días reales de las prefs cuando
  // cambian desde fuera (carga inicial, preset, etc.)
  useEffect(
    function () {
      setQ1Text(String(prefs.q1Day));
    },
    [prefs.q1Day]
  );
  useEffect(
    function () {
      setQ2Text(String(prefs.q2Day));
    },
    [prefs.q2Day]
  );

  // Acepta texto libre; solo commitea cuando es un entero válido 1..28.
  function onDayTextChange(which, txt) {
    if (which === 'q1') setQ1Text(txt);
    else setQ2Text(txt);
    if (txt === '') return; // permite borrar sin forzar nada
    var v = parseInt(txt, 10);
    if (isNaN(v)) return;
    if (v < 1 || v > 28) return;
    if (which === 'q1') patchPrefs({ q1Day: v });
    else patchPrefs({ q2Day: v });
  }
  // Al perder el foco, si quedó vacío o inválido, snap al último valor válido.
  function onDayBlur(which) {
    if (which === 'q1') {
      var v1 = parseInt(q1Text, 10);
      if (isNaN(v1) || v1 < 1 || v1 > 28) setQ1Text(String(prefs.q1Day));
    } else {
      var v2 = parseInt(q2Text, 10);
      if (isNaN(v2) || v2 < 1 || v2 > 28) setQ2Text(String(prefs.q2Day));
    }
  }
  function applyPreset(a, b) {
    haptic();
    patchPrefs({ q1Day: a, q2Day: b });
  }

  function guardarSalario() {
    haptic();
    // Limpia formato colombiano "1.750.905" o "1,750,905" o "$ 1.750.905"
    // antes de parsear. Sin esto, parseFloat("1.750.905") devuelve 1.75.
    var raw = String(tempSal == null ? '' : tempSal).replace(/[^\d]/g, '');
    var v = parseInt(raw, 10);
    if (isNaN(v) || v <= 0) v = SMIN;
    props.onSalario(v);
    setEditSal(false);
  }

  // Datos de identidad
  var isGuest = !session || session.guest;
  var emailMostrar = isGuest ? 'Modo invitado' : session.email || 'Usuario';
  // El nombre mostrado: prioriza el alias personal, luego email/invitado
  var displayName = pname || emailMostrar;
  // Inicial: del nombre personal si existe, si no del email
  var inicial =
    pname && pname.length > 0
      ? pname[0].toUpperCase()
      : isGuest
        ? '?'
        : session.email
          ? session.email[0].toUpperCase()
          : 'U';
  var estado = isGuest
    ? 'Datos en este dispositivo'
    : typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE
      ? 'Sincronizado en la nube'
      : 'Datos locales';

  return h(
    'div',
    { className: 'fadeUp ajustes-wrap' },

    // ══════ HERO IDENTIDAD ══════
    h(
      'div',
      { className: 'ajustes-hero' },
      // Avatar tappable — abre file picker o action sheet si ya hay foto
      h(
        'button',
        {
          className: 'ajustes-hero-av' + (photo ? ' has-photo' : ''),
          onClick: function () {
            haptic();
            if (photo) setShowPhotoSheet(true);
            else if (fileInputRef.current) fileInputRef.current.click();
          },
          'aria-label': photo ? 'Cambiar o eliminar foto' : 'Elegir foto de perfil'
        },
        h('div', { className: 'ajustes-hero-av-glow' }),
        photo
          ? h('img', {
              src: photo,
              alt: '',
              className: 'ajustes-hero-av-img',
              draggable: false
            })
          : h('span', { className: 'ajustes-hero-av-ini' }, inicial),
        h('span', { className: 'ajustes-hero-av-edit', 'aria-hidden': 'true' }, '✎')
      ),
      // Input file oculto
      h('input', {
        ref: fileInputRef,
        type: 'file',
        accept: 'image/*',
        style: { display: 'none' },
        onChange: function (e) {
          var f = e.target.files && e.target.files[0];
          if (f) onPickPhoto(f);
          // Permite re-seleccionar la misma foto si se quitó y se vuelve a poner
          e.target.value = '';
        }
      }),

      // Nombre — edición inline
      editName
        ? h(
            'div',
            { className: 'ajustes-hero-name-edit' },
            h('input', {
              type: 'text',
              inputMode: 'text',
              maxLength: 32,
              className: 'ajustes-edit-input',
              value: tempName,
              autoFocus: true,
              placeholder: 'Tu nombre o apodo',
              onChange: function (e) {
                setTempName(e.target.value);
              },
              onKeyDown: function (e) {
                if (e.key === 'Enter') guardarName();
                if (e.key === 'Escape') setEditName(false);
              }
            }),
            h(
              'button',
              {
                className: 'ajustes-edit-save',
                onClick: guardarName,
                'aria-label': 'Guardar nombre'
              },
              '✓'
            )
          )
        : h(
            'button',
            {
              className: 'ajustes-hero-nm-btn',
              onClick: abrirEditName,
              title: 'Tocá para editar tu nombre'
            },
            displayName,
            h('span', { className: 'ajustes-hero-nm-pen', 'aria-hidden': 'true' }, '✎')
          ),

      // Si el usuario puso alias personalizado, mostramos email en chico debajo
      !editName && pname && !isGuest && session.email
        ? h('div', { className: 'ajustes-hero-email' }, session.email)
        : null,

      h(
        'div',
        { className: 'ajustes-hero-est' },
        h('span', { className: 'ajustes-hero-dot' + (isGuest ? ' off' : '') }),
        estado
      )
    ),

    // ══════ ACTION SHEET FOTO (estilo iOS) ══════
    showPhotoSheet
      ? h(
          'div',
          {
            className: 'mol-ov',
            onClick: function (e) {
              if (e.target === e.currentTarget) setShowPhotoSheet(false);
            }
          },
          h(
            'div',
            { className: 'mol-sh ajustes-photo-sheet' },
            h('div', { className: 'mol-hdl' }),
            h('div', { className: 'ajustes-photo-sheet-ttl' }, 'Foto de perfil'),
            h(
              'div',
              { className: 'ajustes-photo-sheet-grp' },
              h(
                'button',
                {
                  className: 'ajustes-photo-sheet-btn',
                  onClick: abrirGaleria
                },
                h('span', { className: 'ajustes-photo-sheet-ico' }, '📷'),
                'Cambiar foto'
              ),
              h(
                'button',
                {
                  className: 'ajustes-photo-sheet-btn danger',
                  onClick: eliminarFoto
                },
                h('span', { className: 'ajustes-photo-sheet-ico' }, '🗑'),
                'Eliminar foto'
              )
            ),
            h(
              'button',
              {
                className: 'ajustes-photo-sheet-cancel',
                onClick: function () {
                  setShowPhotoSheet(false);
                }
              },
              'Cancelar'
            )
          )
        )
      : null,

    // ══════ APARIENCIA ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Apariencia'),
      h(
        'div',
        { className: 'ajustes-list' },
        h(
          'div',
          { className: 'ajustes-row' },
          h('div', { className: 'ajustes-row-ico' }, props.theme === 'dark' ? '☾' : '☀'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h(
              'div',
              { className: 'ajustes-row-ttl' },
              props.theme === 'dark' ? 'Modo oscuro' : 'Modo claro'
            ),
            h('div', { className: 'ajustes-row-sub' }, 'Cambia el aspecto de la app')
          ),
          h(
            'label',
            { className: 'ajustes-switch' },
            h('input', {
              type: 'checkbox',
              checked: props.theme === 'dark',
              onChange: function () {
                haptic();
                props.onThemeChange(props.theme === 'dark' ? 'light' : 'dark');
              }
            }),
            h('span', { className: 'ajustes-switch-track' })
          )
        )
      )
    ),

    // ══════ NÓMINA ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Nómina'),
      h(
        'div',
        { className: 'ajustes-list' },

        // Salario base (fila expandible inline)
        h(
          'div',
          { className: 'ajustes-row-group' + (editSal ? ' open' : '') },
          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                if (editSal) {
                  setEditSal(false);
                } else {
                  haptic();
                  setTempSal(String(salario));
                  setEditSal(true);
                }
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '$'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Salario base mensual'),
              h('div', { className: 'ajustes-row-sub' }, fCOP(salario))
            ),
            h('div', { className: 'ajustes-row-chev' }, editSal ? '−' : '✎')
          ),
          editSal &&
            h(
              'div',
              { className: 'ajustes-row-body' },
              h(
                'div',
                { className: 'ajustes-edit' },
                h('span', { className: 'ajustes-edit-prefix' }, '$'),
                h('input', {
                  type: 'text',
                  inputMode: 'numeric',
                  pattern: '[0-9.,$ ]*',
                  className: 'ajustes-edit-input',
                  value: tempSal,
                  onChange: function (e) {
                    setTempSal(e.target.value);
                  },
                  onKeyDown: function (e) {
                    if (e.key === 'Enter') guardarSalario();
                  },
                  autoFocus: true,
                  placeholder: '1.300.000'
                }),
                h(
                  'button',
                  {
                    className: 'ajustes-edit-save',
                    onClick: guardarSalario,
                    'aria-label': 'Guardar'
                  },
                  '✓'
                )
              ),
              h(
                'p',
                { className: 'ajustes-edit-hint' },
                'Se usa para calcular tu valor hora y todos los recargos.'
              )
            )
        ),

        // Valor hora (read-only)
        h(
          'div',
          { className: 'ajustes-row ajustes-row-static' },
          h('div', { className: 'ajustes-row-ico soft' }, '◷'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Valor hora base'),
            h('div', { className: 'ajustes-row-sub' }, 'Se calcula automáticamente')
          ),
          h('div', { className: 'ajustes-row-val' }, fCOP(vh))
        )
      )
    ),

    // ══════ ESTIMACIÓN AVANZADA ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Estimación avanzada'),
      h(
        'div',
        { className: 'ajustes-list' },

        // Toggle: auxilio de transporte
        h(
          'div',
          { className: 'ajustes-row' },
          h('div', { className: 'ajustes-row-ico' }, '🚌'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Auxilio de transporte'),
            h(
              'div',
              { className: 'ajustes-row-sub' },
              'Suma ' + fCOP(AUX_VAL) + ' al estimado (fijo 2026)'
            )
          ),
          h(
            'label',
            { className: 'ajustes-switch' },
            h('input', {
              type: 'checkbox',
              checked: !!prefs.auxTransp,
              onChange: function () {
                haptic();
                patchPrefs({ auxTransp: !prefs.auxTransp });
              }
            }),
            h('span', { className: 'ajustes-switch-track' })
          )
        ),

        // Toggle: prestaciones aproximadas
        h(
          'div',
          { className: 'ajustes-row' },
          h('div', { className: 'ajustes-row-ico' }, '✦'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Prestaciones aproximadas'),
            h(
              'div',
              { className: 'ajustes-row-sub' },
              'Cesantías, prima y vacaciones (~' + Math.round(PRES_PCT * 100) + '% del salario)'
            )
          ),
          h(
            'label',
            { className: 'ajustes-switch' },
            h('input', {
              type: 'checkbox',
              checked: !!prefs.prestaciones,
              onChange: function () {
                haptic();
                patchPrefs({ prestaciones: !prefs.prestaciones });
              }
            }),
            h('span', { className: 'ajustes-switch-track' })
          )
        )
      ),
      h(
        'p',
        { className: 'ajustes-legal', style: { padding: '0 4px' } },
        'Son valores estimados. Pueden variar según tu empleador y las deducciones legales.'
      )
    ),

    // ══════ MODO QUINCENAL ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Modo quincenal'),
      h(
        'div',
        { className: 'ajustes-list' },

        // Toggle quincena
        h(
          'div',
          { className: 'ajustes-row' },
          h('div', { className: 'ajustes-row-ico' }, '◑'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Calcular por quincena'),
            h(
              'div',
              { className: 'ajustes-row-sub' },
              'Separa el estimado en Q1 y Q2 según tus fechas de pago'
            )
          ),
          h(
            'label',
            { className: 'ajustes-switch' },
            h('input', {
              type: 'checkbox',
              checked: !!prefs.quincenaMode,
              onChange: function () {
                haptic();
                var next = !prefs.quincenaMode;
                patchPrefs({ quincenaMode: next });
                if (next) setOpenQuincena(true);
              }
            }),
            h('span', { className: 'ajustes-switch-track' })
          )
        ),

        // Acordeón: días de quincena
        h(
          'div',
          { className: 'ajustes-row-group' + (openQuincena ? ' open' : '') },
          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              disabled: !prefs.quincenaMode,
              onClick: function () {
                haptic();
                setOpenQuincena(!openQuincena);
              },
              style: prefs.quincenaMode ? null : { opacity: 0.55, cursor: 'not-allowed' }
            },
            h('div', { className: 'ajustes-row-ico soft' }, '📅'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Días de inicio'),
              h(
                'div',
                { className: 'ajustes-row-sub' },
                'Q1: día ' + prefs.q1Day + '  ·  Q2: día ' + prefs.q2Day
              )
            ),
            h('div', { className: 'ajustes-row-chev' }, openQuincena ? '−' : '+')
          ),
          openQuincena && prefs.quincenaMode
            ? h(
                'div',
                { className: 'ajustes-row-body' },
                h(
                  'div',
                  { className: 'ajustes-quincena-grid' },
                  h(
                    'label',
                    { className: 'ajustes-quincena-fld' },
                    h('span', { className: 'ajustes-quincena-lbl' }, 'Inicio Q1'),
                    h('input', {
                      type: 'number',
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      min: 1,
                      max: 28,
                      className: 'ajustes-edit-input',
                      value: q1Text,
                      onFocus: function (e) {
                        e.target.select();
                      },
                      onChange: function (e) {
                        onDayTextChange('q1', e.target.value);
                      },
                      onBlur: function () {
                        onDayBlur('q1');
                      }
                    })
                  ),
                  h(
                    'label',
                    { className: 'ajustes-quincena-fld' },
                    h('span', { className: 'ajustes-quincena-lbl' }, 'Inicio Q2'),
                    h('input', {
                      type: 'number',
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      min: 1,
                      max: 28,
                      className: 'ajustes-edit-input',
                      value: q2Text,
                      onFocus: function (e) {
                        e.target.select();
                      },
                      onChange: function (e) {
                        onDayTextChange('q2', e.target.value);
                      },
                      onBlur: function () {
                        onDayBlur('q2');
                      }
                    })
                  )
                ),
                // Presets de pago más comunes en Colombia
                h(
                  'div',
                  { className: 'ajustes-quincena-presets' },
                  h('span', { className: 'ajustes-quincena-presets-lbl' }, 'Presets:'),
                  [
                    [1, 16],
                    [10, 25],
                    [15, 30]
                  ].map(function (p) {
                    var active = prefs.q1Day === p[0] && prefs.q2Day === p[1];
                    return h(
                      'button',
                      {
                        key: p[0] + '-' + p[1],
                        className: 'ajustes-quincena-preset' + (active ? ' on' : ''),
                        onClick: function () {
                          applyPreset(p[0], p[1]);
                        }
                      },
                      p[0] + ' / ' + p[1]
                    );
                  })
                ),
                h(
                  'p',
                  { className: 'ajustes-edit-hint' },
                  'Q1 va desde el día indicado hasta el inicio de Q2. El estimado se filtra automáticamente por la quincena activa.'
                )
              )
            : null
        )
      )
    ),

    // ══════ CUENTA ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Cuenta'),
      h(
        'div',
        { className: 'ajustes-list' },
        h(
          'button',
          {
            className: 'ajustes-row ajustes-row-tap',
            onClick: function () {
              haptic();
              setShowMgtAcct(true);
            }
          },
          h('div', { className: 'ajustes-row-ico' }, '⚙'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Gestionar cuenta'),
            h('div', { className: 'ajustes-row-sub' }, 'PIN, correo y contraseña')
          ),
          h('div', { className: 'ajustes-row-chev' }, '›')
        ),
        h(
          'button',
          {
            className: 'ajustes-row ajustes-row-tap danger',
            onClick: function () {
              haptic();
              props.onSignOut();
            }
          },
          h('div', { className: 'ajustes-row-ico danger' }, '↩'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl danger' }, 'Cerrar sesión'),
            h('div', { className: 'ajustes-row-sub' }, 'Volverás a la pantalla de entrada')
          ),
          h('div', { className: 'ajustes-row-chev' }, '›')
        )
      )
    ),

    // ══════ PANEL ADMINISTRADOR ══════
    session &&
      session.isAdmin &&
      h(
        'div',
        { className: 'ajustes-section' },
        h('div', { className: 'ajustes-section-ttl' }, 'Administrador'),
        h(
          'div',
          { className: 'ajustes-list' },

          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setShowUsuarios(true);
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '👥'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Usuarios'),
              h('div', { className: 'ajustes-row-sub' }, 'Ver y gestionar todos los usuarios')
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          ),

          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setShowPins(true);
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '🔑'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Asignar PINs'),
              h('div', { className: 'ajustes-row-sub' }, 'Gestionar PINs de acceso')
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          ),

          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setShowDiag(true);
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '🛠'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Diagnóstico'),
              h('div', { className: 'ajustes-row-sub' }, 'Estado de sesiones y datos')
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          ),

          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setShowErrorViewer(true);
              }
            },
            h('div', { className: 'ajustes-row-ico danger' }, '🐞'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Consola Dev'),
              h('div', { className: 'ajustes-row-sub' }, 'Registro de errores y depuración')
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          )
        )
      ),

    // ══════ CÓMO SE CALCULA TU PAGO (acordeón con recargos) ══════
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Cómo se calcula tu pago'),
      h(
        'div',
        { className: 'ajustes-list' },
        h(
          'div',
          { className: 'ajustes-row-group' + (openRec ? ' open' : '') },
          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                setOpenRec(!openRec);
              }
            },
            h('div', { className: 'ajustes-row-ico' }, '✦'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Tabla de recargos'),
              h('div', { className: 'ajustes-row-sub' }, 'Ley 2101/2021 · Toca para ver')
            ),
            h('div', { className: 'ajustes-row-chev' }, openRec ? '−' : '+')
          ),
          openRec &&
            h(
              'div',
              { className: 'ajustes-row-body' },
              h(
                'div',
                { className: 'ajustes-recargos' },
                Object.keys(RC).map(function (k) {
                  var r = RC[k];
                  return h(
                    'div',
                    { key: k, className: 'ajustes-recargo' },
                    h(
                      'span',
                      {
                        className: 'ajustes-recargo-chip',
                        style: { background: r.bg, border: '1px solid ' + r.bd, color: r.color }
                      },
                      r.icon
                    ),
                    h('span', { className: 'ajustes-recargo-lbl' }, r.label),
                    h(
                      'span',
                      {
                        className: 'ajustes-recargo-pct',
                        style: { color: r.color }
                      },
                      '+' + Math.round((r.factor - 1) * 100) + '%'
                    )
                  );
                })
              ),
              h(
                'p',
                { className: 'ajustes-legal' },
                'CST Arts. 168–171 · Calculados sobre el valor hora base.'
              )
            )
        )
      )
    ),

    // ══════ ACERCA DE / VERSIÓN ══════
    (function () {
      var localV = typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : 'desconocida';

      // Construcción dinámica de la fila del botón según estado del check
      var btnIcon, btnTtl, btnSub, btnCls, btnIcoCls, btnDisabled, btnOnClick;
      if (updState.status === 'checking') {
        btnIcon = '⟳';
        btnTtl = 'Buscando…';
        btnSub = 'Consultando el servidor';
        btnCls = 'ajustes-row';
        btnIcoCls = 'ajustes-row-ico';
        btnDisabled = true;
        btnOnClick = function () {};
      } else if (updState.status === 'uptodate') {
        btnIcon = '✓';
        btnTtl = 'Ya estás al día';
        btnSub = 'Última versión (' + updState.remote + ') · ' + updState.checkedAt;
        btnCls = 'ajustes-row ajustes-row-tap';
        btnIcoCls = 'ajustes-row-ico';
        btnDisabled = false;
        btnOnClick = checkVersionNow;
      } else if (updState.status === 'available') {
        btnIcon = '↑';
        btnTtl = 'Nueva versión ' + updState.remote;
        btnSub = 'Tocá para actualizar (estás en ' + localV + ')';
        btnCls = 'ajustes-row ajustes-row-tap';
        btnIcoCls = 'ajustes-row-ico';
        btnDisabled = false;
        btnOnClick = applyUpdateNow;
      } else if (updState.status === 'error') {
        btnIcon = '!';
        btnTtl = 'No se pudo verificar';
        btnSub = 'Revisá tu conexión y tocá de nuevo';
        btnCls = 'ajustes-row ajustes-row-tap';
        btnIcoCls = 'ajustes-row-ico danger';
        btnDisabled = false;
        btnOnClick = checkVersionNow;
      } else {
        btnIcon = '⟳';
        btnTtl = 'Buscar actualización';
        btnSub = 'Verifica si hay una versión más reciente';
        btnCls = 'ajustes-row ajustes-row-tap';
        btnIcoCls = 'ajustes-row-ico';
        btnDisabled = false;
        btnOnClick = checkVersionNow;
      }

      return h(
        'div',
        { className: 'ajustes-section' },
        h('div', { className: 'ajustes-section-ttl' }, 'Acerca de'),
        h(
          'div',
          { className: 'ajustes-list' },
          // Versión instalada (estática)
          h(
            'div',
            { className: 'ajustes-row ajustes-row-static' },
            h('div', { className: 'ajustes-row-ico soft' }, 'ⓘ'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Versión instalada'),
              h('div', { className: 'ajustes-row-sub' }, localV)
            ),
            h('div', { className: 'ajustes-row-val' }, 'PWA')
          ),
          // Botón de chequeo dinámico
          h(
            'button',
            {
              className: btnCls,
              disabled: btnDisabled,
              onClick: btnOnClick,
              style: btnDisabled ? { opacity: 0.6, cursor: 'wait' } : null
            },
            h(
              'div',
              {
                className: btnIcoCls,
                style:
                  updState.status === 'checking' ? { animation: 'spin 1s linear infinite' } : null
              },
              btnIcon
            ),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, btnTtl),
              h('div', { className: 'ajustes-row-sub' }, btnSub)
            ),
            updState.status === 'available'
              ? h(
                  'div',
                  {
                    className: 'ajustes-row-val',
                    style: { color: 'var(--accent)', fontSize: '13px' }
                  },
                  'Actualizar'
                )
              : h('div', { className: 'ajustes-row-chev' }, '›')
          ),
          // Reinicio completo (limpia cache + SW) — fallback nuclear
          h(
            'button',
            {
              className: 'ajustes-row ajustes-row-tap',
              onClick: function () {
                haptic();
                if (
                  !window.confirm(
                    'Esto borrará el caché de la app y la recargará desde cero. ' +
                      'Tus turnos y configuración NO se pierden. ¿Continuar?'
                  )
                )
                  return;
                try {
                  if (window._mtHardReset) {
                    window._mtHardReset('Reiniciando app…');
                    return;
                  }
                } catch (_) {}
                window.location.reload();
              }
            },
            h('div', { className: 'ajustes-row-ico danger' }, '⟲'),
            h(
              'div',
              { className: 'ajustes-row-mid' },
              h('div', { className: 'ajustes-row-ttl' }, 'Reiniciar app'),
              h(
                'div',
                { className: 'ajustes-row-sub' },
                'Borra el caché y descarga todo desde cero (no pierde datos)'
              )
            ),
            h('div', { className: 'ajustes-row-chev' }, '›')
          )
        )
      );
    })(),

    // ══════ FOOTER ══════
    h(
      'div',
      { className: 'ajustes-footer' },
      h('div', { className: 'ajustes-footer-brand' }, 'Mi Turno'),
      h(
        'div',
        { className: 'ajustes-footer-sub' },
        'Colombia · Nómina inteligente · ' +
          (typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : '')
      )
    ),

    // Modal Gestionar cuenta
    showMgtAcct &&
      typeof ManageAccountModal !== 'undefined' &&
      h(ManageAccountModal, {
        session: session,
        onSessionPatch: props.onSessionPatch,
        onClose: function () {
          setShowMgtAcct(false);
        }
      }),

    // Modales admin
    showUsuarios &&
      typeof UsuariosModal !== 'undefined' &&
      h(UsuariosModal, {
        session: session,
        onClose: function () {
          setShowUsuarios(false);
        }
      }),

    showPins &&
      typeof AsignarPINsModal !== 'undefined' &&
      h(AsignarPINsModal, {
        session: session,
        onClose: function () {
          setShowPins(false);
        }
      }),

    showDiag &&
      typeof DiagnosticoModal !== 'undefined' &&
      h(DiagnosticoModal, {
        session: session,
        onClose: function () {
          setShowDiag(false);
        }
      }),

    showErrorViewer &&
      typeof ErrorViewerModal !== 'undefined' &&
      h(ErrorViewerModal, {
        session: session,
        onClose: function () {
          setShowErrorViewer(false);
        }
      })
  );
}
