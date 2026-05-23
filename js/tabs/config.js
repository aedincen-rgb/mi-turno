// ═══════════════════════════════════════════════════════════════
// tabs/config.js · Ajustes (rediseño)
// ───────────────────────────────────────────────────────────────
// Sustituye la versión anterior. Mantiene la firma:
//   props = { salario, valorHora, session, onSalario, onSignOut,
//             theme, onThemeChange }
// Usa globales existentes: useState, h, haptic, fCOP, SMIN, RC,
// CLOUD_MODE, ManageAccountModal.
// ═══════════════════════════════════════════════════════════════

function ConfigTab(props) {
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

  var prefs = props.prefs || (typeof QUINCENA_PREFS_DEFAULT !== 'undefined' ? QUINCENA_PREFS_DEFAULT : { auxTransp: false, prestaciones: false, quincenaMode: false, q1Day: 1, q2Day: 16 });
  function patchPrefs(p) {
    if (props.onPrefsChange) props.onPrefsChange(p);
  }

  function guardarSalario() {
    haptic();
    var v = parseFloat(tempSal) || SMIN;
    props.onSalario(v);
    setEditSal(false);
  }

  // Datos de identidad
  var isGuest = !session || session.guest;
  var emailMostrar = isGuest ? 'Modo invitado' : session.email || 'Usuario';
  var inicial = isGuest ? '?' : session.email ? session.email[0].toUpperCase() : 'U';
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
      h(
        'div',
        { className: 'ajustes-hero-av' },
        h('div', { className: 'ajustes-hero-av-glow' }),
        inicial
      ),
      h('div', { className: 'ajustes-hero-nm' }, emailMostrar),
      h(
        'div',
        { className: 'ajustes-hero-est' },
        h('span', { className: 'ajustes-hero-dot' + (isGuest ? ' off' : '') }),
        estado
      )
    ),

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
                  type: 'number',
                  inputMode: 'numeric',
                  className: 'ajustes-edit-input',
                  value: tempSal,
                  onChange: function (e) {
                    setTempSal(e.target.value);
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
              'Suma ' + fCOP(AUX_TRANSPORTE_2026) + ' al estimado (fijo 2026)'
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
              'Cesantías, prima y vacaciones (~' + Math.round(PRESTACIONES_PCT * 100) + '% del salario)'
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
                      min: 1,
                      max: 28,
                      className: 'ajustes-edit-input',
                      value: prefs.q1Day,
                      onChange: function (e) {
                        var v = parseInt(e.target.value, 10);
                        if (!isNaN(v)) patchPrefs({ q1Day: v });
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
                      min: 2,
                      max: 28,
                      className: 'ajustes-edit-input',
                      value: prefs.q2Day,
                      onChange: function (e) {
                        var v = parseInt(e.target.value, 10);
                        if (!isNaN(v)) patchPrefs({ q2Day: v });
                      }
                    })
                  )
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
    h(
      'div',
      { className: 'ajustes-section' },
      h('div', { className: 'ajustes-section-ttl' }, 'Acerca de'),
      h(
        'div',
        { className: 'ajustes-list' },
        h(
          'div',
          { className: 'ajustes-row ajustes-row-static' },
          h('div', { className: 'ajustes-row-ico soft' }, 'ⓘ'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Versión instalada'),
            h(
              'div',
              { className: 'ajustes-row-sub' },
              typeof MT_APP_VERSION !== 'undefined' ? MT_APP_VERSION : 'desconocida'
            )
          ),
          h('div', { className: 'ajustes-row-val' }, 'PWA')
        ),
        h(
          'button',
          {
            className: 'ajustes-row ajustes-row-tap',
            onClick: function () {
              haptic();
              try {
                if (window._mtCheckUpdate) {
                  window._mtCheckUpdate(true);
                } else {
                  window.location.reload();
                }
              } catch (_) {
                window.location.reload();
              }
            }
          },
          h('div', { className: 'ajustes-row-ico' }, '⟳'),
          h(
            'div',
            { className: 'ajustes-row-mid' },
            h('div', { className: 'ajustes-row-ttl' }, 'Buscar actualización'),
            h(
              'div',
              { className: 'ajustes-row-sub' },
              'Forzar revisión inmediata de nueva versión'
            )
          ),
          h('div', { className: 'ajustes-row-chev' }, '›')
        )
      )
    ),

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
