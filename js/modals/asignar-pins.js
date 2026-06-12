// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/asignar-pins.js
//  Modal asignar PINs admin
// ════════════════════════════════════════════════════════════════
function AsignarPINsModal(props) {
  var us = useState([]);
  var users = us[0],
    setUsers = us[1];
  var ld = useState(true);
  var loading = ld[0],
    setLoading = ld[1];
  var er = useState(null);
  var error = er[0],
    setError = er[1];
  var qs = useState('');
  var query = qs[0],
    setQuery = qs[1];
  var fb = useState(null);
  var feedback = fb[0],
    setFeedback = fb[1];
  var ed = useState(null);
  var editing = ed[0],
    setEditing = ed[1];
  var nv = useState('');
  var newPin = nv[0],
    setNewPin = nv[1];
  var bs = useState(false);
  var busy = bs[0],
    setBusy = bs[1];
  var cf = useState(null);
  var confirmDel = cf[0],
    setConfirmDel = cf[1];

  function fmtFecha(s) {
    if (!s) return '—';
    try {
      var d = new Date(s);
      return (
        d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) +
        ' · ' +
        d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (e) {
      return '—';
    }
  }

  function cargar() {
    if (!CLOUD_MODE || !SUPA) {
      setError('Sin conexión a la nube');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    withTimeout(SUPA.rpc('get_all_pin_lookup'), IS_IOS_SAFARI ? 15000 : 8000, 'Cargar usuarios')
      .then(function (res) {
        if (res && res.error) throw res.error;
        setUsers(res.data || []);
        setLoading(false);
      })
      .catch(function (e) {
        setError(traducirError(e) || 'Error al cargar usuarios');
        setLoading(false);
      });
  }

  useEffect(function () {
    cargar();
  }, []);

  function generarRandom() {
    var ocupados = {};
    users.forEach(function (u) {
      if (u.pin) ocupados[String(u.pin)] = true;
    });
    ocupados['9999'] = true;
    for (var i = 0; i < 100; i++) {
      var p = String(Math.floor(1000 + Math.random() * 9000));
      if (!ocupados[p]) return p;
    }
    return null;
  }

  function regenerarPIN(user) {
    var nuevo = generarRandom();
    if (!nuevo) {
      setFeedback({ type: 'err', msg: 'No hay PINs disponibles' });
      return;
    }
    aplicarPIN(user, nuevo, 'PIN regenerado a ' + nuevo);
  }

  function aplicarPIN(user, pin, msgOk) {
    setBusy(true);
    setFeedback(null);
    SUPA.rpc('admin_upsert_pin_lookup', {
      p_user_id: user.user_id,
      p_user_email: user.user_email,
      p_pin: String(pin),
      p_updated_at: new Date().toISOString()
    })
      .then(function (res) {
        if (res && res.error) throw res.error;
        setFeedback({ type: 'ok', msg: msgOk || '✓ PIN actualizado' });
        setEditing(null);
        setNewPin('');
        setConfirmDel(null);
        cargar();
        setTimeout(function () {
          setFeedback(null);
        }, 2500);
      })
      .catch(function (e) {
        setFeedback({ type: 'err', msg: traducirError(e) || 'Error al actualizar' });
      })
      .finally(function () {
        setBusy(false);
      });
  }

  function eliminarPIN(user) {
    setBusy(true);
    setFeedback(null);
    SUPA.rpc('admin_delete_pin_lookup', { p_user_id: user.user_id })
      .then(function (res) {
        if (res && res.error) throw res.error;
        setFeedback({ type: 'ok', msg: '✓ PIN eliminado de ' + user.user_email });
        setConfirmDel(null);
        cargar();
        setTimeout(function () {
          setFeedback(null);
        }, 2500);
      })
      .catch(function (e) {
        setFeedback({ type: 'err', msg: traducirError(e) || 'Error al eliminar' });
      })
      .finally(function () {
        setBusy(false);
      });
  }

  function copiarPIN(pin) {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(String(pin));
      }
      haptic();
      setFeedback({ type: 'ok', msg: '✓ PIN ' + pin + ' copiado' });
      setTimeout(function () {
        setFeedback(null);
      }, 1800);
    } catch (e) {}
  }

  function guardarPINManual() {
    if (!/^\d{4}$/.test(newPin)) {
      setFeedback({ type: 'err', msg: 'PIN debe tener 4 dígitos' });
      return;
    }
    if (newPin === '9999' && editing.user_email !== 'admin@miturno.com') {
      setFeedback({ type: 'err', msg: 'PIN 9999 reservado para admin' });
      return;
    }
    var duplicado = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].pin === newPin && users[i].user_id !== editing.user_id) {
        duplicado = users[i];
        break;
      }
    }
    if (duplicado) {
      setFeedback({ type: 'err', msg: 'PIN ' + newPin + ' ya usado por ' + duplicado.user_email });
      return;
    }
    aplicarPIN(editing, newPin, '✓ PIN actualizado a ' + newPin);
  }

  var q = query.trim().toLowerCase();
  var filtered = users.filter(function (u) {
    if (!q) return true;
    return (
      (u.user_email || '').toLowerCase().indexOf(q) >= 0 || String(u.pin || '').indexOf(q) >= 0
    );
  });

  var stats = {
    total: users.length,
    conPin: users.filter(function (u) {
      return u.pin;
    }).length,
    disponibles: 9000 - users.length
  };

  return h(
    'div',
    { className: 'modal-card', style: { maxHeight: '85vh', overflowY: 'auto', maxWidth: 520 } },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6
        }
      },
      h(
        'div',
        null,
        h(
          'div',
          {
            style: {
              fontSize: 19,
              fontWeight: 800,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }
          },
          h('span', { style: { fontSize: 22 } }, '🔑'),
          h('span', null, 'Asignar PINs')
        ),
        h(
          'div',
          { style: { fontSize: 11.5, color: 'var(--muted)', marginTop: 2 } },
          'Panel administrativo'
        )
      ),
      h(
        'button',
        {
          onClick: function () {
            haptic();
            props.onClose();
          },
          style: {
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px 8px',
            lineHeight: 1
          }
        },
        '×'
      )
    ),

    h(
      'div',
      {
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginBottom: 14,
          marginTop: 12
        }
      },
      h(
        'div',
        {
          style: {
            background: 'var(--surface2)',
            padding: '12px 8px',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }
        },
        h(
          'div',
          { style: { fontSize: 22, fontWeight: 900, color: 'var(--accent)', lineHeight: 1 } },
          stats.conPin
        ),
        h(
          'div',
          {
            style: {
              fontSize: 10,
              color: 'var(--muted)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700
            }
          },
          'Asignados'
        )
      ),
      h(
        'div',
        {
          style: {
            background: 'var(--surface2)',
            padding: '12px 8px',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }
        },
        h(
          'div',
          {
            style: { fontSize: 22, fontWeight: 900, color: 'var(--success,#10b981)', lineHeight: 1 }
          },
          stats.disponibles > 0 ? stats.disponibles : '∞'
        ),
        h(
          'div',
          {
            style: {
              fontSize: 10,
              color: 'var(--muted)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700
            }
          },
          'Disponibles'
        )
      ),
      h(
        'div',
        {
          style: {
            background: 'var(--surface2)',
            padding: '12px 8px',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }
        },
        h(
          'div',
          { style: { fontSize: 22, fontWeight: 900, color: 'var(--text)', lineHeight: 1 } },
          stats.total
        ),
        h(
          'div',
          {
            style: {
              fontSize: 10,
              color: 'var(--muted)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700
            }
          },
          'Usuarios'
        )
      )
    ),

    h(
      'div',
      { style: { position: 'relative', marginBottom: 12 } },
      h('input', {
        type: 'text',
        className: 'inp',
        placeholder: '🔍 Buscar por correo o PIN...',
        value: query,
        onChange: function (e) {
          setQuery(e.target.value);
        },
        style: { paddingLeft: 14 }
      })
    ),

    feedback
      ? h(
          'div',
          {
            style: {
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 12,
              fontSize: 13,
              fontWeight: 600,
              background:
                feedback.type === 'ok'
                  ? 'var(--success-dim,rgba(16,185,129,0.12))'
                  : 'var(--danger-dim)',
              color: feedback.type === 'ok' ? 'var(--success,#10b981)' : 'var(--danger)',
              border:
                '1px solid ' + (feedback.type === 'ok' ? 'var(--success,#10b981)' : 'var(--danger)')
            }
          },
          feedback.msg
        )
      : null,

    confirmDel
      ? h(
          'div',
          {
            style: {
              padding: 14,
              borderRadius: 'var(--radius)',
              marginBottom: 12,
              background: 'var(--danger-dim)',
              border: '2px solid var(--danger)'
            }
          },
          h(
            'div',
            { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--danger)', marginBottom: 6 } },
            '⚠ ¿Eliminar PIN?'
          ),
          h(
            'div',
            { style: { fontSize: 12, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 } },
            'Se eliminará el PIN ',
            h('strong', null, confirmDel.user.pin),
            ' de ',
            h('strong', null, confirmDel.user.user_email),
            '.'
          ),
          h(
            'div',
            { style: { display: 'flex', gap: 8 } },
            h(
              'button',
              {
                onClick: function () {
                  eliminarPIN(confirmDel.user);
                },
                disabled: busy,
                style: {
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--danger)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }
              },
              busy ? 'Eliminando...' : 'Sí, eliminar'
            ),
            h(
              'button',
              {
                onClick: function () {
                  setConfirmDel(null);
                },
                style: {
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }
              },
              'Cancelar'
            )
          )
        )
      : null,

    editing
      ? h(
          'div',
          {
            style: {
              padding: 14,
              borderRadius: 'var(--radius)',
              marginBottom: 12,
              background: 'var(--surface2)',
              border: '2px solid var(--accent)'
            }
          },
          h(
            'div',
            { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 } },
            '✏ Asignar PIN manual'
          ),
          h(
            'div',
            { style: { fontSize: 11.5, color: 'var(--muted)', marginBottom: 10 } },
            'Usuario: ',
            h('strong', null, editing.user_email)
          ),
          h('input', {
            type: 'tel',
            inputMode: 'numeric',
            maxLength: 4,
            className: 'inp',
            placeholder: '0000',
            value: newPin,
            autoFocus: true,
            onChange: function (e) {
              setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
            },
            onKeyDown: function (e) {
              if (e.key === 'Enter') guardarPINManual();
            },
            style: {
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '8px',
              fontFamily: 'ui-monospace,monospace'
            }
          }),
          h(
            'div',
            { style: { display: 'flex', gap: 8, marginTop: 10 } },
            h(
              'button',
              {
                onClick: guardarPINManual,
                disabled: busy || newPin.length !== 4,
                style: {
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12.5,
                  cursor: newPin.length === 4 ? 'pointer' : 'not-allowed',
                  opacity: newPin.length === 4 ? 1 : 0.5
                }
              },
              busy ? 'Guardando...' : '✓ Asignar PIN'
            ),
            h(
              'button',
              {
                onClick: function () {
                  setEditing(null);
                  setNewPin('');
                },
                style: {
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text)',
                  fontWeight: 600,
                  fontSize: 12.5,
                  cursor: 'pointer'
                }
              },
              'Cancelar'
            )
          )
        )
      : null,

    loading
      ? h(
          'div',
          { style: { textAlign: 'center', padding: '40px 0', color: 'var(--muted)' } },
          h('span', { className: 'sp-in' }),
          h('div', { style: { marginTop: 8, fontSize: 12 } }, 'Cargando usuarios...')
        )
      : error
        ? h(
            'div',
            {
              style: {
                padding: 20,
                textAlign: 'center',
                color: 'var(--danger)',
                background: 'var(--danger-dim)',
                borderRadius: 'var(--radius)'
              }
            },
            error
          )
        : filtered.length === 0
          ? h(
              'div',
              {
                style: {
                  padding: '30px 20px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: 13
                }
              },
              query ? 'Sin resultados para "' + query + '"' : 'No hay usuarios con PIN registrado.'
            )
          : h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              filtered.map(function (u) {
                var esAdmin = u.pin === '9999' || u.user_email === 'admin@miturno.com';
                var inicial = (u.user_email || '?')[0].toUpperCase();
                return h(
                  'div',
                  {
                    key: u.user_id,
                    style: {
                      padding: 12,
                      background: esAdmin
                        ? 'linear-gradient(135deg, var(--accent-dim) 0%, var(--surface) 100%)'
                        : 'var(--surface)',
                      border: '1px solid ' + (esAdmin ? 'var(--accent)' : 'var(--border)'),
                      borderRadius: 'var(--radius)',
                      transition: 'all 0.2s'
                    }
                  },
                  h(
                    'div',
                    { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } },
                    h(
                      'div',
                      {
                        style: {
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: esAdmin ? 'var(--accent)' : 'var(--surface2)',
                          color: esAdmin ? '#fff' : 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          fontWeight: 800,
                          flexShrink: 0,
                          border: '2px solid ' + (esAdmin ? 'var(--accent)' : 'var(--border)')
                        }
                      },
                      esAdmin ? '🔓' : inicial
                    ),
                    h(
                      'div',
                      { style: { minWidth: 0, flex: 1 } },
                      h(
                        'div',
                        {
                          style: {
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        },
                        u.user_email || 'sin correo',
                        esAdmin
                          ? h(
                              'span',
                              {
                                style: {
                                  marginLeft: 6,
                                  fontSize: 9,
                                  fontWeight: 800,
                                  background: 'var(--accent)',
                                  color: '#fff',
                                  padding: '2px 5px',
                                  borderRadius: 3,
                                  letterSpacing: '0.5px'
                                }
                              },
                              'ADMIN'
                            )
                          : null
                      ),
                      h(
                        'div',
                        { style: { fontSize: 10.5, color: 'var(--muted)', marginTop: 2 } },
                        fmtFecha(u.updated_at)
                      )
                    ),
                    h(
                      'button',
                      {
                        onClick: function () {
                          copiarPIN(u.pin);
                        },
                        title: 'Copiar PIN',
                        style: {
                          background: esAdmin ? 'rgba(255,255,255,0.15)' : 'var(--surface2)',
                          border: '1px solid ' + (esAdmin ? 'var(--accent)' : 'var(--border)'),
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 18,
                          fontWeight: 900,
                          color: esAdmin ? 'var(--accent)' : 'var(--text)',
                          fontFamily: 'ui-monospace,monospace',
                          letterSpacing: '2px',
                          cursor: 'pointer',
                          flexShrink: 0
                        }
                      },
                      u.pin || '----'
                    )
                  ),
                  h(
                    'div',
                    { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 } },
                    h(
                      'button',
                      {
                        onClick: function () {
                          setEditing(u);
                          setNewPin('');
                          setFeedback(null);
                        },
                        disabled: busy || esAdmin,
                        style: {
                          padding: '7px 4px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          color: esAdmin ? 'var(--muted)' : 'var(--text)',
                          cursor: esAdmin ? 'not-allowed' : 'pointer',
                          opacity: esAdmin ? 0.4 : 1
                        }
                      },
                      '✏ Editar'
                    ),
                    h(
                      'button',
                      {
                        onClick: function () {
                          regenerarPIN(u);
                        },
                        disabled: busy || esAdmin,
                        style: {
                          padding: '7px 4px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--accent)',
                          borderRadius: 'var(--radius-sm)',
                          color: esAdmin ? 'var(--muted)' : 'var(--accent)',
                          cursor: esAdmin ? 'not-allowed' : 'pointer',
                          opacity: esAdmin ? 0.4 : 1
                        }
                      },
                      '🔄 Nuevo'
                    ),
                    h(
                      'button',
                      {
                        onClick: function () {
                          haptic();
                          enviarPINPorEmail({ to: u.user_email, pin: u.pin })
                            .then(function (r) {
                              setFeedback({
                                type: 'ok',
                                msg: r.message || '✓ PIN enviado a ' + u.user_email
                              });
                              setTimeout(function () {
                                setFeedback(null);
                              }, 3000);
                            })
                            .catch(function (e) {
                              setFeedback({ type: 'err', msg: e.message || 'Error al enviar' });
                            });
                        },
                        disabled: busy || !u.pin || !CLOUD_MODE,
                        style: {
                          padding: '7px 4px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--accent)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--accent)',
                          cursor: u.pin && CLOUD_MODE ? 'pointer' : 'not-allowed',
                          opacity: u.pin && CLOUD_MODE ? 1 : 0.4
                        }
                      },
                      '📧 Enviar'
                    ),
                    h(
                      'button',
                      {
                        onClick: function () {
                          setConfirmDel({ user: u });
                          setFeedback(null);
                        },
                        disabled: busy || esAdmin,
                        style: {
                          padding: '7px 4px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--danger)',
                          borderRadius: 'var(--radius-sm)',
                          color: esAdmin ? 'var(--muted)' : 'var(--danger)',
                          cursor: esAdmin ? 'not-allowed' : 'pointer',
                          opacity: esAdmin ? 0.4 : 1
                        }
                      },
                      '🗑 Borrar'
                    )
                  )
                );
              })
            ),

    h(
      'div',
      {
        style: {
          marginTop: 14,
          padding: '10px 12px',
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 11,
          color: 'var(--muted)',
          lineHeight: 1.5
        }
      },
      h('strong', null, '💡 Tip: '),
      'PIN 9999 reservado para admin.'
    ),

    h(
      'button',
      {
        className: 'btn btn-ghost btn-block',
        onClick: function () {
          haptic();
          props.onClose();
        },
        style: { marginTop: 12 }
      },
      'Cerrar'
    )
  );
}
