// ════════════════════════════════════════════════════════════════
//  MI TURNO · app/install-prompt.js
//  Prompt de instalación PWA — híbrido iOS / Android
//
//  Android: captura beforeinstallprompt → banner tuyo → diálogo
//           nativo del sistema al tocar (parece del SO, no de la app)
//  iOS:     bottom-sheet a colores de Mi Turno con 3 pasos
//
//  Lógica de aparición:
//   - Solo si la app NO está ya instalada (display-mode standalone)
//   - Solo si el usuario no la descartó antes (mt_install_dismissed)
//   - Solo después del 2do uso (mt_open_count >= 2)
//   - Solo una vez por sesión de pantalla
// ════════════════════════════════════════════════════════════════

(function () {
  // ── Detección de entorno ──────────────────────────────────────
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (isStandalone) return; // ya instalada, nada que hacer

  var dismissed = leer('mt_install_dismissed', false);
  if (dismissed) return;

  var openCount = parseInt(leer('mt_open_count', '0'), 10) || 0;
  openCount += 1;
  grabar('mt_open_count', String(openCount));

  if (openCount < 2) return; // primer uso: no molestar

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isAndroid = /android/i.test(navigator.userAgent);

  if (!isIOS && !isAndroid) return; // desktop: no aplica

  // ── Estado compartido ─────────────────────────────────────────
  var _deferredPrompt = null; // evento beforeinstallprompt guardado
  var _shown = false; // evitar doble render por sesión

  // Capturamos el evento nativo de Android antes de que el browser
  // lo muestre por su cuenta, así controlamos cuándo aparece.
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    _deferredPrompt = e;
    if (!_shown) _tryShow();
  });

  // iOS no dispara beforeinstallprompt: mostramos directo
  if (isIOS) {
    // Pequeño delay para que la app termine de cargar visualmente
    setTimeout(function () {
      if (!_shown) _tryShow();
    }, 2800);
  }

  function _tryShow() {
    // Doble chequeo por si algo cambió mientras esperábamos el delay
    if (leer('mt_install_dismissed', false)) return;
    if (_shown) return;
    _shown = true;
    _renderPrompt();
  }

  function _dismiss() {
    grabar('mt_install_dismissed', true);
    var el = document.getElementById('mt-install-prompt');
    if (el) {
      el.style.transform = 'translateY(110%)';
      el.style.opacity = '0';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 380);
    }
  }

  // ── Android: lanza el diálogo nativo ─────────────────────────
  function _triggerAndroid() {
    if (!_deferredPrompt) return;
    _deferredPrompt.prompt();
    _deferredPrompt.userChoice.then(function (result) {
      _deferredPrompt = null;
      if (result.outcome === 'accepted') {
        grabar('mt_install_dismissed', true);
      }
      _dismiss();
    });
  }

  // ── Render ────────────────────────────────────────────────────
  function _renderPrompt() {
    var container = document.createElement('div');
    container.id = 'mt-install-prompt';

    // Overlay semitransparente solo en iOS (bottom-sheet necesita contexto)
    if (isIOS) {
      Object.assign(container.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '8500',
        display: 'flex',
        alignItems: 'flex-end',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        transition: 'opacity 0.35s ease',
        opacity: '0'
      });
    } else {
      // Android: solo el banner en la parte inferior, sin overlay
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        zIndex: '8500',
        transition: 'transform 0.38s cubic-bezier(.22,.8,.36,1), opacity 0.38s ease',
        transform: 'translateY(110%)',
        opacity: '0'
      });
    }

    document.body.appendChild(container);

    // Forzar reflow para que la transición de entrada se vea
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (isIOS) {
          container.style.opacity = '1';
        } else {
          container.style.transform = 'translateY(0)';
          container.style.opacity = '1';
        }
      });
    });

    if (isAndroid) {
      _renderAndroidBanner(container);
    } else {
      _renderIOSSheet(container);
      // Tocar fuera del sheet cierra
      container.addEventListener('click', function (e) {
        if (e.target === container) _dismiss();
      });
    }
  }

  // ── Banner Android ────────────────────────────────────────────
  function _renderAndroidBanner(container) {
    var banner = document.createElement('div');
    Object.assign(banner.style, {
      background: 'var(--surface, #fff)',
      borderTop: '1px solid var(--border, rgba(0,0,0,.09))',
      borderRadius: '20px 20px 0 0',
      padding: '16px 16px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.13)'
    });

    // Ícono app
    var ico = document.createElement('img');
    ico.src = 'icon-192.png';
    ico.alt = 'Mi Turno';
    Object.assign(ico.style, {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      flexShrink: '0'
    });

    // Textos
    var texts = document.createElement('div');
    texts.style.flex = '1';
    var title = document.createElement('div');
    title.textContent = 'Agregar Mi Turno al inicio';
    Object.assign(title.style, {
      fontWeight: '700',
      fontSize: '15px',
      color: 'var(--text-1, #111)',
      marginBottom: '2px'
    });
    var sub = document.createElement('div');
    sub.textContent = 'Se abre al instante · funciona sin internet';
    Object.assign(sub.style, {
      fontSize: '13px',
      color: 'var(--text-2, #666)'
    });
    texts.appendChild(title);
    texts.appendChild(sub);

    // Botón instalar
    var btnInstall = document.createElement('button');
    btnInstall.textContent = 'Instalar';
    Object.assign(btnInstall.style, {
      background: 'var(--accent, #4f73f8)',
      color: '#fff',
      border: 'none',
      borderRadius: '10px',
      padding: '9px 18px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
      flexShrink: '0',
      fontFamily: 'inherit'
    });
    btnInstall.addEventListener('click', function () {
      if (typeof haptic === 'function') haptic();
      _triggerAndroid();
    });

    // X cerrar
    var btnClose = document.createElement('button');
    btnClose.textContent = '✕';
    Object.assign(btnClose.style, {
      background: 'none',
      border: 'none',
      color: 'var(--text-2, #888)',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '4px',
      flexShrink: '0',
      fontFamily: 'inherit',
      lineHeight: '1'
    });
    btnClose.addEventListener('click', function () {
      if (typeof haptic === 'function') haptic();
      _dismiss();
    });

    banner.appendChild(ico);
    banner.appendChild(texts);
    banner.appendChild(btnInstall);
    banner.appendChild(btnClose);
    container.appendChild(banner);
  }

  // ── Bottom-sheet iOS ──────────────────────────────────────────
  function _renderIOSSheet(container) {
    var sheet = document.createElement('div');
    Object.assign(sheet.style, {
      background: 'var(--surface, #fff)',
      borderRadius: '24px 24px 0 0',
      padding: '0 0 40px',
      width: '100%',
      boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
      transform: 'translateY(60px)',
      transition: 'transform 0.38s cubic-bezier(.22,.8,.36,1)',
      maxHeight: '85vh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    });

    // Animar la hoja hacia arriba
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sheet.style.transform = 'translateY(0)';
      });
    });

    // Handle
    var handle = document.createElement('div');
    Object.assign(handle.style, {
      width: '36px',
      height: '4px',
      background: 'var(--border, rgba(0,0,0,.15))',
      borderRadius: '2px',
      margin: '12px auto 0'
    });

    // Header
    var header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px 12px'
    });
    var hTitle = document.createElement('div');
    hTitle.textContent = 'Agregar a inicio';
    Object.assign(hTitle.style, {
      fontWeight: '700',
      fontSize: '17px',
      color: 'var(--text-1, #111)'
    });
    var btnClose = document.createElement('button');
    btnClose.textContent = '✕';
    Object.assign(btnClose.style, {
      background: 'var(--surface2, #f0f0f0)',
      border: 'none',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      fontSize: '14px',
      cursor: 'pointer',
      color: 'var(--text-2, #666)',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    btnClose.addEventListener('click', function () {
      if (typeof haptic === 'function') haptic();
      _dismiss();
    });
    header.appendChild(hTitle);
    header.appendChild(btnClose);

    // Cuerpo
    var body = document.createElement('div');
    body.style.padding = '4px 20px 0';

    // Por qué
    var why = document.createElement('div');
    Object.assign(why.style, {
      fontSize: '14px',
      color: 'var(--text-2, #555)',
      lineHeight: '1.5',
      marginBottom: '24px'
    });
    why.textContent =
      'Se abre como una app normal, sin el navegador, ocupa casi nada y funciona sin internet.';
    body.appendChild(why);

    // Pasos
    var pasos = [
      { ico: '⬆️', txt: 'Tocá el botón Compartir de la barra de abajo' },
      { ico: '➕', txt: 'Deslizá y elegí "Añadir a pantalla de inicio"' },
      { ico: '✅', txt: 'Tocá "Añadir" y listo — ¡ya aparece en tu inicio!' }
    ];

    pasos.forEach(function (paso, i) {
      var row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        marginBottom: i < pasos.length - 1 ? '20px' : '0'
      });

      var num = document.createElement('div');
      Object.assign(num.style, {
        minWidth: '30px',
        height: '30px',
        borderRadius: '50%',
        background: 'var(--accent, #4f73f8)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '14px',
        flexShrink: '0'
      });
      num.textContent = String(i + 1);

      var content = document.createElement('div');
      content.style.paddingTop = '3px';

      var icoEl = document.createElement('div');
      icoEl.style.fontSize = '20px';
      icoEl.style.marginBottom = '3px';
      icoEl.textContent = paso.ico;

      var txtEl = document.createElement('div');
      Object.assign(txtEl.style, {
        fontSize: '15px',
        color: 'var(--text-1, #111)',
        lineHeight: '1.4'
      });
      txtEl.textContent = paso.txt;

      content.appendChild(icoEl);
      content.appendChild(txtEl);
      row.appendChild(num);
      row.appendChild(content);
      body.appendChild(row);
    });

    // Nota Safari-only
    var nota = document.createElement('div');
    Object.assign(nota.style, {
      marginTop: '20px',
      padding: '12px 14px',
      background: 'var(--accent-dim, rgba(79,115,248,.08))',
      border: '1px solid var(--accent, #4f73f8)',
      borderRadius: '12px',
      fontSize: '13px',
      color: 'var(--accent, #4f73f8)',
      lineHeight: '1.45'
    });
    nota.textContent =
      'Disponible desde Safari y Chrome en iPhone. Si usás otro navegador, abrí la app en uno de estos dos.';
    body.appendChild(nota);

    sheet.appendChild(handle);
    sheet.appendChild(header);
    sheet.appendChild(body);
    container.appendChild(sheet);
  }
})();
