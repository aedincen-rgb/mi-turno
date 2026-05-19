// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/app-main.js
//  Componente principal App con tabs
// ════════════════════════════════════════════════════════════════
function SplashScreen(props) {
  var cls = 'splash' + (props.exit ? ' splash--exit' : '') + (props.plain ? ' splash--plain' : '');
  return h(
    'div',
    { className: cls },
    h(
      'div',
      { className: 'sp-logo-wrap' },
      h('img', {
        src: 'img/logo-mark.svg',
        className: 'sp-logo',
        alt: 'Mi Turno',
        draggable: false
      }),
      h('span', { className: 'sp-glow' }),
      h('span', { className: 'sp-ping' }),
      h('span', { className: 'sp-ping-2' })
    ),
    h('div', { className: 'sp-ttl' }, 'Mi Turno'),
    h('div', { className: 'sp-sub' }, 'Colombia · Nómina inteligente'),
    h(
      'div',
      { className: 'sp-dots' },
      h('span', { className: 'sp-dot' }),
      h('span', { className: 'sp-dot' }),
      h('span', { className: 'sp-dot' })
    )
  );
}

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

  // Modo compacto del header al hacer scroll (tomado de tu rama master + mejorado)
  var cp = useState(false);
  var compact = cp[0],
    setCompact = cp[1];
  var scrRef = useRef(null);
  useEffect(function () {
    var el = scrRef.current;
    if (!el) return;
    function handleScroll() {
      var next = el.scrollTop > 24;
      setCompact(function (prev) {
        return prev === next ? prev : next;
      });
    }
    el.addEventListener('scroll', handleScroll, { passive: true });
    return function () {
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
          setSalario(data.salario || SMIN);
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

  var activoRef = useRef(activo);
  activoRef.current = activo;
  var showOlvRef = useRef(showOlv);
  showOlvRef.current = showOlv;

  useEffect(
    function () {
      var to = null;
      function schedule() {
        if (!activoRef.current || showOlvRef.current) {
          return;
        }
        var inicio = new Date(activoRef.current.inicio).getTime();
        var elapsed = Date.now() - inicio;
        if (elapsed >= U12H) {
          setShowOlv(true);
          return;
        }
        var remaining = U12H - elapsed;
        to = setTimeout(function () {
          if (activoRef.current && !showOlvRef.current) {
            setShowOlv(true);
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
      .catch(function () {});
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

  var durActual = activo ? Math.round((ahora - new Date(activo.inicio)) / 60000) : 0;

  // Escribe en cloud: intenta directo si hay red, encola si no.
  // Todas las ops son idempotentes → sin riesgo de duplicados al re-intentar.
  function cloudSync(op, directFn) {
    if (!isCloud) return;
    enqueueOp(op);
    if (navigator.onLine) flushSyncQueue(uid).catch(function () {});
    else directFn && directFn(); // noop placeholder
  }

  function onIni() {
    haptic();
    var ini = new Date().toISOString();
    insertTurno(uid, ini).then(function (row) {
      var nuevo = { id: row.id, inicio: row.inicio, userId: uid };
      setActivo(nuevo);
      setShowOlv(false);
      showToast('Turno iniciado');
      cloudSync({ type: 'setActivo', uid: uid, data: nuevo });
    });
  }

  function onFin() {
    if (!activo) return;
    haptic();
    var fin = new Date().toISOString();
    var turnoCerrado = { id: activo.id, inicio: activo.inicio, fin: fin, userId: uid };
    setTurnos(function (p) {
      return [turnoCerrado].concat(p);
    });
    setActivo(null);
    setShowOlv(false);
    showToast('Turno cerrado');
    cloudSync({ type: 'insertTurno', uid: uid, data: turnoCerrado });
    cloudSync({ type: 'setActivo', uid: uid, data: null });
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
    cloudSync({ type: 'insertTurno', uid: uid, data: turnoCerrado });
    cloudSync({ type: 'setActivo', uid: uid, data: null });
  }

  function onSalario(v) {
    haptic();
    setSalario(v);
    showToast('Salario actualizado');
    cloudSync({ type: 'setSalario', uid: uid, data: v });
  }
  function onBorrar() {
    haptic();
    setTurnos([]);
    showToast('Historial borrado');
    cloudSync({ type: 'deleteAllTurnos', uid: uid });
  }
  function onBorrarUno(id) {
    haptic();
    setTurnos(function (p) {
      return p.filter(function (t) {
        return t.id !== id;
      });
    });
    showToast('Turno eliminado');
    cloudSync({ type: 'deleteTurno', uid: uid, id: id });
  }
  // Estado para modal de exportar (PDF o Excel)
  var ex = useState(null);
  var exportMode = ex[0],
    setExportMode = ex[1]; // null | 'pdf' | 'xlsx'

  var onlineState = useState(navigator.onLine);
  var isOnline = onlineState[0],
    setIsOnline = onlineState[1];
  useEffect(function () {
    function goOn() {
      setIsOnline(true);
    }
    function goOff() {
      setIsOnline(false);
    }
    window.addEventListener('online', goOn);
    window.addEventListener('offline', goOff);
    return function () {
      window.removeEventListener('online', goOn);
      window.removeEventListener('offline', goOff);
    };
  }, []);

  // Flush cola offline cuando vuelve la red
  useEffect(
    function () {
      if (isOnline && isCloud) flushSyncQueue(uid).catch(function () {});
    },
    [isOnline]
  );

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
  var dStr =
    ahoraDate.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) +
    (esFest(ahoraDate) ? ' · Fest' : '');

  function tabIcon(name) {
    var c = {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.7,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: 'tab-icon-svg'
    };
    if (name === 'home')
      return h(
        'svg',
        c,
        h('circle', { cx: 12, cy: 14, r: 7.5 }),
        h('path', { d: 'M12 10 L12 14 L15 14' }),
        h('path', { d: 'M9.5 3 L14.5 3' }),
        h('path', { d: 'M12 3 L12 6.5' })
      );
    if (name === 'chart')
      return h(
        'svg',
        c,
        h('path', { d: 'M6 20 L6 13' }),
        h('path', { d: 'M12 20 L12 6' }),
        h('path', { d: 'M18 20 L18 10' }),
        h('path', { d: 'M4 21 L20 21' })
      );
    if (name === 'sparkle')
      return h(
        'svg',
        c,
        h('path', { d: 'M12 3 L13.2 10.8 L21 12 L13.2 13.2 L12 21 L10.8 13.2 L3 12 L10.8 10.8 Z' })
      );
    if (name === 'history')
      return h(
        'svg',
        c,
        h('circle', { cx: 12, cy: 12, r: 9 }),
        h('path', { d: 'M12 7 L12 12 L15.5 14' })
      );
    if (name === 'settings')
      return h(
        'svg',
        c,
        h('path', { d: 'M4 7.5 L10.5 7.5' }),
        h('path', { d: 'M14.5 7.5 L20 7.5' }),
        h('circle', { cx: 12.5, cy: 7.5, r: 1.9 }),
        h('path', { d: 'M4 16.5 L6.5 16.5' }),
        h('path', { d: 'M10.5 16.5 L20 16.5' }),
        h('circle', { cx: 8.5, cy: 16.5, r: 1.9 })
      );
    return null;
  }

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
        h('span', { className: 'hdr-led ' + (isOnline ? 'hdr-led-on' : 'hdr-led-off') }),
        h('img', {
          src: 'img/logo-mark.svg',
          width: 24,
          height: 24,
          alt: '',
          draggable: false,
          style: { borderRadius: 6, flexShrink: 0, display: 'block' }
        }),
        h(
          'div',
          { className: 'hdr-info' },
          h('div', { className: 'hdr-brand' }, 'Mi Turno'),
          h(
            'div',
            { className: 'hdr-meta' },
            h('span', { className: 'hdr-date' }, dStr),
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
            vh: vh,
            onIni: onIni,
            onFin: onFin
          })
        : tab === 'dashboard'
          ? h(DashboardTab, {
              calc: calc,
              turnos: turnosMes,
              salario: salario,
              vh: vh,
              ahora: ahoraDate,
              themeKey: theme
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
                  onThemeChange: setTheme
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
