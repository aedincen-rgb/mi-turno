// ═══════════════════════════════════════════════════════════════
// tabs/config.js · Ajustes (rediseño)
// ───────────────────────────────────────────────────────────────
// Sustituye la versión anterior. Mantiene la firma:
//   props = { salario, valorHora, session, onSalario, onSignOut,
//             theme, onThemeChange }
// Usa globales existentes: useState, h, haptic, fCOP, SMIN, RC,
// CLOUD_MODE, ManageAccountModal.
// ═══════════════════════════════════════════════════════════════

function ConfigTab(props){
  var salario = props.salario, vh = props.valorHora, session = props.session;

  var es = useState(false); var editSal = es[0], setEditSal = es[1];
  var st = useState('');    var tempSal = st[0], setTempSal = st[1];
  var gs = useState(false); var showMgtAcct = gs[0], setShowMgtAcct = gs[1];
  var rs = useState(false); var openRec = rs[0], setOpenRec = rs[1];

  function guardarSalario(){
    haptic();
    var v = parseFloat(tempSal) || SMIN;
    props.onSalario(v);
    setEditSal(false);
  }

  // Datos de identidad
  var isGuest = !session || session.guest;
  var emailMostrar = isGuest ? 'Modo invitado'
                   : (session.email || 'Usuario');
  var inicial = isGuest ? '?'
              : (session.email ? session.email[0].toUpperCase() : 'U');
  var estado = isGuest ? 'Datos en este dispositivo'
             : (typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE
                  ? 'Sincronizado en la nube'
                  : 'Datos locales');

  return h('div', {className:'fadeUp ajustes-wrap'},

    // ══════ HERO IDENTIDAD ══════
    h('div', {className:'ajustes-hero'},
      h('div', {className:'ajustes-hero-av'},
        h('div', {className:'ajustes-hero-av-glow'}),
        inicial
      ),
      h('div', {className:'ajustes-hero-nm'}, emailMostrar),
      h('div', {className:'ajustes-hero-est'},
        h('span', {className:'ajustes-hero-dot' + (isGuest ? ' off' : '')}),
        estado
      )
    ),

    // ══════ APARIENCIA ══════
    h('div', {className:'ajustes-section'},
      h('div', {className:'ajustes-section-ttl'}, 'Apariencia'),
      h('div', {className:'ajustes-list'},
        h('div', {className:'ajustes-row'},
          h('div', {className:'ajustes-row-ico'},
            props.theme === 'dark' ? '☾' : '☀'),
          h('div', {className:'ajustes-row-mid'},
            h('div', {className:'ajustes-row-ttl'},
              props.theme === 'dark' ? 'Modo oscuro' : 'Modo claro'),
            h('div', {className:'ajustes-row-sub'},
              'Cambia el aspecto de la app')
          ),
          h('label', {className:'ajustes-switch'},
            h('input', {
              type:'checkbox',
              checked: props.theme === 'dark',
              onChange: function(){
                haptic();
                props.onThemeChange(props.theme === 'dark' ? 'light' : 'dark');
              }
            }),
            h('span', {className:'ajustes-switch-track'})
          )
        )
      )
    ),

    // ══════ NÓMINA ══════
    h('div', {className:'ajustes-section'},
      h('div', {className:'ajustes-section-ttl'}, 'Nómina'),
      h('div', {className:'ajustes-list'},

        // Salario base (fila expandible inline)
        h('div', {className:'ajustes-row-group' + (editSal ? ' open' : '')},
          h('button', {
            className:'ajustes-row ajustes-row-tap',
            onClick: function(){
              if(editSal){
                setEditSal(false);
              } else {
                haptic();
                setTempSal(String(salario));
                setEditSal(true);
              }
            }
          },
            h('div', {className:'ajustes-row-ico'}, '$'),
            h('div', {className:'ajustes-row-mid'},
              h('div', {className:'ajustes-row-ttl'}, 'Salario base mensual'),
              h('div', {className:'ajustes-row-sub'}, fCOP(salario))
            ),
            h('div', {className:'ajustes-row-chev'},
              editSal ? '−' : '✎')
          ),
          editSal && h('div', {className:'ajustes-row-body'},
            h('div', {className:'ajustes-edit'},
              h('span', {className:'ajustes-edit-prefix'}, '$'),
              h('input', {
                type:'number',
                inputMode:'numeric',
                className:'ajustes-edit-input',
                value: tempSal,
                onChange: function(e){ setTempSal(e.target.value); },
                autoFocus: true,
                placeholder:'1.300.000'
              }),
              h('button', {
                className:'ajustes-edit-save',
                onClick: guardarSalario,
                'aria-label':'Guardar'
              }, '✓')
            ),
            h('p', {className:'ajustes-edit-hint'},
              'Se usa para calcular tu valor hora y todos los recargos.')
          )
        ),

        // Valor hora (read-only)
        h('div', {className:'ajustes-row ajustes-row-static'},
          h('div', {className:'ajustes-row-ico soft'}, '◷'),
          h('div', {className:'ajustes-row-mid'},
            h('div', {className:'ajustes-row-ttl'}, 'Valor hora base'),
            h('div', {className:'ajustes-row-sub'},
              'Se calcula automáticamente')
          ),
          h('div', {className:'ajustes-row-val'}, fCOP(vh))
        )

      )
    ),

    // ══════ CUENTA ══════
    h('div', {className:'ajustes-section'},
      h('div', {className:'ajustes-section-ttl'}, 'Cuenta'),
      h('div', {className:'ajustes-list'},
        h('button', {
          className:'ajustes-row ajustes-row-tap',
          onClick: function(){ haptic(); setShowMgtAcct(true); }
        },
          h('div', {className:'ajustes-row-ico'}, '⚙'),
          h('div', {className:'ajustes-row-mid'},
            h('div', {className:'ajustes-row-ttl'}, 'Gestionar cuenta'),
            h('div', {className:'ajustes-row-sub'},
              'PIN, correo y contraseña')
          ),
          h('div', {className:'ajustes-row-chev'}, '›')
        ),
        h('button', {
          className:'ajustes-row ajustes-row-tap danger',
          onClick: function(){ haptic(); props.onSignOut(); }
        },
          h('div', {className:'ajustes-row-ico danger'}, '↩'),
          h('div', {className:'ajustes-row-mid'},
            h('div', {className:'ajustes-row-ttl danger'}, 'Cerrar sesión'),
            h('div', {className:'ajustes-row-sub'},
              'Volverás a la pantalla de entrada')
          ),
          h('div', {className:'ajustes-row-chev'}, '›')
        )
      )
    ),

    // ══════ CÓMO SE CALCULA TU PAGO (acordeón con recargos) ══════
    h('div', {className:'ajustes-section'},
      h('div', {className:'ajustes-section-ttl'},
        'Cómo se calcula tu pago'),
      h('div', {className:'ajustes-list'},
        h('div', {className:'ajustes-row-group' + (openRec ? ' open' : '')},
          h('button', {
            className:'ajustes-row ajustes-row-tap',
            onClick: function(){ haptic(); setOpenRec(!openRec); }
          },
            h('div', {className:'ajustes-row-ico'}, '✦'),
            h('div', {className:'ajustes-row-mid'},
              h('div', {className:'ajustes-row-ttl'},
                'Tabla de recargos'),
              h('div', {className:'ajustes-row-sub'},
                'Ley 2101/2021 · Toca para ver')
            ),
            h('div', {className:'ajustes-row-chev'},
              openRec ? '−' : '+')
          ),
          openRec && h('div', {className:'ajustes-row-body'},
            h('div', {className:'ajustes-recargos'},
              Object.keys(RC).map(function(k){
                var r = RC[k];
                return h('div', {key:k, className:'ajustes-recargo'},
                  h('span', {
                    className:'ajustes-recargo-chip',
                    style:{ background:r.bg, border:'1px solid '+r.bd, color:r.color }
                  }, r.icon),
                  h('span', {className:'ajustes-recargo-lbl'}, r.label),
                  h('span', {
                    className:'ajustes-recargo-pct',
                    style:{ color:r.color }
                  }, '+' + Math.round((r.factor - 1) * 100) + '%')
                );
              })
            ),
            h('p', {className:'ajustes-legal'},
              'CST Arts. 168–171 · Calculados sobre el valor hora base.'
            )
          )
        )
      )
    ),

    // ══════ FOOTER ══════
    h('div', {className:'ajustes-footer'},
      h('div', {className:'ajustes-footer-brand'}, 'Mi Turno'),
      h('div', {className:'ajustes-footer-sub'},
        'Colombia · Nómina inteligente')
    ),

    // Modal Gestionar cuenta (mantiene tu lógica actual)
    showMgtAcct && typeof ManageAccountModal !== 'undefined'
      && h(ManageAccountModal, {
          session: session,
          onClose: function(){ setShowMgtAcct(false); }
        })

  );
}
