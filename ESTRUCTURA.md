# Mi Turno · Estructura del proyecto (v71)

PWA de nómina inteligente para trabajadores por turnos en Colombia.
Sin build tools — vanilla JS ES5, React 18 vía CDN, Supabase como backend.

---

## Estadísticas

- **77 archivos** totales: 38 CSS + 39 JS
- Tamaño promedio JS: ~80–150 líneas por archivo
- Sin dependencias de build (no Webpack, no Vite, no Babel)
- Un `<script src="...">` por archivo en `index.html` — orden crítico de carga

---

## Árbol completo

```
mi-turno-BETA/
│
├── index.html              Punto de entrada — lista todos los scripts y estilos
├── sw.js                   Service Worker (split cache SHELL/CDN + Navigation Preload)
├── version.json            { "v": "vNN" } — detectado por SW para updates silenciosos
├── manifest.json           PWA: nombre, iconos, theme-color, display: standalone
├── vercel.json             Headers de seguridad + cache headers + rewrite SPA
│
├── icon-180.png            Apple Touch Icon
├── icon-192.png            PWA icon
├── icon-512.png            PWA icon splash
├── img/logo-mark.svg       Logo SVG
│
├── css/                    38 archivos — una responsabilidad por archivo
│   │
│   ├── base/               Fundamentos globales
│   │   ├── variables.css       Design tokens: colores, radios, sombras, espaciados
│   │   ├── reset.css           Reset CSS universal + box-sizing
│   │   ├── typography.css      DM Sans + Nunito; escala tipográfica
│   │   ├── background.css      Formas decorativas flotantes del fondo
│   │   ├── media-queries.css   Modo reducido (prefers-reduced-motion) y bajo consumo
│   │   └── blur-fix.css        Fix backdrop-filter en iOS Safari
│   │
│   ├── layout/             Estructura de pantalla
│   │   ├── header.css          Barra superior flotante con tabs
│   │   ├── scroll.css          Contenedor principal de scroll con safe-area
│   │   ├── hero-card.css       Tarjeta principal del turno activo
│   │   ├── progress-bar.css    Barra de progreso del salario del período
│   │   ├── action-button.css   Botón grande Iniciar / Finalizar turno
│   │   ├── shapes.css          Figuras decorativas de fondo
│   │   ├── fade-animations.css Animaciones de entrada fadeUp
│   │   ├── misc-animations.css Pulse, shimmer, spin-in y otras
│   │   └── misc.css            Espaciados y helpers de layout restantes
│   │
│   ├── components/         Componentes reutilizables
│   │   ├── cards.css           Tarjetas .card con glassmorphism
│   │   ├── buttons.css         .btn, .btn-accent, .btn-danger, .btn-ghost
│   │   ├── buttons-glass.css   Botones de vidrio para overlays
│   │   ├── inputs.css          Campos de texto, labels, estados de error
│   │   ├── switches.css        Toggle tipo iOS
│   │   ├── config-rows.css     Filas de ajustes (ícono + label + control)
│   │   ├── dashboard-hero.css  Sección de proyección salarial
│   │   ├── dashboard-kpis.css  Tarjetas KPI (horas, recargos, total)
│   │   ├── dashboard-chart.css Gráfico de barras Chart.js
│   │   ├── dashboard-tip.css   Caja de consejo del asistente
│   │   ├── assistant-chat.css  Burbujas de chat del asistente IA
│   │   ├── history-list.css    Lista de turnos cerrados
│   │   ├── fast-pin.css        Pantalla de acceso rápido por PIN
│   │   ├── auth-screen.css     Pantalla de login / registro
│   │   ├── misc.css            Componentes variados (badges, toasts, etc.)
│   │   └── dark-mode-overrides.css  Ajustes de color para modo oscuro
│   │
│   ├── modals/             Capas superpuestas
│   │   ├── overlay.css         Fondo oscuro semitransparente
│   │   ├── modal-card.css      Tarjeta modal centrada (desktop + mobile)
│   │   ├── bottom-sheets.css   Hojas deslizables desde el borde inferior
│   │   ├── auth-screen.css     Variantes de modal para flujos de auth
│   │   ├── assistant-chat.css  Chat inline del asistente IA
│   │   ├── time-picker.css     Selector de hora tipo drum-roll
│   │   ├── splash.css          Pantalla de carga inicial animada
│   │   ├── misc.css            OTP, progress-bars de modales, misc
│   │   └── dark-overrides.css  Overrides de modales en modo oscuro
│   │
│   └── animations/
│       └── keyframes.css       Todos los @keyframes del proyecto centralizados
│
├── js/                     39 archivos — todos exponen globales en window.*
│   │
│   ├── config.js               Credenciales Supabase (SUPABASE_URL + ANON_KEY)
│   ├── theme-boot.js           Aplica dark/light-mode antes del primer render
│   │
│   ├── config/             Inicialización del entorno
│   │   ├── react-init.js       Verifica React + aliases (useState, useEffect, useRef...)
│   │   ├── env.js              Detecta iOS, Safari, standalone mode
│   │   ├── viewport-fix.js     Corrige --vh en iOS Safari
│   │   └── globals.js          MT_APP_VERSION, CLOUD_MODE, SUPA global
│   │
│   ├── utils/              Utilidades puras (sin efectos de red ni UI)
│   │   ├── storage.js          leer(), grabar(), borrarKey(), dk() — wrappers localStorage
│   │   ├── format.js           fCOP(), fDur(), fechaCorta()
│   │   ├── haptic.js           haptic() — vibración táctil iOS/Android
│   │   ├── error-logger.js     captura y log de errores en producción
│   │   ├── network.js          isOnline(), onOnline(), withTimeout(), traducirError()
│   │   ├── uuid.js             generateUUID(), hashP()
│   │   ├── icons.js            SVG icons como strings (sin deps de ícono)
│   │   ├── festivos.js         esFest(date) — festivos colombianos hardcodeados
│   │   ├── time.js             _saludoHora(), helpers de rangos horarios
│   │   ├── validation.js       Validadores de email, PIN, contraseña
│   │   ├── otp.js              Generación y verificación de OTP local (crypto.getRandomValues)
│   │   └── password-hash.js    PBKDF2-SHA256 + salt — hash de password offline
│   │
│   ├── services/           Lógica de negocio y datos
│   │   ├── supabase.js         Helpers CRUD: supaGetTurnos, supaUpsertTurnoActivo, etc.
│   │   ├── supabase-init.js    Inicializa el cliente SUPA con sesión persistida
│   │   ├── session-sync.js     Detecta cierre de sesión desde otro dispositivo (Realtime)
│   │   ├── calculator.js       doCalc() — motor de cálculo: recargos, extra, festivos
│   │   ├── quincena.js         Lógica de modo quincena (períodos 1-15 / 16-fin)
│   │   ├── data.js             cargarDatos(), setTurnos(), setSalario() — fuente de verdad local
│   │   ├── ai.js               Asistente IA offline: NLP, respuestas, contexto
│   │   ├── ai-history.js       Persistencia del historial de chat del asistente
│   │   ├── ai-greeting.js      Saludo personalizado según hora y contexto del turno
│   │   ├── export-files.js     exportPDF(), exportExcel() — descarga directa
│   │   └── export-email.js     enviarReportePorEmail(), exportPDFBase64() — vía Edge Function
│   │
│   ├── tabs/               Pantallas principales (5 tabs)
│   │   ├── home.js             Tab Inicio — hero card, botón turno, salario del período
│   │   ├── dashboard.js        Tab Análisis — KPIs, gráfico, proyección
│   │   ├── assistant.js        Tab Asistente — chat con IA offline
│   │   ├── history.js          Tab Historial — lista de turnos cerrados
│   │   ├── config.js           Tab Ajustes — salario, PIN, cuenta, modo quincena
│   │   └── sync-queue.js       Cola offline-first: queueAction(), processQueue()
│   │
│   ├── modals/             Ventanas modales y bottom-sheets
│   │   ├── splash.js           Pantalla de carga animada con spinner
│   │   ├── error-viewer.js     Modal de error con detalle técnico
│   │   ├── email-compose-card.js  Tarjeta de composición de email (chat del asistente)
│   │   ├── export-report.js    Modal exportar PDF/Excel + solicitud de reenvío por email
│   │   ├── forgot-password.js  Flujo recuperar contraseña
│   │   ├── forgot-pin.js       Flujo recuperar PIN (patrón OTP local de 4 fases)
│   │   ├── pin-setup.js        Configurar PIN por primera vez
│   │   ├── manage-account.js   Cambiar PIN / email / contraseña (patrón OTP local)
│   │   ├── diagnostico.js      Modal de diagnóstico técnico (solo admin)
│   │   ├── asignar-pins.js     Asignar PINs a usuarios (solo admin)
│   │   └── usuarios.js         Gestión de usuarios (solo admin)
│   │
│   └── app/                Inicialización y shell de la aplicación
│       ├── auth-screen.js      Pantalla login / registro / recuperación
│       ├── fast-pin-screen.js  Acceso rápido con PIN (sin email + password)
│       ├── app-main.js         Componente App principal — router de tabs + modales
│       ├── root.js             Componente Root — sesión, splash, modo offline
│       ├── sw-register.js      Registro del SW + updates silenciosos
│       └── init.js             ReactDOM.createRoot('#root').render(<Root/>)
│
├── supabase/
│   └── functions/
│       ├── send-report/        Edge Function: reenvía reporte (PDF/Excel) al admin
│       └── send-pin/           Edge Function: envía PIN por email
│
├── sql/
│   └── email_logs.sql          Migración: tabla de log de envíos de email
│
├── tests/
│   ├── smoke.cjs               Tests de unidad: calculator, format, festivos, OTP
│   └── e2e/
│       ├── 01-boot.spec.mjs    E2E: la app carga sin errores
│       └── 02-flujo-invitado.spec.mjs  E2E: flujo completo sin cuenta
│
└── scripts/
    ├── bump.sh                 Sincroniza globals.js + sw.js + version.json en una sola vez
    ├── check.sh                Valida sintaxis JS + versiones + precache del SW
    └── setup-hooks.sh          Instala git hooks de husky
```

---

## Orden de carga de scripts

El orden en `index.html` es crítico porque no hay módulos ES: cada archivo expone
globals en `window.*` que los siguientes necesitan.

```
1.  config/react-init.js    → verifica React, crea aliases (useState, h, etc.)
2.  config/env.js           → detecta iOS / standalone
3.  config/viewport-fix.js  → fix --vh
4.  config/globals.js       → MT_APP_VERSION, CLOUD_MODE

5.  utils/*.js              → storage → format → haptic → ... → password-hash

6.  services/supabase.js    → helpers CRUD (depende de utils)
7.  services/supabase-init.js → inicializa SUPA (depende de supabase.js)
8.  services/session-sync.js  → vigila sesión (depende de supabase-init.js)
9.  services/calculator.js    → doCalc (depende de utils/festivos, utils/time)
10. services/quincena.js      → lógica de períodos
11. services/data.js          → fuente de verdad local
12. services/ai.js + ai-*.js  → asistente IA
13. services/export-*.js      → PDF / Excel / email

14. tabs/*.js               → home, dashboard, assistant, history, config, sync-queue

15. modals/*.js             → splash, error-viewer, email-compose, export-report,
                              forgot-*, pin-setup, manage-account, diagnostico,
                              asignar-pins, usuarios

16. app/auth-screen.js      → pantalla de auth
17. app/fast-pin-screen.js  → acceso rápido
18. app/app-main.js         → App principal
19. app/root.js             → Root container
20. app/sw-register.js      → SW (no bloquea render)
21. app/init.js             → ReactDOM.render → ¡app visible!
```

---

## Dónde editar según el síntoma

| Síntoma | Archivo(s) |
|---|---|
| Bug en cálculo de recargos | `js/services/calculator.js` |
| El salario no se guarda / sincroniza | `js/services/data.js` |
| Sync entre dispositivos roto | `js/tabs/sync-queue.js` · `js/services/supabase.js` |
| Login / registro no funciona | `js/app/auth-screen.js` · `js/services/supabase-init.js` |
| PIN no funciona | `js/modals/pin-setup.js` · `js/modals/forgot-pin.js` |
| Pestaña Inicio visual | `js/tabs/home.js` · `css/layout/hero-card.css` |
| Pestaña Análisis | `js/tabs/dashboard.js` · `css/components/dashboard-*.css` |
| Asistente IA responde mal | `js/services/ai.js` |
| Exportar PDF / Excel | `js/services/export-files.js` |
| Envío por email | `js/services/export-email.js` · `js/modals/export-report.js` · `supabase/functions/send-report/` |
| App no se actualiza / bucle de reload | `js/app/sw-register.js` · `sw.js` |
| Estilos en modo oscuro | `css/components/dark-mode-overrides.css` · `css/modals/dark-overrides.css` |
| Accesibilidad (ARIA, roles, lector de pantalla) | tabs/*.js · app/auth-screen.js · app/fast-pin-screen.js (atributos ARIA inline) |
| Contraste de texto reprobando AA | `css/base/variables.css` (token `--muted`) |

---

## Accesibilidad (WCAG 2.1 AA)

Desde v71 la app pasa **axe-core con 0 violaciones** en las 6 pantallas. La accesibilidad vive en **atributos ARIA inline** dentro de los componentes (no en archivos CSS aparte — eso rompió v67). Reglas: `div`→`section`/`main` preservando `className`; `aria-label` solo en elementos con `role`; íconos decorativos con `aria-hidden`; `--muted` ≥ 4.5:1. Ver detalle en `CLAUDE.md` y `README.md`.

---

*Actualizado en v71 — Junio 2026*
