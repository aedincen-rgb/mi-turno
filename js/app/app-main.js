// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/app-main.js
//  Componente principal App con tabs y lógica de sincronización
//  Componente principal App con tabs
// ════════════════════════════════════════════════════════════════

function App(props) {
  var session = props.session;
  var onSessionPatch = props.onSessionPatch;
  var uid = session.uid;
  var isCloud = !session.pinOnly && !session.guest && CLOUD_MODE;
  var loadedRef = useRef(false);

  var th = useState(leer('mt_theme', 'light'));
  var theme = th[0],
    setTheme = th[1];
  useEffect(
    function () {
      document.documentElement.setAttribute('data-theme', theme);
      grabar('mt_theme', theme);
      var m = document.getElementById('metaThemeColor');
      if (m) m.setAttribute('content', theme === 'dark' ? '#0a0c12' : '#f5f7fb');
    },
    [theme]
  );

  var s1 = useState([]);
  var turnos = s1[0],
    setTurnos = s1[1];
  var s2 = useState(null);
  var activo = s2[0],
    setActivo = s2[1];
  var s3 = useState(SMIN);
  var salario = s3[0],
    setSalario = s3[1];
  // Flag explícito: el usuario confirmó su salario en Ajustes al menos una vez
  var sc = useState(false);
  var salarioConfigured = sc[0],
    setSalarioConfigured = sc[1];
  var s4 = useState(Date.now());
  var ahora = s4[0],
    setAhora = s4[1];
  var s6 = useState('home');
  var tab = s6[0],
    setTab = s6[1];
  var s7 = useState(false);
  var showOlv = s7[0],
    setShowOlv = s7[1];
  var s9 = useState(true);
  var loading = s9[0],
    setLoading = s9[1];
  var sx = useState(false);
  var splashExit = sx[0],
    setSplashExit = sx[1];
  var s10 = useState(null);
  var toast = s10[0],
    setToast = s10[1];
  var pss = useState(false);
  var showPinSetup = pss[0],
    setShowPinSetup = pss[1];

  // Preferencias avanzadas (auxilio, prestaciones, quincena manual)
  var pf = useState(normalizePrefs(null));
  var prefs = pf[0],
    setPrefs = pf[1];

  // Detección de estado de internet
  var on = useState(isOnline());
  var isOnlineStatus = on[0], setIsOnline = on[1];

  useEffect(function () {
    function updateNet() { setIsOnline(navigator.onLine); }
    window.addEventListener('online', updateNet);
    window.addEventListener('offline', updateNet);
    return function () {
      window.removeEventListener('online', updateNet);
      window.removeEventListener('offline', updateNet);
    };
  }, []);

  // Efecto para procesar la cola de sincronización cuando el estado online cambia
  useEffect(function () {
    if (isOnlineStatus && uid) {
      processQueue(uid);
    }
    // Suscribirse a cambios de estado online para reintentar la cola
    onOnline(function () { processQueue(uid); });
    return function () { removeOnlineListener(function () { processQueue(uid); }); }; // Limpiar listener
  }, [isOnlineStatus, uid]);


  var cp = useState(false);
  var compact = cp[0],
    setCompact = cp[1];

  var scrRef = useRef(null);

  useEffect(function () {
    var el = scrRef.current;
    if (!el) return;
    function handleScroll() {
      var shouldBeCompact = el.scrollTop > 20;
      if (shouldBeCompact !== compact) setCompact(shouldBeCompact);
    }
    el.addEventListener('scroll', handleScroll, { passive: true });
    return function () {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [compact]);

  var toastRef = useRef(null);
  function showToast(m) {
    setToast(m);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(function () {
      setToast(null);
    }, 2400);
  }

  useEffect(function () {
    var rafId = null;
    var lastTick = 0;
    var visible = true;
    function loop(ts) {
      if (!visible) {
        return;
      }
      if (ts - lastTick >= 500) {
        lastTick = ts;
        setAhora(Date.now());
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
    function onVis() {
      visible = document.visibilityState === 'visible';
      if (visible) {
        setAhora(Date.now());
        if (!rafId) rafId = requestAnimationFrame(loop);
      }
    }
    document.addEventListener('visibilitychange', onVis, { passive: true });
    return function () {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(
    function () {
      var cancelled = false;
      loadedRef.current = false;
      setLoading(true);
      var splashStart = Date.now();
      cargarDatos(uid, session.pinOnly)
        .then(function (data) {
          if (cancelled) return;
          if (!data || !data.turnos) {
            data = { turnos: [], activo: null, salario: SMIN };
          }
          setTurnos(data.turnos || []);
          setActivo(data.activo || null);
          var salCarga = data.salario || SMIN;
          setSalario(salCarga);
          // Migración: usuarios anteriores a v24 sin flag explícito.
          // Si tienen salario por encima del mínimo legal, asumimos que
          // lo configuraron y marcamos el flag para que no les aparezca
          // el banner de "Ajustá tu salario".
          var savedFlag = leer(dk(uid, 'sc'), null);
          var inferred = savedFlag === true || (savedFlag === null && salCarga > SMIN);
          setSalarioConfigured(inferred);
          setPrefs(normalizePrefs(leer(dk(uid, 'prefs'), null)));
          // Exponer estado global para el Mood Bar
          window.__miTurnoState = {
            turnos: data.turnos || [],
            calc: calc,
            salario: data.salario || SMIN,
            vh: (data.salario || SMIN) / 240,
            session: session
          };
          loadedRef.current = true;
          function finishSplash() {
            if (cancelled) return;
            setSplashExit(true);
            setTimeout(function () {
              if (!cancelled) {
                setLoading(false);
                var hasPin =
                  leer('mt_pin_' + uid, null) || leer('mt_pin_app_' + uid, null) || session.pin;
                var isRealCloudUser =
                  !session.pinOnly && !session.guest && CLOUD_MODE && !!session.email;
                if (isRealCloudUser && !hasPin) {
                  setShowPinSetup(true);
                }
              }
            }, 330);
          }
          if (props.introPlayed) {
            finishSplash();
          } else {
            setTimeout(function () {
              if (!cancelled) {
                var elapsed = Date.now() - splashStart;
                setTimeout(finishSplash, Math.max(0, 1080 - elapsed));
              }
            }, 350);
          }
        })
        .catch(function (e) {
          if (!cancelled) {
            setTurnos([]);
            setActivo(null);
            setSalario(SMIN);
            loadedRef.current = true;
            setSplashExit(true);
            setTimeout(function () {
              if (!cancelled) setLoading(false);
            }, 330);
          }
        });
      return function () {
        cancelled = true;
      };
    },
    [uid, session.pinOnly]
  );

  useEffect(
    function () {
      if (!loadedRef.current) return;
      grabar(dk(uid, 't'), turnos);
    },
    [turnos, uid]
  );
  useEffect(
    function () {
      if (!loadedRef.current) return;
      if (activo === null) borrarKey(dk(uid, 'a'));
      else grabar(dk(uid, 'a'), activo);
    },
    [activo, uid]
  );
  useEffect(
    function () {
      if (!loadedRef.current) return;
      grabar(dk(uid, 's'), salario);
    },
    [salario, uid]
  );
  useEffect(
    function () {
      if (!loadedRef.current) return;
      grabar(dk(uid, 'sc'), salarioConfigured);
    },
    [salarioConfigured, uid]
  );
  useEffect(
    function () {
      if (!loadedRef.current) return;
      grabar(dk(uid, 'prefs'), prefs);
    },
    [prefs, uid]
  );

  function onPrefsChange(patch) {
    setPrefs(function (p) {
      return normalizePrefs(Object.assign({}, p, patch));
    });
  }

  var activoRef = useRef(activo);
  activoRef.current = activo;
  var showOlvRef = useRef(showOlv);
  showOlvRef.current = showOlv;
  // Ref para recordar qué turno ya fue notificado, así si el usuario
  // descarta con "Sigue activo" no se vuelve a mostrar el modal para el mismo turno
  var notificadoRef = useRef(null);

  useEffect(
    function () {
      var to = null;
      function schedule() {
        if (!activoRef.current || showOlvRef.current) {
          return;
        }
        // Si ya notificamos para este turno (mismo ID), no insistir
        if (notificadoRef.current === activoRef.current.id) {
          return;
        }
        var inicio = new Date(activoRef.current.inicio).getTime();
        var elapsed = Date.now() - inicio;
        if (elapsed >= U12H) {
          notificadoRef.current = activoRef.current.id;
          setShowOlv(true);
          return;
        }
        var remaining = U12H - elapsed;
        to = setTimeout(function () {
          if (activoRef.current && !showOlvRef.current) {
            if (notificadoRef.current !== activoRef.current.id) {
              notificadoRef.current = activoRef.current.id;
              setShowOlv(true);
            }
          }
        }, remaining);
      }
      schedule();
      function onVis() {
        if (document.visibilityState === 'visible') {
          if (to) {
            clearTimeout(to);
            to = null;
          }
          schedule();
        }
      }
      document.addEventListener('visibilitychange', onVis, { passive: true });
      return function () {
        if (to) clearTimeout(to);
        document.removeEventListener('visibilitychange', onVis);
      };
    },
    [activo]
  );

  useEffect(function () {
    if (!navigator.getBattery) return;
    var bat = null;
    function applyState() {
      if (!bat) return;
      var lowPower = bat.level < 0.2 && !bat.charging;
      document.documentElement.classList.toggle('low-power', lowPower);
    }
    navigator
      .getBattery()
      .then(function (b) {
        bat = b;
        applyState();
        bat.addEventListener('levelchange', applyState);
        bat.addEventListener('chargingchange', applyState);
      })
      .catch(function () { });
    return function () {
      if (bat) {
        bat.removeEventListener('levelchange', applyState);
        bat.removeEventListener('chargingchange', applyState);
      }
    };
  }, []);

  useEffect(function () {
    function onVis() {
      if (document.visibilityState === 'visible') {
        setAhora(Date.now());
      }
    }
    document.addEventListener('visibilitychange', onVis, { passive: true });
    return function () {
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // ── Mantener estado global para Mood Bar ──────────────
  useEffect(function () {
    window.__miTurnoState = {
      turnos: turnos,
      calc: calc,
      salario: salario,
      vh: vh,
      session: session
    };
    // Flag leída por sw-register.js para diferir el reload de
    // actualización si hay un turno en curso (no interrumpir el cronómetro).
    window.__mtTurnoActivo = !!activo;
  }, [turnos, calc, salario, vh, session, activo]);

  // ── Iniciar/detener rotación Mood Bar según pestaña ──
  useEffect(function () {
    if (tab === 'home') {
      if (window._startMoodRotation) window._startMoodRotation();
    } else {
      if (window._stopMoodRotation) window._stopMoodRotation();
    }
  }, [tab]);

  var vh = useMemo(
    function () {
      return salario / 240;
    },
    [salario]
  );
  var ahoraDate = useMemo(
    function () {
      return new Date(ahora);
    },
    [ahora]
  );
  var ahoraMin = Math.floor(ahora / 60000) * 60000;
  var ahoraDateCalc = useMemo(
    function () {
      return new Date(ahoraMin);
    },
    [ahoraMin]
  );

  var mesKey = ahoraDate.getFullYear() * 100 + ahoraDate.getMonth();
  var turnosMes = useMemo(
    function () {
      var ini = new Date(ahoraDate.getFullYear(), ahoraDate.getMonth(), 1);
      return turnos.filter(function (t) {
        return new Date(t.inicio) >= ini;
      });
    },
    [turnos, mesKey]
  );

  var calc = useMemo(
    function () {
      return doCalc(turnosMes, activo, ahoraDateCalc, vh);
    },
    [turnosMes, activo, ahoraMin, vh]
  );

  // ── Cálculo por quincena (solo si el modo está activo) ───────
  var quincena = useMemo(
    function () {
      if (!prefs.quincenaMode) return null;
      var rango = getQuincenaRange(ahoraDate, prefs);
      var tQ = filterTurnosRango(turnos, rango);
      // El activo se incluye en la quincena si su inicio cae dentro
      var activoEnRango =
        activo &&
        new Date(activo.inicio) >= rango.ini &&
        new Date(activo.inicio) < rango.fin
          ? activo
          : null;
      var calcQ = doCalc(tQ, activoEnRango, ahoraDateCalc, vh);
      return { rango: rango, turnos: tQ, calc: calcQ };
    },
    [prefs, turnos, activo, ahoraMin, vh, ahoraDate.getDate(), ahoraDate.getMonth()]
  );

  var quincenasMes = useMemo(
    function () {
      if (!prefs.quincenaMode) return null;
      var qs = getQuincenasMes(ahoraDate, prefs);
      var t1 = filterTurnosRango(turnos, qs.q1);
      var t2 = filterTurnosRango(turnos, qs.q2);
      var aEnQ1 = activo && new Date(activo.inicio) >= qs.q1.ini && new Date(activo.inicio) < qs.q1.fin ? activo : null;
      var aEnQ2 = activo && new Date(activo.inicio) >= qs.q2.ini && new Date(activo.inicio) < qs.q2.fin ? activo : null;
      return {
        q1: {
          rango: qs.q1,
          turnos: t1,
          calc: doCalc(t1, aEnQ1, ahoraDateCalc, vh)
        },
        q2: {
          rango: qs.q2,
          turnos: t2,
          calc: doCalc(t2, aEnQ2, ahoraDateCalc, vh)
        }
      };
    },
    [prefs, turnos, activo, ahoraMin, vh, ahoraDate.getMonth()]
  );

  var durActual = activo ? Math.round((ahora - new Date(activo.inicio)) / 60000) : 0;
  var festHoy = esFest(ahoraDate);

  function onIni() {
    haptic();
    var ini = new Date().toISOString();
    insertTurno(uid, ini).then(function (row) {
      var nuevo = { id: row.id, inicio: row.inicio, userId: uid };
      setActivo(nuevo);
      setShowOlv(false);
      showToast('Turno iniciado');
      queueAction(uid, 'setActivo', nuevo);
    });
  }

  function onFin() {
    if (!activo) return;
    haptic();
    var fin = new Date();
    var durSeg = (fin - new Date(activo.inicio)) / 1000;
    // Descartar turnos menores a 60 s — evita basura por doble-toque accidental
    if (durSeg < 60) {
      setActivo(null);
      setShowOlv(false);
      queueAction(uid, 'setActivo', null);
      showToast('Turno muy corto — no registrado');
      return;
    }
    var finISO = fin.toISOString();
    var turnoCerrado = { id: activo.id, inicio: activo.inicio, fin: finISO, userId: uid };
    setTurnos(function (p) {
      return [turnoCerrado].concat(p);
    });
    setActivo(null);
    setShowOlv(false);
    showToast('Turno cerrado');
    queueAction(uid, 'insertTurno', turnoCerrado);
    queueAction(uid, 'setActivo', null);
  }

  function onOlv(finISO) {
    if (!activo) return;
    haptic();
    var turnoCerrado = { id: activo.id, inicio: activo.inicio, fin: finISO, userId: uid };
    setTurnos(function (p) {
      return [turnoCerrado].concat(p);
    });
    setActivo(null);
    setShowOlv(false);
    showToast('Turno guardado');
    queueAction(uid, 'insertTurno', turnoCerrado);
    queueAction(uid, 'setActivo', null);
  }

  function onSalario(v) {
    haptic();
    setSalario(v);
    // Cualquier guardado explícito marca el salario como configurado,
    // incluso si coincide con el mínimo legal (caso válido).
    setSalarioConfigured(true);
    showToast('Salario actualizado');
    queueAction(uid, 'setSalario', { salario: v });
  }
  function onBorrar() {
    haptic();
    setTurnos([]);
    showToast('Historial borrado');
    queueAction(uid, 'deleteAllTurnos', {});
  }
  function onBorrarUno(id) {
    haptic();
    setTurnos(function (p) {
      return p.filter(function (t) {
        return t.id !== id;
      });
    });
    showToast('Turno eliminado');
    queueAction(uid, 'deleteTurno', { id: id });
  }
  // Estado para modal de exportar (PDF o Excel)
  var ex = useState(null);
  var exportMode = ex[0],
    setExportMode = ex[1]; // null | 'pdf' | 'xlsx'
  function onExportPDF() {
    haptic();
    setExportMode('pdf');
  }
  function onExportExcel() {
    haptic();
    setExportMode('xlsx');
  }

  if (loading) return h(SplashScreen, { exit: splashExit, plain: props.introPlayed });

  var tStr = ahoraDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  var TABS = [
    { id: 'home', icon: 'home', lbl: 'Inicio' },
    { id: 'dashboard', icon: 'chart', lbl: 'Análisis' },
    { id: 'ai', icon: 'sparkle', lbl: 'Asistente' },
    { id: 'history', icon: 'history', lbl: 'Historial' },
    { id: 'config', icon: 'settings', lbl: 'Ajustes' }
  ];
  var activeIdx = TABS.findIndex(function (t) {
    return t.id === tab;
  });
  if (activeIdx < 0) activeIdx = 0;

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } },
    showPinSetup
      ? h(PinSetup, {
        session: session,
        onDone: function (newPin) {
          haptic();
          var cur = leer(SKEY, {});
          if (cur) {
            cur.pin = newPin;
            grabar(SKEY, cur);
          }
          if (onSessionPatch) onSessionPatch({ pin: newPin });
          setShowPinSetup(false);
          showToast('PIN creado correctamente');
        },
        onSkip: function () {
          haptic();
          setShowPinSetup(false);
        }
      })
      : null,
    showOlv && activo
      ? h(ModalOlvidado, {
        inicio: activo.inicio,
        onGuardar: onOlv,
        onContinuar: function () {
          setShowOlv(false);
        }
      })
      : null,
    toast ? h('div', { className: 'toast' }, toast) : null,

    h(
      'div',
      { className: 'hdr' + (compact ? ' hdr--compact' : '') },
      h(
        'div',
        { className: 'hdr-l' },
        (function () {
          // Verde: hay internet y (es usuario local que no necesita cloud,
          //         o el cliente Supabase está activo).
          // Rojo: sin internet, o usuario en la nube sin CLOUD_MODE.
          var esLocal = !session || session.guest || session.pinOnly;
          var cloudOk = typeof CLOUD_MODE !== 'undefined' && CLOUD_MODE;
          var conectado = isOnlineStatus && (esLocal || cloudOk);
          var titulo = !isOnlineStatus
            ? 'Sin conexión a internet'
            : esLocal
              ? 'Conectado (modo local)'
              : cloudOk
                ? 'Conectado a la nube'
                : 'Sin conexión a la nube';
          return h('div', {
            className: 'hdr-led ' + (conectado ? 'on' : 'off'),
            title: titulo,
            'aria-label': titulo
          });
        })(),
        h('img', {
          src: 'img/logo-mark.svg',
          width: 24,
          height: 24,
          alt: '',
          draggable: false,
          style: { borderRadius: '6px', flexShrink: 0, display: 'block' }
        }),
        h(
          'div',
          { className: 'hdr-info' },
          h('div', { className: 'hdr-brand' }, 'Mi Turno'),
          h(
            'div',
            { className: 'hdr-meta' },
            h('span', { className: 'hdr-date' }, ahoraDate.toLocaleDateString('es-CO', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            }) + (festHoy ? ' · Fest' : '')),
            h('span', { className: 'hdr-clock' }, tStr)
          )
        )
      ),
      h(
        'div',
        { className: 'hdr-r' },
        h(
          'button',
          {
            className: 'icon-btn',
            onClick: function () {
              haptic();
              setTheme(theme === 'dark' ? 'light' : 'dark');
            }
          },
          theme === 'dark'
            ? h(
              'svg',
              {
                viewBox: '0 0 24 24',
                width: 18,
                height: 18,
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 2,
                strokeLinecap: 'round',
                strokeLinejoin: 'round'
              },
              h('circle', { cx: 12, cy: 12, r: 5 }),
              h('line', { x1: 12, y1: 1, x2: 12, y2: 3 }),
              h('line', { x1: 12, y1: 21, x2: 12, y2: 23 }),
              h('line', { x1: 4.22, y1: 4.22, x2: 5.64, y2: 5.64 }),
              h('line', { x1: 18.36, y1: 18.36, x2: 19.78, y2: 19.78 }),
              h('line', { x1: 1, y1: 12, x2: 3, y2: 12 }),
              h('line', { x1: 21, y1: 12, x2: 23, y2: 12 }),
              h('line', { x1: 4.22, y1: 19.78, x2: 5.64, y2: 18.36 }),
              h('line', { x1: 18.36, y1: 5.64, x2: 19.78, y2: 4.22 })
            )
            : h(
              'svg',
              {
                viewBox: '0 0 24 24',
                width: 18,
                height: 18,
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 2,
                strokeLinecap: 'round',
                strokeLinejoin: 'round'
              },
              h('path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' })
            )
        )
      )
    ),

    h(
      'div',
      { className: 'scr', ref: scrRef },
      tab === 'home'
        ? h(HomeTab, {
          calc: calc,
          activo: activo,
          ahora: ahoraDate,
          salario: salario,
          salarioConfigured: salarioConfigured,
          vh: vh,
          turnos: turnos,
          prefs: prefs,
          quincena: quincena,
          session: session,
          onIni: onIni,
          onFin: onFin,
          onOpenAssistant: function () {
            haptic();
            setTab('ai');
          },
          onOpenConfig: function () {
            haptic();
            setTab('config');
          }
        })
        : tab === 'dashboard'
          ? h(DashboardTab, {
            calc: calc,
            turnos: turnosMes,
            salario: salario,
            vh: vh,
            ahora: ahoraDate,
            themeKey: theme,
            prefs: prefs,
            quincenasMes: quincenasMes
          })
          : tab === 'ai'
            ? h(AsistenteTab, {
              turnos: turnosMes,
              turnosAll: turnos,
              calc: calc,
              salario: salario,
              vh: vh,
              session: session
            })
            : tab === 'history'
              ? h(HistoryTab, {
                turnos: turnos,
                activo: activo,
                durActual: durActual,
                onBorrar: onBorrar,
                onBorrarUno: onBorrarUno,
                onExportPDF: onExportPDF,
                onExportExcel: onExportExcel
              })
              : h(ConfigTab, {
                salario: salario,
                valorHora: vh,
                session: session,
                onSalario: onSalario,
                onSignOut: props.onSignOut,
                theme: theme,
                onThemeChange: setTheme,
                prefs: prefs,
                onPrefsChange: onPrefsChange
              })
    ),

    h(
      'div',
      { className: 'tabs' },
      h('div', {
        className: 'tab-indicator',
        style: { transform: 'translateX(' + activeIdx * 100 + '%)' }
      }),
      TABS.map(function (item) {
        return h(
          'button',
          {
            key: item.id,
            className: 'tab-btn ' + (tab === item.id ? 'on' : ''),
            onClick: function () {
              haptic();
              setTab(item.id);
            }
          },
          tabIcon(item.icon),
          h('div', { className: 'tab-label' }, item.lbl)
        );
      })
    ),

    // ── Modal Exportar Reporte (PDF/Excel) ──
    exportMode
      ? h(
        'div',
        {
          className: 'ovl',
          onClick: function (ev) {
            if (ev.target === ev.currentTarget) setExportMode(null);
          }
        },
        h(ExportReportModal, {
          format: exportMode,
          turnos: turnos,
          calc: calc,
          salario: salario,
          session: session,
          onClose: function () {
            setExportMode(null);
          }
        })
      )
      : null
  );
}
