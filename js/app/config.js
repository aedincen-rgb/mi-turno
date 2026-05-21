// ════════════════════════════════════════════════════════════════
//  MI TURNO · tabs/config.js
//  Pestaña Ajustes - Rediseño profesional iOS 18
// ════════════════════════════════════════════════════════════════
function ConfigTab(props) {
  var session = props.session;
  var isGuest = session.guest;

  // ── Foto de perfil local ──
  var uid = session.uid || 'anon';
  var fotoKey = 'mt_foto_' + uid;
  var fotoGuardada = leer(fotoKey, null);
  var fotoState = useState(fotoGuardada);
  var foto = fotoState[0], setFoto = fotoState[1];
  var fileInputRef = useRef(null);

  function onChangeFoto(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast && showToast('Máximo 5MB'); return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = 80; canvas.height = 80;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 80, 80);
        var base64 = canvas.toDataURL('image/jpeg', 0.6);
        grabar(fotoKey, base64);
        setFoto(base64);
        haptic();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function onClickAvatar() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  // ── Renderizado de iconos con colores vibrantes de Apple ──
  function ConfigIcon(glyph, bg) {
    return h('div', { className: 'config-icon-box', style: { background: bg } }, glyph);
  }

  return h('div', { className: 'config-list' },
    // ── SECCIÓN 1: PERFIL / ID DE APPLE STYLE ──
    h('div', { className: 'config-section' },
      h('div', { className: 'config-group' },
        h('div', { className: 'config-row', style: { padding: '16px', gap: '16px' } },
          h('div', {
            className: 'profile-avatar',
            onClick: onClickAvatar,
            style: {
              width: 62, height: 62, borderRadius: '50%',
              background: foto ? ('url(' + foto + ') center/cover no-repeat') : 'linear-gradient(145deg, var(--accent) 0%, #7da8ff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 28, fontWeight: 700,
              boxShadow: foto ? '0 0 0 2px var(--accent), 0 4px 15px rgba(91, 134, 229, 0.25)' : '0 4px 15px rgba(91, 134, 229, 0.25)',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'transform 0.2s ease'
            }
          }, foto ? null : (session.email || 'U').charAt(0).toUpperCase()),
          h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 } },
            h('div', { style: { fontSize: 21, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' } },
              isGuest ? 'Usuario Invitado' : (session.email.split('@')[0])
            ),
            h('div', { style: { fontSize: 13, color: 'var(--muted)', opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis' } },
              session.email
            ),
            h('div', {
              style: {
                fontSize: 10, color: session.cloud ? 'var(--accent)' : 'var(--muted)',
                fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 5
              }
            }, session.cloud ? '☁ Cuenta Sincronizada' : '🔒 Almacenamiento Local')
          ),
          h('span', { style: { color: 'var(--border)', fontSize: 22, fontWeight: 300 } }, '›'),
          h('input', {
            ref: fileInputRef,
            type: 'file',
            accept: 'image/*',
            style: { display: 'none' },
            onChange: onChangeFoto
          })
        )
      )
    ),

    // ── SECCIÓN 2: CONFIGURACIÓN LABORAL ──
    h('div', { className: 'config-section' },
      h('div', { className: 'config-header' }, 'Parámetros de Nómina'),
      h('div', { className: 'config-group' },
        h('div', { className: 'config-row' },
          ConfigIcon('💰', '#34c759'), // Verde Dinero
          h('div', { className: 'config-label' }, 'Salario Base'),
          h('input', {
            type: 'number',
            inputMode: 'numeric',
            className: 'config-input',
            value: props.salario,
            onChange: function (e) { props.onSalario(Number(e.target.value)); }
          })
        ),
        h('div', { className: 'config-row' },
          ConfigIcon('⏱', '#007aff'), // Azul Tiempo
          h('div', { className: 'config-label' }, 'Valor Hora'),
          h('div', { className: 'config-value' }, fCOP(props.valorHora))
        )
      )
    ),

    // ── SECCIÓN 3: PERSONALIZACIÓN ──
    h('div', { className: 'config-section' },
      h('div', { className: 'config-header' }, 'Interfaz'),
      h('div', { className: 'config-group' },
        h('div', {
          className: 'config-row',
          onClick: function () {
            haptic();
            props.onThemeChange(props.theme === 'dark' ? 'light' : 'dark');
          }
        },
          ConfigIcon(props.theme === 'dark' ? '🌙' : '☀️', '#5856d6'), // Indigo Visual
          h('div', { className: 'config-label' }, 'Modo Oscuro'),
          h('div', { className: 'config-value' },
            h('div', { className: 'switch ' + (props.theme === 'dark' ? 'on' : '') })
          )
        )
      )
    ),

    // ── SECCIÓN 4: SOPORTE Y LEGAL ──
    h('div', { className: 'config-section' },
      h('div', { className: 'config-header' }, 'Información y Ayuda'),
      h('div', { className: 'config-group' },
        h('div', { className: 'config-row' },
          ConfigIcon('⚖️', '#8e8e93'), // Gris Legal
          h('div', { className: 'config-label' }, 'Legislación Laboral (Ley 2101)'),
          h('span', { style: { color: 'var(--border)', fontSize: 22 } }, '›')
        ),
        h('div', { className: 'config-row' },
          ConfigIcon('🛠', '#ff9500'), // Naranja Soporte
          h('div', { className: 'config-label' }, 'Diagnóstico de sincronización'),
          h('span', { style: { color: 'var(--border)', fontSize: 22 } }, '›')
        )
      )
    ),

    // ── SECCIÓN 5: ACCIONES DE SESIÓN ──
    h('div', { className: 'config-section' },
      h('div', { className: 'config-group' },
        h('button', {
          className: 'config-row',
          style: { border: 'none' },
          onClick: function () {
            if (confirm('¿Seguro que quieres cerrar la sesión actual?')) props.onSignOut();
          }
        },
          h('div', { className: 'config-label', style: { color: '#ff3b30', textAlign: 'center', fontWeight: 600, flex: 1 } }, 'Cerrar sesión')
        )
      )
    ),

    h('div', { style: { textAlign: 'center', padding: '10px 0 40px', fontSize: 12, color: 'var(--muted)', opacity: 0.7 } },
      'Mi Turno v2.5.0 · Pereira, Colombia'
    )
  );
}