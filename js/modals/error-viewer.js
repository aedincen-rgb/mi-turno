// ════════════════════════════════════════════════════════════════
//  MI TURNO · modals/error-viewer.js
//  Modal para visualizar errores de runtime capturados
// ════════════════════════════════════════════════════════════════

function ErrorViewerModal(props) {
  var s1 = useState(getErrors());
  var errors = s1[0],
    setErrors = s1[1];
  var s2 = useState(null);
  var selectedError = s2[0],
    setSelectedError = s2[1];
  var s3 = useState(null);
  var sourceCode = s3[0],
    setSourceCode = s3[1];
  var s4 = useState(false);
  var loadingSource = s4[0],
    setLoadingSource = s4[1];
  var s5 = useState(null);
  var sourceError = s5[0],
    setSourceError = s5[1];
  var s6 = useState('');
  var devQuery = s6[0],
    setDevQuery = s6[1];
  var s7 = useState(null);
  var aiAdvice = s7[0],
    setAiAdvice = s7[1];

  var scrollRef = useRef(null);

  // Suscribirse a los cambios en el logger de errores
  useEffect(
    function () {
      function updateErrors(newErrors) {
        setErrors(newErrors);
        // Si el error seleccionado ya no existe, deseleccionarlo
        if (
          selectedError &&
          !newErrors.some(function (e) {
            return e.id === selectedError.id;
          })
        ) {
          setSelectedError(null);
          setSourceCode(null);
        }
      }
      addErrorListener(updateErrors);
      return function () {
        removeErrorListener(updateErrors);
      };
    },
    [selectedError]
  );

  // Cargar el código fuente cuando se selecciona un error
  useEffect(
    function () {
      if (
        !selectedError ||
        !selectedError.filename ||
        selectedError.filename === 'Promise Rejection' ||
        selectedError.filename === 'unknown'
      ) {
        setSourceCode(null);
        setSourceError(null);
        return;
      }

      setLoadingSource(true);
      setSourceError(null);
      setSourceCode(null);

      // Normalizar la URL del archivo
      var filename = selectedError.filename;
      // Eliminar el origen si es local para que fetch funcione correctamente
      if (filename.startsWith(window.location.origin)) {
        filename = filename.substring(window.location.origin.length);
      }
      // Asegurarse de que la ruta sea relativa y no absoluta si ya lo es
      if (filename.startsWith('/')) {
        filename = filename.substring(1);
      }

      fetch(filename)
        .then(function (response) {
          if (!response.ok) {
            throw new Error('No se pudo cargar el archivo: ' + response.statusText);
          }
          return response.text();
        })
        .then(function (text) {
          setSourceCode(text.split('\n'));
        })
        .catch(function (e) {
          setSourceError('Error al cargar el código fuente: ' + e.message);
        })
        .finally(function () {
          setLoadingSource(false);
        });
    },
    [selectedError]
  );

  // Scroll al error seleccionado en el código fuente
  useEffect(
    function () {
      if (sourceCode && selectedError && selectedError.lineno > 0 && scrollRef.current) {
        // Pequeño retraso para asegurar que el DOM se haya renderizado
        setTimeout(function () {
          var lineElement = scrollRef.current.querySelector('.code-line-' + selectedError.lineno);
          if (lineElement) {
            lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    },
    [sourceCode, selectedError]
  );

  function handleClearAll() {
    haptic();
    if (confirm('¿Estás seguro de que quieres borrar todos los logs de errores?')) {
      clearErrors();
      setSelectedError(null);
      setSourceCode(null);
      setSourceError(null);
    }
  }

  function handleSelectError(error) {
    haptic();
    setSelectedError(error);
  }

  function handleAskAI() {
    haptic();
    if (!devQuery.trim()) return;
    // Estado enriquecido para la IA
    var resp = aiAnswer(devQuery, {
      turnos: [],
      calc: { totalMins: 0, totalCOP: 0, bd: {} },
      online: navigator.onLine,
      lastError: selectedError,
      session: props.session
    });
    if (resp && typeof resp.then === 'function') {
      resp.then(function (asyncResp) {
        setAiAdvice(
          asyncResp && typeof asyncResp === 'object' ? asyncResp.text : String(asyncResp)
        );
      });
      setAiAdvice('Analizando...');
      return;
    }
    // Asegurar que la respuesta sea un string (por si devuelve un objeto de acción)
    setAiAdvice(typeof resp === 'object' ? resp.text : String(resp));
  }

  function handleCloseSource() {
    haptic();
    setSelectedError(null);
    setSourceCode(null);
    setSourceError(null);
  }

  return h(
    'div',
    { className: 'modal-card', style: { maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' } },
    h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
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
          h('span', { style: { fontSize: 22 } }, '🐞'),
          h('span', null, 'Consola de Desarrollo')
        ),
        h(
          'div',
          { style: { fontSize: 11.5, color: 'var(--muted)', marginTop: 2 } },
          'Diagnóstico técnico y sugerencias de código'
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

    // Nueva sección: Consultor de Código
    h(
      'div',
      {
        style: {
          background: 'var(--surface2)',
          padding: 12,
          borderRadius: 'var(--radius)',
          marginBottom: 20,
          border: '1px dashed var(--border)'
        }
      },
      h(
        'div',
        {
          style: {
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent)',
            marginBottom: 8,
            textTransform: 'uppercase'
          }
        },
        'Asistente de Arquitectura'
      ),
      h(
        'div',
        { style: { display: 'flex', gap: 8 } },
        h('input', {
          className: 'input',
          placeholder: 'Ej: ¿Donde cambio el emoji del inicio?',
          value: devQuery,
          onChange: function (e) {
            return setDevQuery(e.target.value);
          },
          onKeyDown: function (e) {
            return e.key === 'Enter' && handleAskAI();
          },
          style: { fontSize: 12 }
        }),
        h(
          'button',
          { className: 'btn btn-accent', onClick: handleAskAI, style: { padding: '0 12px' } },
          'Preguntar'
        )
      ),
      aiAdvice &&
        h(
          'div',
          {
            style: {
              marginTop: 10,
              fontSize: 11.5,
              color: 'var(--text)',
              whiteSpace: 'pre-wrap',
              background: 'var(--surface)',
              padding: 10,
              borderRadius: 'var(--radius-sm)',
              borderLeft: '3px solid var(--accent)'
            }
          },
          aiAdvice
        )
    ),

    selectedError
      ? h(
          'div',
          { className: 'error-detail-view' },
          h(
            'button',
            {
              className: 'btn btn-ghost',
              onClick: handleCloseSource,
              style: { marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }
            },
            '← Volver a la lista'
          ),
          h(
            'div',
            { style: { fontSize: 16, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 } },
            selectedError.message
          ),
          h(
            'div',
            { style: { fontSize: 11.5, color: 'var(--muted)', marginBottom: 12 } },
            'Tipo: ',
            selectedError.type,
            ' · ',
            new Date(selectedError.timestamp).toLocaleString('es-CO')
          ),
          h(
            'div',
            { style: { fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 } },
            'Ubicación:'
          ),
          h(
            'div',
            {
              style: {
                fontSize: 11,
                color: 'var(--muted)',
                fontFamily: 'monospace',
                marginBottom: 16,
                background: 'var(--surface2)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto'
              }
            },
            selectedError.filename,
            ':',
            selectedError.lineno,
            ':',
            selectedError.colno
          ),

          loadingSource
            ? h(
                'div',
                { style: { textAlign: 'center', padding: '20px 0', color: 'var(--muted)' } },
                h('span', { className: 'sp-in' }),
                h('div', { style: { marginTop: 8, fontSize: 12 } }, 'Cargando código fuente...')
              )
            : sourceError
              ? h(
                  'div',
                  {
                    style: {
                      padding: 12,
                      background: 'var(--danger-dim)',
                      color: 'var(--danger)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12.5
                    }
                  },
                  sourceError
                )
              : sourceCode
                ? h(
                    'div',
                    { className: 'code-viewer', ref: scrollRef },
                    h(
                      'pre',
                      null,
                      h(
                        'code',
                        null,
                        sourceCode.map(function (line, idx) {
                          var lineNumber = idx + 1;
                          var isErrorLine = lineNumber === selectedError.lineno;
                          return h(
                            'div',
                            {
                              key: idx,
                              className:
                                'code-line ' +
                                (isErrorLine
                                  ? 'code-line-error code-line-' + lineNumber
                                  : 'code-line-' + lineNumber),
                              style: {
                                background: isErrorLine ? 'var(--danger-dim)' : 'transparent',
                                borderLeft: isErrorLine
                                  ? '3px solid var(--danger)'
                                  : '3px solid transparent',
                                paddingLeft: isErrorLine ? '9px' : '12px',
                                display: 'flex',
                                alignItems: 'flex-start'
                              }
                            },
                            h(
                              'span',
                              {
                                style: {
                                  color: 'var(--muted)',
                                  width: '3em',
                                  flexShrink: 0,
                                  textAlign: 'right',
                                  marginRight: '1em',
                                  opacity: 0.7
                                }
                              },
                              lineNumber
                            ),
                            h(
                              'span',
                              {
                                style: {
                                  flexGrow: 1,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all'
                                }
                              },
                              line
                            )
                          );
                        })
                      )
                    )
                  )
                : h(
                    'div',
                    {
                      style: {
                        padding: 12,
                        background: 'var(--surface2)',
                        color: 'var(--muted)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12.5
                      }
                    },
                    'No se pudo cargar el código fuente o no es aplicable para este tipo de error.'
                  ),
          h(
            'div',
            {
              style: {
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                marginTop: 16,
                marginBottom: 6
              }
            },
            'Stack Trace:'
          ),
          h(
            'pre',
            {
              style: {
                fontSize: 10.5,
                color: 'var(--muted)',
                fontFamily: 'monospace',
                background: 'var(--surface2)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }
            },
            selectedError.stack
          )
        )
      : h(
          'div',
          null,
          errors.length === 0
            ? h(
                'div',
                { style: { textAlign: 'center', padding: '40px 0', color: 'var(--muted)' } },
                h('span', { style: { fontSize: 38, marginBottom: 10, display: 'block' } }, '✨'),
                h('div', { style: { fontSize: 14, fontWeight: 600 } }, '¡Todo limpio!'),
                h(
                  'div',
                  { style: { fontSize: 12, marginTop: 4 } },
                  'No se han detectado errores de runtime.'
                )
              )
            : h(
                'div',
                { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 } },
                errors.map(function (err) {
                  return h(
                    'div',
                    {
                      key: err.id,
                      onClick: function () {
                        handleSelectError(err);
                      },
                      style: {
                        padding: '12px 14px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 4,
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        position: 'relative'
                      }
                    },
                    h(
                      'button',
                      {
                        'aria-label': 'Eliminar error',
                        onClick: function (ev) {
                          ev.stopPropagation();
                          haptic();
                          if (typeof deleteError === 'function') deleteError(err.id);
                        },
                        style: {
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'var(--surface2)',
                          border: 'none',
                          color: 'var(--muted)',
                          fontSize: 15,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10
                        }
                      },
                      '×'
                    ),
                    h(
                      'div',
                      {
                        style: {
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--danger)',
                          paddingRight: 24
                        }
                      },
                      err.message
                    ),
                    h(
                      'div',
                      { style: { fontSize: 10.5, color: 'var(--muted)' } },
                      err.filename,
                      ':',
                      err.lineno
                    ),
                    h(
                      'div',
                      { style: { fontSize: 9.5, color: 'var(--muted)', opacity: 0.7 } },
                      new Date(err.timestamp).toLocaleString('es-CO')
                    )
                  );
                })
              ),
          errors.length > 0
            ? h(
                'button',
                {
                  className: 'btn btn-ghost btn-block',
                  onClick: handleClearAll,
                  style: { marginTop: 12, color: 'var(--danger)' }
                },
                '🗑 Borrar todos los logs'
              )
            : null
        )
  );
}
